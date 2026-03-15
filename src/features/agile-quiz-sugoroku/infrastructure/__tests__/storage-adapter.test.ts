/**
 * StorageAdapter テスト
 *
 * LocalStorageAdapter と InMemoryStorageAdapter の両方が
 * StoragePort インターフェースを正しく実装していることを検証する。
 */
import { StoragePort } from '../storage/storage-port';
import { LocalStorageAdapter } from '../storage/local-storage-adapter';
import { InMemoryStorageAdapter } from '../storage/in-memory-storage-adapter';

/** StoragePort の共通テストスイート */
function runStoragePortTests(
  name: string,
  createAdapter: () => StoragePort,
): void {
  describe(name, () => {
    let storage: StoragePort;

    beforeEach(() => {
      storage = createAdapter();
      storage.clear();
    });

    describe('get / set', () => {
      it('文字列を保存して読み込める', () => {
        // Arrange & Act
        storage.set('key1', 'hello');

        // Assert
        expect(storage.get<string>('key1')).toBe('hello');
      });

      it('オブジェクトを保存して読み込める', () => {
        // Arrange
        const data = { name: 'テスト', score: 100 };

        // Act
        storage.set('obj', data);

        // Assert
        expect(storage.get<typeof data>('obj')).toEqual(data);
      });

      it('配列を保存して読み込める', () => {
        // Arrange
        const items = [1, 2, 3];

        // Act
        storage.set('arr', items);

        // Assert
        expect(storage.get<number[]>('arr')).toEqual([1, 2, 3]);
      });

      it('数値を保存して読み込める', () => {
        // Arrange & Act
        storage.set('num', 42);

        // Assert
        expect(storage.get<number>('num')).toBe(42);
      });

      it('存在しないキーは undefined を返す', () => {
        // Act & Assert
        expect(storage.get('nonexistent')).toBeUndefined();
      });

      it('値を上書きできる', () => {
        // Arrange
        storage.set('key', 'first');

        // Act
        storage.set('key', 'second');

        // Assert
        expect(storage.get<string>('key')).toBe('second');
      });
    });

    describe('remove', () => {
      it('保存した値を削除できる', () => {
        // Arrange
        storage.set('key', 'value');

        // Act
        storage.remove('key');

        // Assert
        expect(storage.get('key')).toBeUndefined();
      });

      it('存在しないキーを削除してもエラーにならない', () => {
        // Act & Assert
        expect(() => storage.remove('nonexistent')).not.toThrow();
      });
    });

    describe('clear', () => {
      it('全データを削除できる', () => {
        // Arrange
        storage.set('key1', 'value1');
        storage.set('key2', 'value2');

        // Act
        storage.clear();

        // Assert
        expect(storage.get('key1')).toBeUndefined();
        expect(storage.get('key2')).toBeUndefined();
      });
    });

    describe('has', () => {
      it('存在するキーは true を返す', () => {
        // Arrange
        storage.set('key', 'value');

        // Act & Assert
        expect(storage.has('key')).toBe(true);
      });

      it('存在しないキーは false を返す', () => {
        // Act & Assert
        expect(storage.has('nonexistent')).toBe(false);
      });

      it('削除後は false を返す', () => {
        // Arrange
        storage.set('key', 'value');
        storage.remove('key');

        // Act & Assert
        expect(storage.has('key')).toBe(false);
      });
    });
  });
}

// 両アダプターで共通テストを実行
runStoragePortTests('InMemoryStorageAdapter', () => new InMemoryStorageAdapter());
runStoragePortTests('LocalStorageAdapter', () => new LocalStorageAdapter());
