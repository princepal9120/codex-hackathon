from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from typing import Any, TypedDict

from engine.codex_client import generate_patch
from engine.prompt_builder import build_prompt
from engine.ranker import rank_files
from engine.repo_scanner import scan_repository
from engine.score_engine import compute_score
from engine.verifier import verify


class ExecutionEvent(TypedDict, total=False):
    at: str
    step: str
    status: str
    summary: str
    details: dict[str, Any]


class FailureSignal(TypedDict):
    code: str
    severity: str
    summary: str


def derive_status(diff_output: str, lint_status: str, test_status: str) -> str:
    if lint_status == 'failed' or test_status == 'failed':
        return 'failed'
    if diff_output.strip() and lint_status == 'passed' and test_status == 'passed':
        return 'passed'
    if diff_output.strip():
        return 'needs_review'
    return 'failed'


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_event(
    step: str,
    status: str,
    summary: str,
    details: dict[str, Any] | None = None,
) -> ExecutionEvent:
    event: ExecutionEvent = {
        'at': utc_now(),
        'step': step,
        'status': status,
        'summary': summary,
    }
    if details:
        event['details'] = details
    return event


def check_event_status(status: str) -> str:
    return {
        'passed': 'completed',
        'pending': 'warning',
        'failed': 'failed',
    }.get(status, 'warning')


def classify_failure_signal(
    status: str,
    diff_output: str,
    lint_status: str,
    test_status: str,
    execution_mode: str,
) -> FailureSignal:
    if not diff_output.strip():
        return {
            'code': 'no_patch_generated',
            'severity': 'error',
            'summary': 'No patch preview was generated, so there is nothing safe to review yet.',
        }

    failed_checks = [
        label
        for label, check_status in (('lint', lint_status), ('tests', test_status))
        if check_status == 'failed'
    ]
    if failed_checks:
        return {
            'code': 'verification_failed',
            'severity': 'error',
            'summary': f"Patch preview generated, but {' and '.join(failed_checks)} failed during verification.",
        }

    if execution_mode == 'mock-fallback':
        return {
            'code': 'model_fallback',
            'severity': 'warning',
            'summary': 'Live model execution failed, so CodexFlow fell back to a mock patch preview.',
        }

    if status == 'needs_review':
        return {
            'code': 'human_review_required',
            'severity': 'warning',
            'summary': 'Patch preview is ready for human review, but verification is still incomplete or informational.',
        }

    if execution_mode == 'mock':
        return {
            'code': 'preview_only',
            'severity': 'info',
            'summary': 'Mock preview completed successfully. Review the patch before applying any repository changes.',
        }

    return {
        'code': 'none',
        'severity': 'none',
        'summary': 'No failure signals detected. Verification passed.',
    }


def build_logs(
    scanned_files: list[dict[str, Any]],
    ranked_files: list[dict[str, Any]],
    prompt_bundle: dict[str, str],
    codex_result: dict[str, str],
    verification: dict[str, str],
    execution_history: list[ExecutionEvent],
) -> str:
    history_lines = [
        f"[{event['status']}] {event['step']}: {event['summary']}"
        for event in execution_history
    ]
    logs = [
        f"Scanned {len(scanned_files)} files.",
        f"Selected {len(ranked_files)} files for prompt context.",
        f"Execution mode: {codex_result['mode']}",
        "--- EXECUTION HISTORY ---",
        *history_lines,
        "--- CONTEXT SUMMARY ---",
        prompt_bundle['context_summary'],
        "--- LINT OUTPUT ---",
        verification['lint_output'] or 'No lint output.',
        "--- TEST OUTPUT ---",
        verification['test_output'] or 'No test output.',
    ]
    return '\n'.join(logs)


def main() -> int:
    payload = json.loads(sys.stdin.read())
    task = payload['task']
    repo_path = payload['repoPath']
    lint_command = payload['lintCommand']
    test_command = payload['testCommand']
    max_files = payload['maxFiles']

    scanned_files: list[dict[str, Any]] = []
    ranked_files: list[dict[str, Any]] = []
    prompt_bundle = {'prompt': '', 'context_summary': 'No context summary available.'}
    codex_result = {
        'mode': 'uninitialized',
        'codex_output': '',
        'diff_output': '',
        'patch_summary': 'Patch preview did not complete.',
    }
    verification = {
        'lint_status': 'pending',
        'lint_output': 'Verification did not run.',
        'test_status': 'pending',
        'test_output': 'Verification did not run.',
    }
    execution_history: list[ExecutionEvent] = [
        make_event(
            'task_received',
            'completed',
            f"Received task {task.get('id', 'unknown')} for patch-preview-first execution.",
            {
                'repoPath': repo_path,
                'maxFiles': max_files,
            },
        )
    ]

    try:
        scanned_files = scan_repository(repo_path)
        execution_history.append(
            make_event(
                'scan_repository',
                'completed',
                f'Scanned {len(scanned_files)} files from the repository.',
                {'fileCount': len(scanned_files)},
            )
        )

        ranked_files = rank_files(task['prompt'], scanned_files, max_files)
        execution_history.append(
            make_event(
                'rank_files',
                'completed',
                f'Selected {len(ranked_files)} files for prompt context.',
                {
                    'selectedPaths': [file['path'] for file in ranked_files],
                },
            )
        )

        prompt_bundle = build_prompt(task['title'], task['prompt'], ranked_files)
        execution_history.append(
            make_event(
                'build_prompt',
                'completed',
                'Built patch preview prompt bundle from ranked repository context.',
            )
        )

        codex_result = generate_patch(task['title'], prompt_bundle['prompt'], ranked_files)
        execution_history.append(
            make_event(
                'generate_patch_preview',
                'warning' if codex_result['mode'] == 'mock-fallback' else 'completed',
                f"Generated patch preview in {codex_result['mode']} mode.",
                {'executionMode': codex_result['mode']},
            )
        )

        verification = verify(repo_path, lint_command, test_command)
        execution_history.append(
            make_event(
                'verify_lint',
                check_event_status(verification['lint_status']),
                f"Lint finished with status {verification['lint_status']}.",
            )
        )
        execution_history.append(
            make_event(
                'verify_tests',
                check_event_status(verification['test_status']),
                f"Tests finished with status {verification['test_status']}.",
            )
        )
    except Exception as error:  # pragma: no cover - exercised via tests through main()
        failure_signal = {
            'code': 'engine_exception',
            'severity': 'error',
            'summary': f'Engine execution failed before patch preview verification completed: {error}',
        }
        execution_history.append(
            make_event(
                'engine_failure',
                'failed',
                failure_signal['summary'],
                {'errorType': type(error).__name__},
            )
        )
        result = {
            'status': 'failed',
            'score': compute_score(codex_result['diff_output'], verification['lint_status'], verification['test_status'], ranked_files),
            'selectedFiles': [
                {
                    'path': file['path'],
                    'score': file['score'],
                    'excerpt': file['excerpt'],
                    'rationale': file['rationale'],
                    'matchedTerms': file['matched_terms'],
                }
                for file in ranked_files
            ],
            'promptPreview': prompt_bundle['prompt'],
            'contextSummary': prompt_bundle['context_summary'],
            'executionMode': codex_result['mode'],
            'codexOutput': codex_result['codex_output'],
            'diffOutput': codex_result['diff_output'],
            'patchSummary': codex_result['patch_summary'],
            'lintStatus': verification['lint_status'],
            'testStatus': verification['test_status'],
            'lintOutput': verification['lint_output'],
            'testOutput': verification['test_output'],
            'verificationNotes': failure_signal['summary'],
            'logs': build_logs(scanned_files, ranked_files, prompt_bundle, codex_result, verification, execution_history),
            'errorMessage': str(error),
            'executionHistory': execution_history,
            'failureSignal': failure_signal,
        }
        sys.stdout.write(json.dumps(result))
        return 0

    score = compute_score(codex_result['diff_output'], verification['lint_status'], verification['test_status'], ranked_files)
    status = derive_status(codex_result['diff_output'], verification['lint_status'], verification['test_status'])
    failure_signal = classify_failure_signal(
        status,
        codex_result['diff_output'],
        verification['lint_status'],
        verification['test_status'],
        codex_result['mode'],
    )
    verification_notes = (
        f"Lint: {verification['lint_status']}. Tests: {verification['test_status']}. "
        f"{failure_signal['summary']} Patch preview is informational only and must be reviewed before any real code changes are applied."
    )
    execution_history.append(
        make_event(
            'finalize',
            {
                'error': 'failed',
                'warning': 'warning',
                'info': 'completed',
                'none': 'completed',
            }.get(failure_signal['severity'], 'completed'),
            failure_signal['summary'],
            {
                'taskStatus': status,
                'failureCode': failure_signal['code'],
                'score': score,
            },
        )
    )

    result = {
        'status': status,
        'score': score,
        'selectedFiles': [
            {
                'path': file['path'],
                'score': file['score'],
                'excerpt': file['excerpt'],
                'rationale': file['rationale'],
                'matchedTerms': file['matched_terms'],
            }
            for file in ranked_files
        ],
        'promptPreview': prompt_bundle['prompt'],
        'contextSummary': prompt_bundle['context_summary'],
        'executionMode': codex_result['mode'],
        'codexOutput': codex_result['codex_output'],
        'diffOutput': codex_result['diff_output'],
        'patchSummary': codex_result['patch_summary'],
        'lintStatus': verification['lint_status'],
        'testStatus': verification['test_status'],
        'lintOutput': verification['lint_output'],
        'testOutput': verification['test_output'],
        'verificationNotes': verification_notes,
        'logs': build_logs(scanned_files, ranked_files, prompt_bundle, codex_result, verification, execution_history),
        'errorMessage': None if failure_signal['severity'] not in {'error'} else failure_signal['summary'],
        'executionHistory': execution_history,
        'failureSignal': failure_signal,
    }

    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
