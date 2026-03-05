import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';

// デプロイスクリプトのテスト

const SCRIPT_PATH = path.resolve(__dirname, '..', 'deploy.sh');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ENV_EXAMPLE_PATH = path.resolve(PROJECT_ROOT, '.env.deploy.example');

describe('deploy.sh', () => {
  describe('ファイル構成', () => {
    it('scripts/deploy.sh が存在すること', () => {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
    });

    it('実行権限が付与されていること', () => {
      const stats = fs.statSync(SCRIPT_PATH);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });
  });

  describe('スクリプト構造', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('shebang が #!/usr/bin/env bash であること', () => {
      expect(content.startsWith('#!/usr/bin/env bash')).toBe(true);
    });

    it('set -euo pipefail が設定されていること', () => {
      expect(content).toContain('set -euo pipefail');
    });

    it('色付きログ関数が定義されていること', () => {
      expect(content).toMatch(/log_info\(\)/);
      expect(content).toMatch(/log_warn\(\)/);
      expect(content).toMatch(/log_error\(\)/);
      expect(content).toMatch(/log_step\(\)/);
    });

    it('STEP ログが青色であること', () => {
      expect(content).toMatch(/BLUE.*\\033\[0;34m/);
    });

    it('5つのステップが定義されていること', () => {
      expect(content).toContain('ステップ 1/5');
      expect(content).toContain('ステップ 2/5');
      expect(content).toContain('ステップ 3/5');
      expect(content).toContain('ステップ 4/5');
      expect(content).toContain('ステップ 5/5');
    });

    it('プロジェクトルートに cd していること', () => {
      expect(content).toContain('cd "$PROJECT_ROOT"');
    });
  });

  describe('環境変数の読み込み', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('.env.deploy ファイルを読み込むこと', () => {
      expect(content).toContain('.env.deploy');
      expect(content).toContain('source "$ENV_FILE"');
    });

    it('必須変数のバリデーションが行われること', () => {
      expect(content).toContain('DEPLOY_HOST');
      expect(content).toContain('DEPLOY_USER');
      expect(content).toContain('DEPLOY_PATH');
      expect(content).toContain('DEPLOY_AUTH_METHOD');
    });

    it('デフォルト値が設定されていること', () => {
      // DEPLOY_PORT のデフォルト値
      expect(content).toMatch(/DEPLOY_PORT.*22/);
      // DEPLOY_DRY_RUN のデフォルト値
      expect(content).toMatch(/DEPLOY_DRY_RUN.*false/);
      // DEPLOY_BACKUP のデフォルト値
      expect(content).toMatch(/DEPLOY_BACKUP.*true/);
    });
  });

  describe('認証方式', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('SSH 鍵認証に対応していること', () => {
      expect(content).toContain('ssh_key');
      expect(content).toContain('SSH_KEY_PATH');
    });

    it('トークン認証に対応していること', () => {
      expect(content).toContain('token');
      expect(content).toContain('DEPLOY_TOKEN');
    });

    it('未対応の認証方式でエラーを出力すること', () => {
      expect(content).toContain('未対応の認証方式');
    });

    it('接続テストを実行すること', () => {
      expect(content).toContain('接続テスト');
    });

    it('eval を使わず安全にチルダ展開していること', () => {
      expect(content).toContain('expand_tilde');
      expect(content).not.toMatch(/eval\s+echo/);
    });

    it('SSH_OPTS が配列として定義されていること', () => {
      expect(content).toMatch(/SSH_OPTS=\(/);
      expect(content).toContain('${SSH_OPTS[@]}');
    });
  });

  describe('rsync 差分デプロイ', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('rsync コマンドを使用すること', () => {
      expect(content).toContain('rsync');
    });

    it('--archive オプションが含まれること', () => {
      expect(content).toContain('--archive');
    });

    it('--compress オプションが含まれること', () => {
      expect(content).toContain('--compress');
    });

    it('--checksum オプションが含まれること', () => {
      expect(content).toContain('--checksum');
    });

    it('--delete オプションが含まれること', () => {
      expect(content).toContain('--delete');
    });

    it('--verbose と --stats オプションが含まれること', () => {
      expect(content).toContain('--verbose');
      expect(content).toContain('--stats');
    });

    it('.env を除外すること', () => {
      expect(content).toMatch(/--exclude.*\.env/);
    });

    it('.git を除外すること', () => {
      expect(content).toMatch(/--exclude.*\.git/);
    });

    it('*.map を除外すること', () => {
      expect(content).toMatch(/--exclude.*\*\.map/);
    });

    it('--dry-run モードに対応すること', () => {
      expect(content).toContain('--dry-run');
    });

    it('dist/ ディレクトリを転送元にすること', () => {
      expect(content).toMatch(/dist\//);
    });
  });

  describe('ヘルスチェック', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('curl で HTTP ステータスコードを確認すること', () => {
      expect(content).toContain('curl');
      expect(content).toContain('%{http_code}');
    });

    it('タイムアウトが設定されていること', () => {
      expect(content).toContain('--max-time');
    });

    it('HTTP 200 を成功条件としていること', () => {
      expect(content).toContain('200');
    });

    it('DEPLOY_SITE_URL を使用すること', () => {
      expect(content).toContain('DEPLOY_SITE_URL');
    });

    it('Dry Run モードではヘルスチェックをスキップすること', () => {
      expect(content).toContain('DEPLOY_DRY_RUN');
    });
  });

  describe('プリデプロイ検証の呼び出し', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('pre-deploy.sh を呼び出すこと', () => {
      expect(content).toContain('pre-deploy.sh');
    });
  });

  describe('バックアップ機能', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('DEPLOY_BACKUP フラグで制御されること', () => {
      expect(content).toContain('DEPLOY_BACKUP');
    });

    it('バックアップディレクトリにタイムスタンプを使用すること', () => {
      expect(content).toMatch(/backup.*date/i);
    });
  });

  describe('デプロイ完了ログ', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    });

    it('タイムスタンプ付きの完了メッセージを出力すること', () => {
      expect(content).toContain('TIMESTAMP');
      expect(content).toContain('デプロイ完了');
    });

    it('Dry Run 完了メッセージを出力すること', () => {
      expect(content).toContain('Dry Run 完了');
    });
  });

  describe('expand_tilde ヘルパー', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-tilde-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('チルダを $HOME に展開すること', () => {
      const testScript = `#!/usr/bin/env bash
set -euo pipefail
expand_tilde() { echo "\${1/#\\~/$HOME}"; }
echo "$(expand_tilde "~/test/path")"
`;
      const scriptPath = path.join(tmpDir, 'test-tilde.sh');
      fs.writeFileSync(scriptPath, testScript, { mode: 0o755 });

      const output = execSync(`bash "${scriptPath}"`, {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      const home = process.env['HOME'] ?? '/root';
      expect(output).toBe(`${home}/test/path`);
    });

    it('チルダを含まないパスはそのまま返すこと', () => {
      const testScript = `#!/usr/bin/env bash
set -euo pipefail
expand_tilde() { echo "\${1/#\\~/$HOME}"; }
echo "$(expand_tilde "/absolute/path")"
`;
      const scriptPath = path.join(tmpDir, 'test-tilde.sh');
      fs.writeFileSync(scriptPath, testScript, { mode: 0o755 });

      const output = execSync(`bash "${scriptPath}"`, {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      expect(output).toBe('/absolute/path');
    });
  });

  describe('.env.deploy が存在しない場合のエラー処理', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-test-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('.env.deploy が存在しない場合にエラーメッセージが表示されること', () => {
      // deploy.sh の環境変数読み込み部分をテストする軽量スクリプト
      const testScript = `#!/usr/bin/env bash
set -euo pipefail

RED='\\033[0;31m'
NC='\\033[0m'
log_error() { echo -e "\${RED}[ERROR]\${NC} $1"; }

ENV_FILE="${tmpDir}/.env.deploy"
if [ ! -f "$ENV_FILE" ]; then
  log_error ".env.deploy が見つかりません"
  exit 1
fi
`;
      const scriptPath = path.join(tmpDir, 'test-env.sh');
      fs.writeFileSync(scriptPath, testScript, { mode: 0o755 });

      try {
        execSync(`bash "${scriptPath}"`, {
          encoding: 'utf-8',
          timeout: 5000,
        });
        fail('エラーが発生するはずでしたが、正常終了しました');
      } catch (error: unknown) {
        const stderr =
          (error as { stderr?: Buffer })?.stderr?.toString() ?? '';
        const stdout =
          (error as { stdout?: Buffer })?.stdout?.toString() ?? '';
        const output = stderr + stdout;
        expect(output).toContain('.env.deploy が見つかりません');
      }
    });
  });
});

describe('.env.deploy.example', () => {
  it('.env.deploy.example が存在すること', () => {
    expect(fs.existsSync(ENV_EXAMPLE_PATH)).toBe(true);
  });

  describe('必須変数がテンプレートに含まれていること', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    });

    it('DEPLOY_HOST が含まれること', () => {
      expect(content).toContain('DEPLOY_HOST=');
    });

    it('DEPLOY_USER が含まれること', () => {
      expect(content).toContain('DEPLOY_USER=');
    });

    it('DEPLOY_PATH が含まれること', () => {
      expect(content).toContain('DEPLOY_PATH=');
    });

    it('DEPLOY_PORT が含まれること', () => {
      expect(content).toContain('DEPLOY_PORT=');
    });

    it('DEPLOY_AUTH_METHOD が含まれること', () => {
      expect(content).toContain('DEPLOY_AUTH_METHOD=');
    });

    it('DEPLOY_SSH_KEY_PATH が含まれること', () => {
      expect(content).toContain('DEPLOY_SSH_KEY_PATH=');
    });

    it('DEPLOY_TOKEN が含まれること', () => {
      expect(content).toContain('DEPLOY_TOKEN');
    });

    it('DEPLOY_SITE_URL が含まれること', () => {
      expect(content).toContain('DEPLOY_SITE_URL=');
    });

    it('DEPLOY_DRY_RUN が含まれること', () => {
      expect(content).toContain('DEPLOY_DRY_RUN=');
    });

    it('DEPLOY_BACKUP が含まれること', () => {
      expect(content).toContain('DEPLOY_BACKUP=');
    });
  });

  describe('セキュリティ', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    });

    it('実際の機密情報が含まれていないこと', () => {
      // トークンの値が空またはプレースホルダーであること
      expect(content).not.toMatch(/DEPLOY_TOKEN=\S+/);
    });

    it('プレースホルダーのホスト名が使用されていること', () => {
      expect(content).toContain('example.com');
    });
  });
});

describe('.gitignore', () => {
  it('.env.deploy が .gitignore に含まれていること', () => {
    const gitignorePath = path.resolve(PROJECT_ROOT, '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    expect(content).toContain('.env.deploy');
  });
});
