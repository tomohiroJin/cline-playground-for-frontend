/* eslint-disable react/no-unknown-property */
import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BLOOM_CONFIG, VIGNETTE_CONFIG, bloomIntensity } from './lighting-config';

/**
 * 後処理パス。発光体（アイテム・敵の目・出口ランプ・トーチ炎）だけが
 * luminanceThreshold を超えて Bloom でにじむ。壁・床は閾値未満のためにじまない。
 * Vignette で周辺を落として閉塞感を出す。
 */
export function PostFx({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity(reducedMotion)}
        luminanceThreshold={BLOOM_CONFIG.luminanceThreshold}
        luminanceSmoothing={BLOOM_CONFIG.luminanceSmoothing}
        mipmapBlur={BLOOM_CONFIG.mipmapBlur}
      />
      <Vignette offset={VIGNETTE_CONFIG.offset} darkness={VIGNETTE_CONFIG.darkness} />
    </EffectComposer>
  );
}
