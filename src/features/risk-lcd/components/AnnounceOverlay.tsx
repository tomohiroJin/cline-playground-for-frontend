import React from 'react';
import type { AnnounceInfo } from '../hooks';
import {
  AnnounceOverlay,
  AnnTitle,
  AnnSub,
  AnnDetail,
  AnnMod,
} from './styles';

interface Props {
  announce: AnnounceInfo;
}

// ステージ開始/クリアアナウンスオーバーレイ
const AnnounceOverlayComp: React.FC<Props> = ({ announce }) => (
  <AnnounceOverlay>
    <AnnTitle>
      {announce.mod !== null || announce.buildSummary
        ? `STAGE ${announce.stage + 1}`
        : 'CLEAR!'}
    </AnnTitle>
    <AnnSub>
      {announce.mod !== null || announce.buildSummary
        ? `× ${announce.cycles} CYCLES`
        : announce.forecast}
    </AnnSub>
    {announce.mod && (
      <AnnDetail>
        ⚠ {announce.mod.nm} ⚠<br />
        {announce.mod.ds}
      </AnnDetail>
    )}
    <AnnMod>{announce.forecast}</AnnMod>
    {announce.buildSummary && <AnnMod>{announce.buildSummary}</AnnMod>}
  </AnnounceOverlay>
);

export default AnnounceOverlayComp;
