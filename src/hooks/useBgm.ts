import { useCallback, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { bgmTrackIdAtom, bgmVolumeAtom, bgmPlayingAtom } from '../store/atoms';
import { bgmTracks } from '../utils/bgm-data';

const BGM_VOLUME_KEY = 'puzzle_bgm_volume';
const BGM_TRACK_KEY = 'puzzle_bgm_track';

export const useBgm = () => {
  const [trackId, setTrackId] = useAtom(bgmTrackIdAtom);
  const [volume, setVolume] = useAtom(bgmVolumeAtom);
  const [playing, setPlaying] = useAtom(bgmPlayingAtom);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toneRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const melodySynthRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bassSynthRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const melodySeqRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bassSeqRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gainRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // Load saved settings on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem(BGM_VOLUME_KEY);
    if (savedVolume !== null) setVolume(Number(savedVolume));
    const savedTrack = localStorage.getItem(BGM_TRACK_KEY);
    if (savedTrack) setTrackId(savedTrack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureInitialized = useCallback(async (): Promise<boolean> => {
    if (initializedRef.current) return true;
    try {
      const Tone = await import('tone');
      toneRef.current = Tone;
      await Tone.start();
      gainRef.current = new Tone.Gain(volume / 100).toDestination();
      initializedRef.current = true;
      return true;
    } catch {
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPlayback = useCallback(() => {
    if (melodySeqRef.current) {
      melodySeqRef.current.stop();
      melodySeqRef.current.dispose();
      melodySeqRef.current = null;
    }
    if (bassSeqRef.current) {
      bassSeqRef.current.stop();
      bassSeqRef.current.dispose();
      bassSeqRef.current = null;
    }
    if (melodySynthRef.current) {
      melodySynthRef.current.dispose();
      melodySynthRef.current = null;
    }
    if (bassSynthRef.current) {
      bassSynthRef.current.dispose();
      bassSynthRef.current = null;
    }
    if (toneRef.current) {
      toneRef.current.getTransport().stop();
      toneRef.current.getTransport().cancel();
    }
  }, []);

  const startPlayback = useCallback((id: string) => {
    const Tone = toneRef.current;
    if (!Tone || !gainRef.current) return;

    stopPlayback();

    const track = bgmTracks.find(t => t.id === id);
    if (!track) return;

    const transport = Tone.getTransport();
    transport.bpm.value = track.bpm;

    melodySynthRef.current = new Tone.Synth({
      oscillator: { type: track.melodyWaveform },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.1 },
    }).connect(gainRef.current);
    melodySynthRef.current.volume.value = Tone.gainToDb(track.melodyGain);

    bassSynthRef.current = new Tone.Synth({
      oscillator: { type: track.bassWaveform },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.1 },
    }).connect(gainRef.current);
    bassSynthRef.current.volume.value = Tone.gainToDb(track.bassGain);

    melodySeqRef.current = new Tone.Sequence(
      (time: number, note: number | null) => {
        if (note !== null && melodySynthRef.current) {
          melodySynthRef.current.triggerAttackRelease(
            Tone.Frequency(note, 'midi').toFrequency(),
            '8n',
            time
          );
        }
      },
      track.melody,
      '4n'
    );

    bassSeqRef.current = new Tone.Sequence(
      (time: number, note: number | null) => {
        if (note !== null && bassSynthRef.current) {
          bassSynthRef.current.triggerAttackRelease(
            Tone.Frequency(note, 'midi').toFrequency(),
            '8n',
            time
          );
        }
      },
      track.bass,
      '4n'
    );

    melodySeqRef.current.loop = true;
    bassSeqRef.current.loop = true;
    melodySeqRef.current.start(0);
    bassSeqRef.current.start(0);
    transport.start();
  }, [stopPlayback]);

  const togglePlay = useCallback(async () => {
    const ok = await ensureInitialized();
    if (!ok) return;

    if (playing) {
      stopPlayback();
      setPlaying(false);
    } else {
      startPlayback(trackId);
      setPlaying(true);
    }
  }, [playing, trackId, startPlayback, stopPlayback, setPlaying, ensureInitialized]);

  const nextTrack = useCallback(async () => {
    const idx = bgmTracks.findIndex(t => t.id === trackId);
    const nextIdx = (idx + 1) % bgmTracks.length;
    const newId = bgmTracks[nextIdx].id;
    setTrackId(newId);
    localStorage.setItem(BGM_TRACK_KEY, newId);
    if (playing) {
      const ok = await ensureInitialized();
      if (ok) startPlayback(newId);
    }
  }, [trackId, playing, startPlayback, setTrackId, ensureInitialized]);

  const prevTrack = useCallback(async () => {
    const idx = bgmTracks.findIndex(t => t.id === trackId);
    const prevIdx = (idx - 1 + bgmTracks.length) % bgmTracks.length;
    const newId = bgmTracks[prevIdx].id;
    setTrackId(newId);
    localStorage.setItem(BGM_TRACK_KEY, newId);
    if (playing) {
      const ok = await ensureInitialized();
      if (ok) startPlayback(newId);
    }
  }, [trackId, playing, startPlayback, setTrackId, ensureInitialized]);

  const changeVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem(BGM_VOLUME_KEY, String(newVolume));
    if (gainRef.current) {
      gainRef.current.gain.value = newVolume / 100;
    }
  }, [setVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  const currentTrack = bgmTracks.find(t => t.id === trackId) ?? bgmTracks[0];

  return {
    initAudio: ensureInitialized,
    togglePlay,
    nextTrack,
    prevTrack,
    changeVolume,
    currentTrack,
    playing,
    volume,
  };
};
