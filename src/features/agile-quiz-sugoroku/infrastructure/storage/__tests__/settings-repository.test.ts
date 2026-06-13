import { SettingsRepository } from '../settings-repository';
import { InMemoryStorageAdapter } from '../in-memory-storage-adapter';

describe('SettingsRepository', () => {
  it('デフォルトでは soundEnabled が true', () => {
    const repo = new SettingsRepository(new InMemoryStorageAdapter());
    expect(repo.load().soundEnabled).toBe(true);
  });

  it('soundEnabled を保存して読み込める', () => {
    const storage = new InMemoryStorageAdapter();
    const repo = new SettingsRepository(storage);
    repo.setSoundEnabled(false);
    expect(repo.load().soundEnabled).toBe(false);
    expect(new SettingsRepository(storage).load().soundEnabled).toBe(false);
  });

  it('壊れたデータが入っていてもデフォルトに復帰する', () => {
    const storage = new InMemoryStorageAdapter();
    storage.set('aqs_settings', 'not-an-object');
    const repo = new SettingsRepository(storage);
    expect(repo.load().soundEnabled).toBe(true);
  });
});
