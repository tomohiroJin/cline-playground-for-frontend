import React from 'react';
import { VideoOverlayContainer, VideoPlayer, CloseButton } from './PuzzleBoard.styles';

type VideoOverlayProps = {
  videoUrl: string;
  onClose: () => void;
};

const VideoOverlay: React.FC<VideoOverlayProps> = ({ videoUrl, onClose }) => (
  <VideoOverlayContainer>
    <VideoPlayer src={videoUrl} autoPlay controls onEnded={onClose} />
    <CloseButton onClick={onClose} title="動画を閉じる">
      ✕
    </CloseButton>
  </VideoOverlayContainer>
);

export default VideoOverlay;
