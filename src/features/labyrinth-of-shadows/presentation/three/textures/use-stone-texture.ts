import { useMemo } from 'react';
import * as THREE from 'three';
import { generateStoneTexture, type StoneKind } from './stone-texture';

/** Uint8Array(RGBA) から繰り返しラップの DataTexture を生成 */
function toDataTexture(pixels: Uint8Array, size: number, srgb: boolean): THREE.DataTexture {
  const tex = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 石積みの color/roughness/normal を DataTexture 化して返す。
 * 生成は決定論的なので seed 固定で毎回同じ見た目になる。
 * 繰り返し回数（repeat）はデフォルト(1,1)のまま返すため、
 * 呼び出し側で用途に応じて `texture.repeat.set(...)` を設定する。
 */
export function useStoneMaps(
  kind: StoneKind,
  seed = 1337,
): { map: THREE.DataTexture; roughnessMap: THREE.DataTexture; normalMap: THREE.DataTexture } {
  return useMemo(() => {
    const size = 128;
    const t = generateStoneTexture({ size, seed, kind });
    return {
      map: toDataTexture(t.color, size, true),
      roughnessMap: toDataTexture(t.roughness, size, false),
      normalMap: toDataTexture(t.normal, size, false),
    };
  }, [kind, seed]);
}
