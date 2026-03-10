import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';

// プリデプロイ検証スクリプトのテスト

const SCRIPT_PATH = path.resolve(__dirname, '..', 'pre-deploy.sh');

describe('pre-deploy.sh', () => {
  describe('ファイル構成', () => {
    it('scripts/pre-deploy.sh が存在すること', () => {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
    });

    it('実行権限が付与されていること', () => {
      const stats = fs.statSync(SCRIPT_PATH);
      // owner の実行権限ビット (0o100) を確認
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
    });

    it('INFO ログが緑色であること', () => {
      // GREEN の ANSI カラーコードを使用
      expect(content).toMatch(/GREEN.*\\033\[0;32m/);
    });

    it('WARN ログが黄色であること', () => {
      expect(content).toMatch(/YELLOW.*\\033\[1;33m/);
    });

    it('ERROR ログが赤色であること', () => {
      expect(content).toMatch(/RED.*\\033\[0;31m/);
    });

    it('6つのステップが定義されていること', () => {
      expect(content).toContain('ステップ 1/6');
      expect(content).toContain('ステップ 2/6');
      expect(content).toContain('ステップ 3/6');
      expect(content).toContain('ステップ 4/6');
      expect(content).toContain('ステップ 5/6');
      expect(content).toContain('ステップ 6/6');
    });

    it('ステップ 1 で npm ci を実行すること', () => {
      expect(content).toContain('npm ci');
    });

    it('ステップ 2 で npm run lint:ci を実行すること', () => {
      expect(content).toContain('npm run lint:ci');
    });

    it('ステップ 3 で npm run typecheck を実行すること', () => {
      expect(content).toContain('npm run typecheck');
    });

    it('ステップ 4 で npm test を実行すること', () => {
      expect(content).toContain('npm test');
    });

    it('ステップ 5 で npm run build を実行すること', () => {
      expect(content).toContain('npm run build');
    });

    it('プロジェクトルートに cd していること', () => {
      expect(content).toMatch(/cd.*\$\(dirname.*\)\/\.\./);
    });
  });

  describe('ビルド成果物の検証ロジック', () => {
    // 検証ロジックのみを抽出したテスト用スクリプトを生成するヘルパー
    const createValidationScript = (distPath: string): string => {
      return `#!/usr/bin/env bash
set -euo pipefail

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

log_info() { echo -e "\${GREEN}[INFO]\${NC} $1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} $1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} $1"; }

DIST_DIR="${distPath}"

# index.html の存在確認
if [ ! -f "\${DIST_DIR}/index.html" ]; then
  log_error "dist/index.html が存在しません"
  exit 1
fi
log_info "  ✓ dist/index.html"

# バンドルファイルの存在確認
BUNDLE_COUNT=\$(find "\${DIST_DIR}" -name "*.bundle.js" | wc -l)
if [ "\${BUNDLE_COUNT}" -eq 0 ]; then
  log_error "バンドルファイル（*.bundle.js）が存在しません"
  exit 1
fi
log_info "  ✓ バンドルファイル: \${BUNDLE_COUNT}個"

# ソースマップが含まれていないことの確認
SOURCEMAP_COUNT=\$(find "\${DIST_DIR}" -name "*.map" | wc -l)
if [ "\${SOURCEMAP_COUNT}" -gt 0 ]; then
  log_warn "ソースマップファイルが \${SOURCEMAP_COUNT}個 含まれています"
  log_warn "本番環境にソースマップをデプロイしないことを確認してください"
fi

# dist ディレクトリの合計サイズ確認（上限: 100MB）
DIST_SIZE=\$(du -sm "\${DIST_DIR}" | cut -f1)
MAX_DIST_SIZE=100
if [ "\${DIST_SIZE}" -gt "\${MAX_DIST_SIZE}" ]; then
  log_error "dist ディレクトリのサイズが上限（\${MAX_DIST_SIZE}MB）を超えています: \${DIST_SIZE}MB"
  exit 1
fi
log_info "  ✓ dist サイズ: \${DIST_SIZE}MB（上限: \${MAX_DIST_SIZE}MB）"

echo "VALIDATION_OK"
`;
    };

    let tmpDir: string;
    let validationScriptPath: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-deploy-test-'));
      validationScriptPath = path.join(tmpDir, 'validate.sh');
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    // ヘルパー: テスト用の dist ディレクトリを作成
    const createDistDir = (options: {
      hasIndexHtml?: boolean;
      bundleCount?: number;
      sourceMapCount?: number;
    }) => {
      const distDir = path.join(tmpDir, 'dist');
      fs.mkdirSync(distDir, { recursive: true });

      if (options.hasIndexHtml) {
        fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');
      }

      const bundleNames = ['main', 'vendor', 'runtime'];
      for (let i = 0; i < (options.bundleCount ?? 0); i++) {
        const name = bundleNames[i] ?? `chunk-${i}`;
        fs.writeFileSync(
          path.join(distDir, `${name}.bundle.js`),
          'console.log("bundle")'
        );
      }

      for (let i = 0; i < (options.sourceMapCount ?? 0); i++) {
        const name = bundleNames[i] ?? `chunk-${i}`;
        fs.writeFileSync(
          path.join(distDir, `${name}.bundle.js.map`),
          '{"version":3}'
        );
      }

      return distDir;
    };

    // ヘルパー: 検証スクリプトを実行
    const runValidation = (distDir: string) => {
      const script = createValidationScript(distDir);
      fs.writeFileSync(validationScriptPath, script, { mode: 0o755 });
      return execSync(`bash "${validationScriptPath}"`, {
        encoding: 'utf-8',
        timeout: 10000,
      });
    };

    it('正常なビルド成果物で検証が通過すること', () => {
      const distDir = createDistDir({
        hasIndexHtml: true,
        bundleCount: 1,
      });
      const output = runValidation(distDir);
      expect(output).toContain('VALIDATION_OK');
    });

    it('dist/index.html が存在しない場合にエラー終了すること', () => {
      const distDir = createDistDir({
        hasIndexHtml: false,
        bundleCount: 1,
      });
      try {
        runValidation(distDir);
        fail('エラーが発生するはずでしたが、正常終了しました');
      } catch (error: unknown) {
        const stderr = (error as { stderr?: Buffer })?.stderr?.toString() ?? '';
        const stdout = (error as { stdout?: Buffer })?.stdout?.toString() ?? '';
        const output = stderr + stdout;
        expect(output).toContain('dist/index.html が存在しません');
      }
    });

    it('バンドルファイルが存在しない場合にエラー終了すること', () => {
      const distDir = createDistDir({
        hasIndexHtml: true,
        bundleCount: 0,
      });
      try {
        runValidation(distDir);
        fail('エラーが発生するはずでしたが、正常終了しました');
      } catch (error: unknown) {
        const stderr = (error as { stderr?: Buffer })?.stderr?.toString() ?? '';
        const stdout = (error as { stdout?: Buffer })?.stdout?.toString() ?? '';
        const output = stderr + stdout;
        expect(output).toContain('バンドルファイル');
      }
    });

    it('ソースマップが存在する場合に警告が出力されること', () => {
      const distDir = createDistDir({
        hasIndexHtml: true,
        bundleCount: 1,
        sourceMapCount: 1,
      });
      const output = runValidation(distDir);
      expect(output).toContain('ソースマップファイルが');
      // 警告のみで検証は通過する
      expect(output).toContain('VALIDATION_OK');
    });

    it('dist サイズが上限以内であること', () => {
      const distDir = createDistDir({
        hasIndexHtml: true,
        bundleCount: 1,
      });
      const output = runValidation(distDir);
      expect(output).toContain('dist サイズ');
      expect(output).toContain('上限: 100MB');
    });
  });
});
