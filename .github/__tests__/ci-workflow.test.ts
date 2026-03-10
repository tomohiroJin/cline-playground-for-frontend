import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// CI ワークフロー YAML の構造を検証するテスト

const WORKFLOW_PATH = path.resolve(__dirname, '..', 'workflows', 'ci.yml');

interface WorkflowStep {
  uses?: string;
  run?: string;
  if?: string;
  with?: Record<string, unknown>;
}

interface WorkflowJob {
  name: string;
  'runs-on': string;
  needs?: string[];
  steps: WorkflowStep[];
}

interface Workflow {
  name: string;
  on: {
    pull_request: { branches: string[] };
    push: { branches: string[] };
  };
  concurrency: {
    group: string;
    'cancel-in-progress': boolean;
  };
  jobs: Record<string, WorkflowJob>;
}

let workflow: Workflow;

beforeAll(() => {
  const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
  workflow = yaml.load(content) as Workflow;
});

// ジョブ内のステップを action 名で検索するヘルパー
const findStepByAction = (job: WorkflowJob, actionPrefix: string) =>
  job.steps.find((s) => s.uses?.startsWith(actionPrefix));

// ジョブ内の run コマンド一覧を取得するヘルパー
const getRunCommands = (job: WorkflowJob) =>
  job.steps.filter((s) => s.run).map((s) => s.run);

describe('CI ワークフロー', () => {
  describe('基本設定', () => {
    it('ワークフロー名が "CI" であること', () => {
      expect(workflow.name).toBe('CI');
    });
  });

  describe('トリガー設定', () => {
    it('main ブランチへの pull_request でトリガーされること', () => {
      expect(workflow.on.pull_request.branches).toContain('main');
    });

    it('main ブランチへの push でトリガーされること', () => {
      expect(workflow.on.push.branches).toContain('main');
    });
  });

  describe('同時実行制御', () => {
    it('concurrency グループが設定されていること', () => {
      expect(workflow.concurrency).toBeDefined();
      expect(workflow.concurrency.group).toBeDefined();
    });

    it('進行中の実行をキャンセルする設定であること', () => {
      expect(workflow.concurrency['cancel-in-progress']).toBe(true);
    });
  });

  describe('ジョブ構成', () => {
    it('lint, typecheck, test, build の4ジョブが定義されていること', () => {
      const jobNames = Object.keys(workflow.jobs);
      expect(jobNames).toContain('lint');
      expect(jobNames).toContain('typecheck');
      expect(jobNames).toContain('test');
      expect(jobNames).toContain('build');
    });
  });

  describe('lint ジョブ', () => {
    it('ubuntu-latest で実行されること', () => {
      expect(workflow.jobs.lint['runs-on']).toBe('ubuntu-latest');
    });

    it('ソースのチェックアウトステップがあること', () => {
      expect(findStepByAction(workflow.jobs.lint, 'actions/checkout')).toBeDefined();
    });

    it('Node.js セットアップで .nvmrc を参照していること', () => {
      const step = findStepByAction(workflow.jobs.lint, 'actions/setup-node');
      expect(step).toBeDefined();
      expect(step?.with?.['node-version-file']).toBe('.nvmrc');
    });

    it('npm キャッシュが有効であること', () => {
      const step = findStepByAction(workflow.jobs.lint, 'actions/setup-node');
      expect(step?.with?.cache).toBe('npm');
    });

    it('npm ci と npm run lint:ci が実行されること', () => {
      const commands = getRunCommands(workflow.jobs.lint);
      expect(commands).toContain('npm ci');
      expect(commands).toContain('npm run lint:ci');
    });

    it('他のジョブに依存しないこと（並列実行）', () => {
      expect(workflow.jobs.lint.needs).toBeUndefined();
    });
  });

  describe('typecheck ジョブ', () => {
    it('ubuntu-latest で実行されること', () => {
      expect(workflow.jobs.typecheck['runs-on']).toBe('ubuntu-latest');
    });

    it('npm run typecheck が実行されること', () => {
      const commands = getRunCommands(workflow.jobs.typecheck);
      expect(commands).toContain('npm ci');
      expect(commands).toContain('npm run typecheck');
    });

    it('他のジョブに依存しないこと（並列実行）', () => {
      expect(workflow.jobs.typecheck.needs).toBeUndefined();
    });
  });

  describe('test ジョブ', () => {
    it('ubuntu-latest で実行されること', () => {
      expect(workflow.jobs.test['runs-on']).toBe('ubuntu-latest');
    });

    it('npm run test:coverage が実行されること', () => {
      const commands = getRunCommands(workflow.jobs.test);
      expect(commands).toContain('npm run test:coverage');
    });

    it('カバレッジレポートがアーティファクトとして保存されること', () => {
      const step = findStepByAction(workflow.jobs.test, 'actions/upload-artifact');
      expect(step).toBeDefined();
      expect(step?.with?.name).toBe('coverage-report');
      expect(step?.with?.path).toBe('coverage/');
    });

    it('テスト失敗時もカバレッジレポートがアップロードされること', () => {
      const step = findStepByAction(workflow.jobs.test, 'actions/upload-artifact');
      expect(step?.if).toBe('always()');
    });

    it('他のジョブに依存しないこと（並列実行）', () => {
      expect(workflow.jobs.test.needs).toBeUndefined();
    });
  });

  describe('build ジョブ', () => {
    it('ubuntu-latest で実行されること', () => {
      expect(workflow.jobs.build['runs-on']).toBe('ubuntu-latest');
    });

    it('lint, typecheck, test の3ジョブに依存すること', () => {
      const needs = workflow.jobs.build.needs;
      expect(needs).toContain('lint');
      expect(needs).toContain('typecheck');
      expect(needs).toContain('test');
    });

    it('npm run build が実行されること', () => {
      const commands = getRunCommands(workflow.jobs.build);
      expect(commands).toContain('npm run build');
    });

    it('ビルド成果物がアーティファクトとして保存されること', () => {
      const step = findStepByAction(workflow.jobs.build, 'actions/upload-artifact');
      expect(step).toBeDefined();
      expect(step?.with?.name).toBe('dist');
      expect(step?.with?.path).toBe('dist/');
    });

    it('アーティファクトの保持期間が3日であること', () => {
      const step = findStepByAction(workflow.jobs.build, 'actions/upload-artifact');
      expect(step?.with?.['retention-days']).toBe(3);
    });
  });

  describe('全ジョブ共通', () => {
    const ALL_JOBS = ['lint', 'typecheck', 'test', 'build'] as const;

    it('全ジョブで actions/checkout@v4 が使用されていること', () => {
      for (const jobName of ALL_JOBS) {
        const step = findStepByAction(workflow.jobs[jobName], 'actions/checkout');
        expect(step?.uses).toBe('actions/checkout@v4');
      }
    });

    it('全ジョブで actions/setup-node@v4 が使用されていること', () => {
      for (const jobName of ALL_JOBS) {
        const step = findStepByAction(workflow.jobs[jobName], 'actions/setup-node');
        expect(step?.uses).toBe('actions/setup-node@v4');
      }
    });

    it('全ジョブで npm キャッシュが有効であること', () => {
      for (const jobName of ALL_JOBS) {
        const step = findStepByAction(workflow.jobs[jobName], 'actions/setup-node');
        expect(step?.with?.cache).toBe('npm');
      }
    });
  });
});
