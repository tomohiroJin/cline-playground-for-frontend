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

/** ファイル内の import from パスをすべて抽出 */
function extractImportPaths(filePath: string): { line: number; importPath: string }[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const imports: { line: number; importPath: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    // import ... from '...' または export ... from '...' にマッチ
    const match = lines[i].match(/(?:import|export)\s+.*from\s+['"]([^'"]+)['"]/);
    if (match) {
      imports.push({ line: i + 1, importPath: match[1] });
    }
  }
  return imports;
}

/** 相対パスから解決先のファイル名（拡張子なし）を取得 */
function _resolveRelativeImport(sourceFile: string, importPath: string): string {
  if (!importPath.startsWith('.')) return importPath;
  const resolved = path.resolve(path.dirname(sourceFile), importPath);
  return path.relative(FEATURE_ROOT, resolved);
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
