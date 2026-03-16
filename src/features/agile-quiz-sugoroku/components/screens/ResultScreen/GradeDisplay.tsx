/**
 * グレード表示コンポーネント
 * グレード発表シーケンスアニメーション
 */
import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../../../constants';
import { AQS_IMAGES } from '../../../images';
import {
  GradeCircle,
  GradeLabel,
  BuildSuccess,
  ReleaseVersion,
} from '../../styles';

interface GradeDisplayProps {
  /** グレード情報 */
  grade: { grade: string; label: string; color: string };
  /** 演出完了時のコールバック */
  onSequenceComplete: () => void;
}

/** 演出シーケンスの各ステップの遅延時間（ms） */
const SEQUENCE_DELAYS = [800, 1500, 1000];

/** シーケンス完了ステップ */
const SEQUENCE_COMPLETE_STEP = 3;

/**
 * グレード発表シーケンス + 最終グレード表示
 */
export const GradeDisplay: React.FC<GradeDisplayProps> = ({ grade, onSequenceComplete }) => {
  const [sequenceStep, setSequenceStep] = useState(0);
  const [celebrationError, setCelebrationError] = useState(false);
  const [buildImgError, setBuildImgError] = useState(false);
  const isSequenceComplete = sequenceStep >= SEQUENCE_COMPLETE_STEP;

  // 演出シーケンス: 0=暗転 → 1=BUILD SUCCESS → 2=グレード表示 → 3=全体表示
  useEffect(() => {
    if (sequenceStep >= SEQUENCE_COMPLETE_STEP) {
      return;
    }
    const tid = setTimeout(
      () => setSequenceStep((s) => s + 1),
      SEQUENCE_DELAYS[sequenceStep],
    );
    return () => clearTimeout(tid);
  }, [sequenceStep]);

  // 演出完了を通知
  useEffect(() => {
    if (isSequenceComplete) {
      onSequenceComplete();
    }
  }, [isSequenceComplete, onSequenceComplete]);

  // クリックで演出スキップ
  const skipSequence = useCallback(() => {
    if (!isSequenceComplete) {
      setSequenceStep(SEQUENCE_COMPLETE_STEP);
    }
  }, [isSequenceComplete]);

  return (
    <>
      {/* 演出シーケンス: ステップ0 - 暗転 */}
      {sequenceStep === 0 && (
        <div
          onClick={skipSequence}
          role="button"
          tabIndex={0}
          aria-label="演出をスキップ"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') skipSequence(); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{
            color: COLORS.muted,
            fontSize: 11,
            fontFamily: FONTS.mono,
            letterSpacing: 2,
            opacity: 0.5,
          }}>
            CALCULATING...
          </div>
        </div>
      )}

      {/* 演出シーケンス: ステップ1 - BUILD SUCCESS タイプライター */}
      {sequenceStep === 1 && (
        <div
          onClick={skipSequence}
          role="button"
          tabIndex={0}
          aria-label="演出をスキップ"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') skipSequence(); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: COLORS.bg,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <BuildSuccess style={{ fontSize: 18, letterSpacing: 5 }}>
            BUILD SUCCESS
          </BuildSuccess>
          <ReleaseVersion style={{ marginTop: 8 }}>Release v1.0.0</ReleaseVersion>
        </div>
      )}

      {/* 演出シーケンス: ステップ2 - グレード発表 */}
      {sequenceStep === 2 && (
        <div
          onClick={skipSequence}
          role="button"
          tabIndex={0}
          aria-label="演出をスキップ"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') skipSequence(); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: COLORS.bg,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <GradeCircle $color={grade.color}>{grade.grade}</GradeCircle>
          <GradeLabel $color={grade.color}>{grade.label}</GradeLabel>
        </div>
      )}

      {/* 最終グレード表示（演出完了後に表示） */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {!celebrationError && (
            <img
              src={AQS_IMAGES.gradeCelebration}
              alt=""
              aria-hidden="true"
              onError={() => setCelebrationError(true)}
              style={{
                position: 'absolute',
                inset: -20,
                width: 'calc(100% + 40px)',
                height: 'calc(100% + 40px)',
                objectFit: 'contain',
                opacity: 0.3,
                pointerEvents: 'none',
              }}
            />
          )}
          <GradeCircle $color={grade.color}>{grade.grade}</GradeCircle>
        </div>
        <GradeLabel $color={grade.color}>{grade.label}</GradeLabel>
        {!buildImgError && (
          <img
            src={AQS_IMAGES.buildSuccess}
            alt=""
            aria-hidden="true"
            onError={() => setBuildImgError(true)}
            style={{
              width: '100%',
              height: 80,
              objectFit: 'contain',
              opacity: 0.2,
              borderRadius: 4,
              marginBottom: 4,
            }}
          />
        )}
        <BuildSuccess>BUILD SUCCESS</BuildSuccess>
        <ReleaseVersion>Release v1.0.0</ReleaseVersion>
      </div>
    </>
  );
};
