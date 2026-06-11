/**
 * アーキテクチャテスト
 *
 * フェーズ 10: 後方互換の再エクスポートが削除され、
 * 直接インポートに更新されていることを検証する。
 */
import * as fs from 'fs';
import * as path from 'path';

const FEATURE_ROOT = path.resolve(__dirname, '..');

/** 指定ディレクトリ配下の全 .ts/.tsx ファイルを再帰的に取得 */
function getAllSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...getAllSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/** ファイル内の import/export ... from と動的 import() のパスをすべて抽出 */
function extractImportPaths(filePath: string): { line: number; importPath: string }[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: { line: number; importPath: string }[] = [];
  // 複数行 import に対応するためファイル全体に対してマッチする
  const patterns = [/from\s+['"]([^'"]+)['"]/g, /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g];
  for (const regex of patterns) {
    for (const match of content.matchAll(regex)) {
      const line = content.slice(0, match.index).split('\n').length;
      imports.push({ line, importPath: match[1] });
    }
  }
  return imports;
}

describe('アーキテクチャ: 後方互換の再エクスポート', () => {
  // 削除されるべき再エクスポートファイル
  const DEPRECATED_REEXPORT_FILES = [
    'types.ts',
    'game-logic.ts',
    'answer-processor.ts',
    'constants.ts',
    'result-storage.ts',
    'history-storage.ts',
    'achievement-storage.ts',
    'challenge-storage.ts',
    'save-manager.ts',
  ];

  it('後方互換の再エクスポートファイルが存在しないこと', () => {
    for (const file of DEPRECATED_REEXPORT_FILES) {
      const filePath = path.join(FEATURE_ROOT, file);
      expect(fs.existsSync(filePath)).toBe(false);
    }
  });

  it('後方互換の再エクスポートファイルへのインポートが存在しないこと', () => {
    const allFiles = getAllSourceFiles(FEATURE_ROOT)
      .filter((f) => !f.endsWith('architecture.test.ts'));

    // 削除されたファイルの絶対パス（拡張子なし）
    const deprecatedAbsolute = DEPRECATED_REEXPORT_FILES.map((f) =>
      path.join(FEATURE_ROOT, f.replace(/\.ts$/, '')),
    );

    const violations: string[] = [];
    for (const file of allFiles) {
      const imports = extractImportPaths(file);
      for (const { line, importPath } of imports) {
        if (!importPath.startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(file), importPath);
        // ディレクトリが同名で存在する場合はディレクトリに解決されるため除外
        const isDir = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
        if (!isDir && deprecatedAbsolute.includes(resolved)) {
          const relFile = path.relative(FEATURE_ROOT, file);
          violations.push(`${relFile}:${line} → ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('アーキテクチャ: 依存方向', () => {
  it('domain/ に React の import がないこと', () => {
    const domainFiles = getAllSourceFiles(path.join(FEATURE_ROOT, 'domain'));
    const violations: string[] = [];
    for (const file of domainFiles) {
      const imports = extractImportPaths(file);
      for (const { line, importPath } of imports) {
        if (importPath === 'react' || importPath.startsWith('react/')) {
          violations.push(`${path.relative(FEATURE_ROOT, file)}:${line}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('domain/ に localStorage の直接参照がないこと', () => {
    const domainFiles = getAllSourceFiles(path.join(FEATURE_ROOT, 'domain'));
    const violations: string[] = [];
    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/\blocalStorage\b/.test(content)) {
        violations.push(path.relative(FEATURE_ROOT, file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('domain/ に Tone.js の直接参照がないこと', () => {
    const domainFiles = getAllSourceFiles(path.join(FEATURE_ROOT, 'domain'));
    const violations: string[] = [];
    for (const file of domainFiles) {
      const imports = extractImportPaths(file);
      for (const { line, importPath } of imports) {
        if (importPath === 'tone' || importPath.startsWith('tone/')) {
          violations.push(`${path.relative(FEATURE_ROOT, file)}:${line}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('infrastructure/ に React の import がないこと', () => {
    const infraDir = path.join(FEATURE_ROOT, 'infrastructure');
    if (!fs.existsSync(infraDir)) return;
    const infraFiles = getAllSourceFiles(infraDir);
    const violations: string[] = [];
    for (const file of infraFiles) {
      const imports = extractImportPaths(file);
      for (const { line, importPath } of imports) {
        if (importPath === 'react' || importPath.startsWith('react/')) {
          violations.push(`${path.relative(FEATURE_ROOT, file)}:${line}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('application/ に React の import がないこと', () => {
    const appDir = path.join(FEATURE_ROOT, 'application');
    if (!fs.existsSync(appDir)) return;
    const appFiles = getAllSourceFiles(appDir);
    const violations: string[] = [];
    for (const file of appFiles) {
      const imports = extractImportPaths(file);
      for (const { line, importPath } of imports) {
        if (importPath === 'react' || importPath.startsWith('react/')) {
          violations.push(`${path.relative(FEATURE_ROOT, file)}:${line}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('アーキテクチャ: 構造統一(2026-06 リファクタリング)', () => {
  it('Feature 直下に index.ts と README.md 以外のファイルが存在しないこと', () => {
    const ALLOWED_FILES = ['index.ts', 'README.md'];
    const ALLOWED_DIRS = [
      '__tests__',
      'constants',
      'data',
      'doc',
      'domain',
      'infrastructure',
      'presentation',
    ];
    const violations: string[] = [];
    for (const entry of fs.readdirSync(FEATURE_ROOT, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ALLOWED_DIRS.includes(entry.name)) violations.push(`${entry.name}/`);
      } else if (!ALLOWED_FILES.includes(entry.name)) {
        violations.push(entry.name);
      }
    }
    expect(violations).toEqual([]);
  });

  it('廃止済みの旧配置パスへのインポートが存在しないこと', () => {
    // 構造統一前のルート直下モジュール(移設済み)
    const REMOVED_ROOT_MODULES = [
      'components',
      'hooks',
      'audio',
      'questions',
      'story-data',
      'ending-data',
      'character-profiles',
      'character-narrative',
      'character-reactions',
      'character-genre-map',
      'daily-quiz',
      'team-classifier',
      'images',
    ];
    const removedAbsolute = REMOVED_ROOT_MODULES.map((m) => path.join(FEATURE_ROOT, m));
    const allFiles = getAllSourceFiles(FEATURE_ROOT)
      .filter((f) => !f.endsWith('architecture.test.ts'));
    const violations: string[] = [];
    for (const file of allFiles) {
      const imports = extractImportPaths(file);
      for (const { line, importPath } of imports) {
        if (!importPath.startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(file), importPath);
        if (removedAbsolute.includes(resolved)) {
          violations.push(`${path.relative(FEATURE_ROOT, file)}:${line} → ${importPath}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('ページから Feature 内部への深いインポートが存在しないこと', () => {
    const pagePath = path.resolve(FEATURE_ROOT, '../../pages/AgileQuizSugorokuPage.tsx');
    const violations = extractImportPaths(pagePath)
      .filter(({ importPath }) => importPath.includes('features/agile-quiz-sugoroku/'))
      .map(({ line, importPath }) => `${line}: ${importPath}`);
    expect(violations).toEqual([]);
  });

  it('presentation/ 直下が components / hooks / styles のみであること', () => {
    const presentationRoot = path.join(FEATURE_ROOT, 'presentation');
    const ALLOWED = ['components', 'hooks', 'styles'];
    const violations: string[] = [];
    for (const entry of fs.readdirSync(presentationRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !ALLOWED.includes(entry.name)) {
        violations.push(entry.isDirectory() ? `${entry.name}/` : entry.name);
      }
    }
    expect(violations).toEqual([]);
  });
});
