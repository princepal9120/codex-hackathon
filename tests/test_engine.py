from __future__ import annotations

import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from engine import run_task
from engine.ranker import rank_files
from engine.repo_scanner import scan_repository
from engine.score_engine import compute_score


class RepoScannerTests(unittest.TestCase):
    def test_scanner_ignores_node_modules(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / 'src').mkdir()
            (root / 'node_modules').mkdir()
            (root / 'src' / 'feature.ts').write_text('export const feature = true;\n', encoding='utf-8')
            (root / 'node_modules' / 'ignored.js').write_text('console.log("ignore");\n', encoding='utf-8')

            scanned = scan_repository(temp_dir)
            paths = {item['path'] for item in scanned}

            self.assertIn('src/feature.ts', paths)
            self.assertNotIn('node_modules/ignored.js', paths)


class RankerTests(unittest.TestCase):
    def test_ranker_prefers_path_overlap(self) -> None:
        scanned_files = [
            {'path': 'app/api/login.ts', 'excerpt': 'login endpoint code'},
            {'path': 'components/navbar.tsx', 'excerpt': 'top navigation'},
        ]

        ranked = rank_files('add login rate limiting', scanned_files, max_files=2)

        self.assertEqual(ranked[0]['path'], 'app/api/login.ts')
        self.assertGreater(ranked[0]['score'], ranked[1]['score'])
        self.assertIn('login', ranked[0]['matched_terms'])
        self.assertTrue(ranked[0]['rationale'])


class ScoreEngineTests(unittest.TestCase):
    def test_score_engine_matches_mvp_weights(self) -> None:
        ranked_files = [{'path': 'app/api/login.ts', 'score': 90, 'excerpt': '...'}]
        score = compute_score('diff --git a/file b/file', 'passed', 'passed', ranked_files)
        self.assertEqual(score, 100)


class RunTaskTests(unittest.TestCase):
    def run_main_with(
        self,
        *,
        generate_result: dict[str, str] | None = None,
        verification_result: dict[str, str] | None = None,
        scan_side_effect: Exception | None = None,
    ) -> dict[str, object]:
        payload = {
            'task': {
                'id': 'task-123',
                'title': 'Add verification timeline',
                'prompt': 'show execution history and verification failures',
            },
            'repoPath': '/tmp/example',
            'lintCommand': 'npm run lint',
            'testCommand': 'npm test',
            'maxFiles': 3,
        }
        stdout = io.StringIO()
        default_generate_result = {
            'mode': 'mock',
            'codex_output': 'preview',
            'diff_output': 'diff --git a/file b/file\n@@\n+preview\n',
            'patch_summary': 'Previewed file changes.',
        }
        default_verification_result = {
            'lint_status': 'pending',
            'lint_output': 'lint pending',
            'test_status': 'pending',
            'test_output': 'tests pending',
        }

        scan_patch = patch('engine.run_task.scan_repository')
        rank_patch = patch('engine.run_task.rank_files')
        prompt_patch = patch('engine.run_task.build_prompt')
        generate_patch = patch('engine.run_task.generate_patch')
        verify_patch = patch('engine.run_task.verify')

        with scan_patch as scan_mock, rank_patch as rank_mock, prompt_patch as prompt_mock, generate_patch as generate_mock, verify_patch as verify_mock:
            if scan_side_effect is not None:
                scan_mock.side_effect = scan_side_effect
            else:
                scan_mock.return_value = [{'path': 'engine/run_task.py', 'excerpt': 'engine code'}]
            rank_mock.return_value = [
                {
                    'path': 'engine/run_task.py',
                    'score': 42,
                    'excerpt': 'engine code',
                    'rationale': 'path matched execution',
                    'matched_terms': ['execution'],
                }
            ]
            prompt_mock.return_value = {
                'prompt': 'prompt text',
                'context_summary': 'engine/run_task.py selected for execution history changes',
            }
            generate_mock.return_value = generate_result or default_generate_result
            verify_mock.return_value = verification_result or default_verification_result

            with patch('sys.stdin', io.StringIO(json.dumps(payload))), patch('sys.stdout', stdout):
                exit_code = run_task.main()

        self.assertEqual(exit_code, 0)
        return json.loads(stdout.getvalue())

    def test_main_emits_execution_history_for_reviewable_preview(self) -> None:
        result = self.run_main_with()

        self.assertEqual(result['status'], 'needs_review')
        self.assertEqual(result['failureSignal']['code'], 'human_review_required')
        self.assertEqual(result['failureSignal']['severity'], 'warning')
        self.assertEqual(
            [event['step'] for event in result['executionHistory']],
            [
                'task_received',
                'scan_repository',
                'rank_files',
                'build_prompt',
                'generate_patch_preview',
                'verify_lint',
                'verify_tests',
                'finalize',
            ],
        )

    def test_main_classifies_verification_failures(self) -> None:
        result = self.run_main_with(
            verification_result={
                'lint_status': 'failed',
                'lint_output': 'lint broke',
                'test_status': 'passed',
                'test_output': 'tests passed',
            }
        )

        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['failureSignal']['code'], 'verification_failed')
        self.assertEqual(result['failureSignal']['severity'], 'error')
        self.assertIn('lint failed', result['failureSignal']['summary'])

    def test_main_returns_structured_engine_failure(self) -> None:
        result = self.run_main_with(scan_side_effect=RuntimeError('scanner exploded'))

        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['failureSignal']['code'], 'engine_exception')
        self.assertEqual(result['failureSignal']['severity'], 'error')
        self.assertEqual(result['executionHistory'][-1]['step'], 'engine_failure')
        self.assertIn('scanner exploded', result['errorMessage'])


if __name__ == '__main__':
    unittest.main()
