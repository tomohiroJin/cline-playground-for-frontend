import React, { useRef, useEffect, useCallback } from 'react';
import { createEngine, Engine } from './engine';
import {
  Shell,
  ShellHeader,
  Label,
  Bezel,
  Canvas,
  ButtonRow,
  DPad,
  DPadRow,
  DPadSpacer,
  DirButton,
  ActButton,
  RstButton,
  InfoText,
  PageWrap,
} from './styles';

/**
 * KEYS & ARMS ゲームの React ラッパーコンポーネント。
 * Canvas にゲームエンジンを接続し、キーボード・タッチ入力を中継する。
 */
const KeysAndArmsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  // エンジン起動・停止
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const engine = createEngine(cv);
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  // リサイズ
  useEffect(() => {
    const onResize = () => engineRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // キーボードイベント
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyDown(e.key);
      // ゲーム操作キーのデフォルト動作を抑制
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'z', 'Z', 'Escape', 'Enter'].includes(
          e.key
        )
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyUp(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // 仮想ボタンのタッチ/マウスハンドラ
  const handleButtonDown = useCallback((key: string) => {
    engineRef.current?.handleKeyDown(key);
  }, []);

  const handleButtonUp = useCallback((key: string) => {
    engineRef.current?.handleKeyUp(key);
  }, []);

  // 仮想ボタン共通 props 生成
  const btnProps = useCallback(
    (key: string) => ({
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        handleButtonDown(key);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        handleButtonUp(key);
      },
      onMouseDown: () => handleButtonDown(key),
      onMouseUp: () => handleButtonUp(key),
    }),
    [handleButtonDown, handleButtonUp]
  );

  return (
    <PageWrap>
      <Shell>
        <ShellHeader>
          <Label>&#9670; KEYS &amp; ARMS &#9670;</Label>
          <RstButton {...btnProps('Escape')}>RST</RstButton>
        </ShellHeader>
        <Bezel>
          <Canvas ref={canvasRef} />
        </Bezel>
        <ButtonRow>
          <DPad>
            <DirButton {...btnProps('ArrowUp')}>&#9650;</DirButton>
            <DPadRow>
              <DirButton {...btnProps('ArrowLeft')}>&#9664;</DirButton>
              <DPadSpacer />
              <DirButton {...btnProps('ArrowRight')}>&#9654;</DirButton>
            </DPadRow>
            <DirButton {...btnProps('ArrowDown')}>&#9660;</DirButton>
          </DPad>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ActButton {...btnProps('z')}>ACT</ActButton>
          </div>
        </ButtonRow>
      </Shell>
      <InfoText>D-PAD + ACT</InfoText>
    </PageWrap>
  );
};

export default KeysAndArmsGame;
