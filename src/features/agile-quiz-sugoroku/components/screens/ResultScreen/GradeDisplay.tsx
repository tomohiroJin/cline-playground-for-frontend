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
  /** 演出スキップ時のコールバック */
  onSequenceComplete: () => void;
}

/**
 * グレード発表シーケンス + 最終グレード表示
 */
export const GradeDisplay: React.FC<GradeDisplayProps> = ({ grade, onSequenceComplete }) => {
  // 演出シーケンスのステップ管理
  const [sequenceStep, setSequenceStep] = useState(0);
  const isSequenceComplete = sequenceStep >= 3;

  // 演出シーケンス: 0=暗転 → 1=BUILD SUCCESS → 2=グレード表示 → 3=全体表示
  useEffect(() => {
    const delays = [800, 1500, 1000];
    if (sequenceStep < 3) {
      const tid = setTimeout(() => setSequenceStep((s) => s + 1), delays[sequenceStep]);
      return () => clearTimeout(tid);
    }
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
      setSequenceStep(3);
    }
  }, [isSequenceComplete]);

  return (
    <>
      {/* 演出シーケンス: ステップ0 - 暗転 */}
      {sequenceStep === 0 && (
        <div
          onClick={skipSequence}
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
          <img
            src={AQS_IMAGES.gradeCelebration}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
          <GradeCircle $color={grade.color}>{grade.grade}</GradeCircle>
        </div>
        <GradeLabel $color={grade.color}>{grade.label}</GradeLabel>
        <img
          src={AQS_IMAGES.buildSuccess}
          alt=""
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          style={{
            width: '100%',
            height: 80,
            objectFit: 'contain',
            opacity: 0.2,
            borderRadius: 4,
            marginBottom: 4,
          }}
        />
        <BuildSuccess>BUILD SUCCESS</BuildSuccess>
        <ReleaseVersion>Release v1.0.0</ReleaseVersion>
      </div>
    </>
  );
};
