from __future__ import annotations

import json
import os
import shlex
import socket
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
HOST = "127.0.0.1"
START_TIMEOUT_SECONDS = 90
TASK_TIMEOUT_SECONDS = 180
POLL_INTERVAL_SECONDS = 2
TERMINAL_STATUSES = {"passed", "failed", "needs_review"}


class ServerProcess:
    def __init__(self, port: int):
        self.port = port
        self.process: subprocess.Popen[str] | None = None
        self.output: list[str] = []

    def __enter__(self) -> "ServerProcess":
        command_template = os.environ.get(
            "CODEXFLOW_SMOKE_SERVER_COMMAND",
            "npm start -- --hostname {host} --port {port}",
        )
        command = shlex.split(command_template.format(host=HOST, port=self.port))
        env = {
            **os.environ,
            "PORT": str(self.port),
            "HOSTNAME": HOST,
            "NEXT_TELEMETRY_DISABLED": "1",
        }
        self.process = subprocess.Popen(
            command,
            cwd=REPO_ROOT,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        self._wait_until_ready()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if not self.process:
            return

        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=5)

        if self.process.stdout:
            try:
                remaining = self.process.stdout.read()
            except Exception:
                remaining = ""
            if remaining:
                self.output.append(remaining)

    @property
    def base_url(self) -> str:
        return f"http://{HOST}:{self.port}"

    def _drain_output(self) -> None:
        if not self.process or not self.process.stdout:
            return

        while True:
            line = self.process.stdout.readline()
            if not line:
                break
            self.output.append(line)
            if len(self.output) > 400:
                self.output = self.output[-400:]

    def _wait_until_ready(self) -> None:
        deadline = time.time() + START_TIMEOUT_SECONDS
        last_error: Exception | None = None

        while time.time() < deadline:
            if self.process and self.process.poll() is not None:
                self._drain_output()
                raise RuntimeError(
                    f"Server exited early with code {self.process.returncode}.\n{self.tail_output()}"
                )

            try:
                response = request_json(f"{self.base_url}/api/tasks")
                if isinstance(response, dict) and "tasks" in response:
                    return
            except Exception as error:  # pragma: no cover - readiness only
                last_error = error
                self._drain_output()
                time.sleep(1)

        raise TimeoutError(
            f"Timed out waiting for server readiness. Last error: {last_error}\n{self.tail_output()}"
        )

    def tail_output(self) -> str:
        if not self.output:
            return "<no server output captured>"
        joined = "".join(self.output)
        return joined[-8000:]


class FrontendBackendSmokeTests(unittest.TestCase):
    maxDiff = None

    def test_create_run_retry_and_timeline_flows(self) -> None:
        port = get_free_port()

        with ServerProcess(port) as server:
            collection_before = request_json(f"{server.base_url}/api/tasks")
            self.assertIsInstance(collection_before, dict)
            self.assertIn("tasks", collection_before)

            for route in ("/", "/board", "/onboarding"):
                status_code, body = request_text(f"{server.base_url}{route}")
                self.assertEqual(status_code, 200, msg=f"Expected {route} to return 200")
                self.assertTrue(body, msg=f"Expected non-empty HTML response for {route}")

            project_payload = request_json(
                f"{server.base_url}/api/projects",
                method="POST",
                data={
                    "name": f"Smoke project {uuid.uuid4().hex[:6]}",
                    "repoPath": ".",
                    "description": "Connectivity smoke project for issue/report/task flow.",
                },
                expected_status=201,
            )
            project = project_payload["project"]
            self.assertIn("id", project)

            projects_collection = request_json(f"{server.base_url}/api/projects")
            self.assertTrue(any(item["id"] == project["id"] for item in projects_collection["projects"]))

            title = f"Connectivity smoke {uuid.uuid4().hex[:8]}"
            created_payload = request_json(
                f"{server.base_url}/api/tasks",
                method="POST",
                data={
                    "title": title,
                    "prompt": "Smoke test CodexFlow create, run, retry, and timeline connectivity.",
                    "projectId": project["id"],
                    "taskKind": "issue",
                    "repoPath": ".",
                },
                expected_status=201,
            )
            created_task = require_task(created_payload)
            task_id = created_task["id"]
            self.assertEqual(created_task["title"], title)
            self.assertEqual(created_task["repoPath"], ".")
            self.assertEqual(created_task["projectId"], project["id"])
            self.assertEqual(created_task["taskKind"], "issue")
            self.assertIn(created_task["status"], {"queued", "running"})

            moved_payload = request_json(
                f"{server.base_url}/api/tasks/{task_id}/move",
                method="POST",
                data={
                    "status": "running",
                    "position": 1234,
                },
                expected_status=200,
            )
            moved_task = require_task(moved_payload)
            self.assertEqual(moved_task["id"], task_id)
            self.assertEqual(moved_task["status"], "running")
            self.assertEqual(moved_task["boardPosition"], 1234)

            run_payload = request_json(
                f"{server.base_url}/api/tasks/{task_id}/run",
                method="POST",
                data={},
                expected_status=200,
            )
            run_task = require_task(run_payload)
            self.assertEqual(run_task["id"], task_id)
            self.assertIn(run_task["status"], {"queued", "running"})

            collection_after = request_json(f"{server.base_url}/api/tasks")
            listed_ids = {task["id"] for task in collection_after["tasks"]}
            self.assertIn(task_id, listed_ids)

            terminal_task = poll_task_until_terminal(server.base_url, task_id, server.tail_output)
            self.assertIn(terminal_task["status"], {"passed", "needs_review"})
            self.assertNotEqual(terminal_task["lintStatus"], "failed")
            self.assertNotEqual(terminal_task["testStatus"], "failed")
            self.assertTrue(terminal_task["timeline"], msg="Expected timeline events after task execution")

            timeline_payload = request_json(f"{server.base_url}/api/tasks/{task_id}/timeline")
            self.assertEqual(timeline_payload["taskId"], task_id)
            timeline_kinds = {event["kind"] for event in timeline_payload["timeline"]}
            self.assertIn("task_created", timeline_kinds)
            self.assertTrue(
                {"run_started", "patch_generated", "verification_completed"}.intersection(timeline_kinds),
                msg=f"Expected execution events in timeline, got {sorted(timeline_kinds)}",
            )

            status_code, body = request_text(f"{server.base_url}/tasks/{task_id}")
            self.assertEqual(status_code, 200)
            self.assertTrue(body)

            error_payload = request_json(
                f"{server.base_url}/api/tasks/{task_id}/run",
                method="POST",
                data={},
                expected_status=409,
            )
            self.assertIn("retry endpoint", error_payload["error"].lower())

            retry_payload = request_json(
                f"{server.base_url}/api/tasks/{task_id}/retry",
                method="POST",
                data={},
                expected_status=200,
            )
            retried_task = require_task(retry_payload)
            self.assertEqual(retried_task["id"], task_id)
            self.assertEqual(retried_task["status"], "queued")

            retried_terminal_task = poll_task_until_terminal(server.base_url, task_id, server.tail_output)
            self.assertIn(retried_terminal_task["status"], {"passed", "needs_review"})
            self.assertNotEqual(retried_terminal_task["lintStatus"], "failed")
            self.assertNotEqual(retried_terminal_task["testStatus"], "failed")

            retry_timeline_payload = request_json(f"{server.base_url}/api/tasks/{task_id}/timeline")
            retry_timeline_kinds = {event["kind"] for event in retry_timeline_payload["timeline"]}
            self.assertIn("task_requeued", retry_timeline_kinds)



def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((HOST, 0))
        return int(sock.getsockname()[1])



def require_task(payload: dict[str, Any]) -> dict[str, Any]:
    task = payload.get("task")
    if not isinstance(task, dict):
        raise AssertionError(f"Expected task payload, got: {json.dumps(payload, indent=2)}")
    return task



def poll_task_until_terminal(base_url: str, task_id: str, server_output: callable) -> dict[str, Any]:
    deadline = time.time() + TASK_TIMEOUT_SECONDS
    last_task: dict[str, Any] | None = None

    while time.time() < deadline:
        payload = request_json(f"{base_url}/api/tasks/{task_id}")
        task = require_task(payload)
        last_task = task
        if task["status"] in TERMINAL_STATUSES:
            if task["status"] == "failed":
                raise AssertionError(
                    "Task reached failed status during smoke verification.\n"
                    f"Task: {json.dumps(task, indent=2)}\n"
                    f"Server output:\n{server_output()}"
                )
            return task
        time.sleep(POLL_INTERVAL_SECONDS)

    raise TimeoutError(
        "Timed out waiting for task to reach a terminal state.\n"
        f"Last task: {json.dumps(last_task, indent=2) if last_task else '<none>'}\n"
        f"Server output:\n{server_output()}"
    )



def request_json(
    url: str,
    *,
    method: str = "GET",
    data: dict[str, Any] | None = None,
    expected_status: int = 200,
) -> dict[str, Any]:
    raw_body = None if data is None else json.dumps(data).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=raw_body,
        method=method,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            status_code = response.getcode()
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        status_code = error.code
    except urllib.error.URLError as error:
        raise RuntimeError(f"Request to {url} failed: {error}") from error

    if status_code != expected_status:
        raise AssertionError(
            f"Expected {expected_status} from {method} {url}, got {status_code}. Body: {body}"
        )

    parsed = json.loads(body)
    if not isinstance(parsed, dict):
        raise AssertionError(f"Expected JSON object from {url}, got {type(parsed).__name__}: {body}")
    return parsed



def request_text(url: str) -> tuple[int, str]:
    request = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.getcode(), response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8")


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(FrontendBackendSmokeTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
