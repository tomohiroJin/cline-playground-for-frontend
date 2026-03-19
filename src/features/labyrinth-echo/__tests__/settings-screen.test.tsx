/**
 * 迷宮の残響 - SettingsScreen コンポーネントテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsScreen, ResetConfirm1Screen, ResetConfirm2Screen } from '../components/SettingsScreens';
import type { AudioSettings } from '../audio';
import { createTestMeta } from './helpers/factories';

const defaultAudioSettings: AudioSettings = {
  sfxEnabled: true,
  bgmEnabled: true,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
};

const baseMeta = createTestMeta({
  runs: 5, escapes: 2, kp: 30, unlocked: ["u1"], bestFloor: 4,
  totalEvents: 40, endings: ["standard"], clearedDifficulties: ["normal"], totalDeaths: 3,
});

describe('SettingsScreen', () => {
  const makeProps = (overrides: Partial<Parameters<typeof SettingsScreen>[0]> = {}) => ({
    Particles: <div data-testid="particles" />,
    eventCount: 163,
    audioSettings: defaultAudioSettings,
    onChangeAudioSettings: jest.fn(),
    setPhase: jest.fn(),
    ...overrides,
  });

  it('「設定」見出しが表示される', () => {
    // Arrange & Act
    render(<SettingsScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('BGMトグルが表示される', () => {
    // Arrange & Act
    render(<SettingsScreen {...makeProps()} />);

    // Assert
    expect(screen.getByLabelText('BGM切替')).toBeInTheDocument();
  });

  it('効果音トグルが表示される', () => {
    // Arrange & Act
    render(<SettingsScreen {...makeProps()} />);

    // Assert
    expect(screen.getByLabelText('効果音切替')).toBeInTheDocument();
  });

  it('BGM ONの場合にボリュームスライダーが表示される', () => {
    // Arrange & Act
    render(<SettingsScreen {...makeProps()} />);

    // Assert
    expect(screen.getByLabelText('BGM音量')).toBeInTheDocument();
  });

  it('BGM OFFの場合にボリュームスライダーが非表示になる', () => {
    // Arrange
    const audio = { ...defaultAudioSettings, bgmEnabled: false };

    // Act
    render(<SettingsScreen {...makeProps({ audioSettings: audio })} />);

    // Assert
    expect(screen.queryByLabelText('BGM音量')).not.toBeInTheDocument();
  });

  it('BGMトグルをクリックするとonChangeAudioSettingsが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<SettingsScreen {...props} />);

    // Act
    await user.click(screen.getByLabelText('BGM切替'));

    // Assert
    expect(props.onChangeAudioSettings).toHaveBeenCalledWith(
      expect.objectContaining({ bgmEnabled: false })
    );
  });

  it('効果音トグルをクリックするとonChangeAudioSettingsが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<SettingsScreen {...props} />);

    // Act
    await user.click(screen.getByLabelText('効果音切替'));

    // Assert
    expect(props.onChangeAudioSettings).toHaveBeenCalledWith(
      expect.objectContaining({ sfxEnabled: false })
    );
  });

  it('ゲーム情報セクションにイベント数が表示される', () => {
    // Arrange & Act
    render(<SettingsScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText(/イベント数: 163/)).toBeInTheDocument();
  });

  it('データリセットボタンが表示される', () => {
    // Arrange & Act
    render(<SettingsScreen {...makeProps()} />);

    // Assert
    expect(screen.getByText(/データを初期化する/)).toBeInTheDocument();
  });

  it('リセットボタンをクリックするとsetPhase("reset_confirm1")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<SettingsScreen {...props} />);

    // Act
    await user.click(screen.getByText(/データを初期化する/));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('reset_confirm1');
  });

  it('「戻る」ボタンをクリックするとsetPhase("title")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<SettingsScreen {...props} />);

    // Act
    await user.click(screen.getByText('戻る'));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('title');
  });
});

describe('ResetConfirm1Screen', () => {
  const makeProps = (overrides: Partial<Parameters<typeof ResetConfirm1Screen>[0]> = {}) => ({
    Particles: <div data-testid="particles" />,
    meta: baseMeta,
    setPhase: jest.fn(),
    ...overrides,
  });

  it('「本当に初期化しますか？」が表示される', () => {
    // Arrange & Act
    render(<ResetConfirm1Screen {...makeProps()} />);

    // Assert
    expect(screen.getByText(/本当に初期化しますか/)).toBeInTheDocument();
  });

  it('メタデータの詳細が表示される', () => {
    // Arrange & Act
    render(<ResetConfirm1Screen {...makeProps()} />);

    // Assert
    expect(screen.getByText(/探索 5回分の記録/)).toBeInTheDocument();
    expect(screen.getByText(/知見ポイント ◈ 30pt/)).toBeInTheDocument();
  });

  it('確認ボタンをクリックするとsetPhase("reset_confirm2")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<ResetConfirm1Screen {...props} />);

    // Act
    await user.click(screen.getByText('それでも初期化する'));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('reset_confirm2');
  });

  it('「やめる」ボタンをクリックするとsetPhase("settings")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<ResetConfirm1Screen {...props} />);

    // Act
    await user.click(screen.getByText('やめる'));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('settings');
  });
});

describe('ResetConfirm2Screen', () => {
  const makeProps = (overrides: Partial<Parameters<typeof ResetConfirm2Screen>[0]> = {}) => ({
    Particles: <div data-testid="particles" />,
    setPhase: jest.fn(),
    resetMeta: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  it('「最終確認」が表示される', () => {
    // Arrange & Act
    render(<ResetConfirm2Screen {...makeProps()} />);

    // Assert
    expect(screen.getByText('最終確認')).toBeInTheDocument();
  });

  it('「完全に初期化する」ボタンをクリックするとresetMetaが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<ResetConfirm2Screen {...props} />);

    // Act
    await user.click(screen.getByText('完全に初期化する'));

    // Assert
    expect(props.resetMeta).toHaveBeenCalledTimes(1);
  });

  it('「やめて戻る」ボタンをクリックするとsetPhase("settings")が呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = makeProps();
    render(<ResetConfirm2Screen {...props} />);

    // Act
    await user.click(screen.getByText('やめて戻る'));

    // Assert
    expect(props.setPhase).toHaveBeenCalledWith('settings');
  });
});
