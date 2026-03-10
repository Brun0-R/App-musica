import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
  Track,
  usePlaybackState,
  useProgress,
  useActiveTrack,
} from 'react-native-track-player';
import { Song } from '../models/Song';
import YouTubeService from './YouTubeService';

export { RepeatMode };

export async function setupTrackPlayer(): Promise<void> {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 5,
    });
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
      progressUpdateEventThrottle: 400,
    });
  } catch (err) {
    // Already set up
    console.log('TrackPlayer already initialized:', err);
  }
}

function songToTrack(song: Song, url: string): Track {
  return {
    id: song.id,
    url,
    title: song.title,
    artist: song.artist,
    artwork: song.thumbnailUrl,
    duration: song.duration,
  };
}

class AudioPlayerService {
  private static instance: AudioPlayerService;
  private _queue: Song[] = [];
  private _currentIndex = 0;

  static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  get queue(): Song[] {
    return this._queue;
  }

  get currentIndex(): number {
    return this._currentIndex;
  }

  async playSong(song: Song, queue?: Song[], index?: number): Promise<void> {
    const playQueue = queue ?? [song];
    const playIndex = index ?? 0;

    this._queue = playQueue;
    this._currentIndex = playIndex;

    await TrackPlayer.reset();

    // Load stream URLs for the queue (load current first, rest lazily)
    const tracks: Track[] = await Promise.all(
      playQueue.map(async (s, i) => {
        if (i === playIndex || playQueue.length <= 3) {
          const url = s.isDownloaded && s.filePath
            ? s.filePath
            : (await YouTubeService.getAudioStreamUrl(s.id)) || '';
          return songToTrack(s, url);
        }
        // Placeholder — will be resolved when played
        return songToTrack(s, '');
      })
    );

    await TrackPlayer.add(tracks);
    await TrackPlayer.skip(playIndex);
    await TrackPlayer.play();
  }

  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async togglePlayPause(): Promise<void> {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }

  async seek(positionSeconds: number): Promise<void> {
    await TrackPlayer.seekTo(positionSeconds);
  }

  async playNext(): Promise<void> {
    await TrackPlayer.skipToNext();
  }

  async playPrevious(): Promise<void> {
    const progress = await TrackPlayer.getProgress();
    if (progress.position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious();
    }
  }

  async addToQueue(song: Song): Promise<void> {
    const url = song.isDownloaded && song.filePath
      ? song.filePath
      : (await YouTubeService.getAudioStreamUrl(song.id)) || '';
    await TrackPlayer.add(songToTrack(song, url));
    this._queue.push(song);
  }

  async removeFromQueue(index: number): Promise<void> {
    await TrackPlayer.remove(index);
    this._queue.splice(index, 1);
  }

  async playFromQueue(index: number): Promise<void> {
    await TrackPlayer.skip(index);
    await TrackPlayer.play();
  }

  async setRepeatMode(mode: RepeatMode): Promise<void> {
    await TrackPlayer.setRepeatMode(mode);
  }

  async getRepeatMode(): Promise<RepeatMode> {
    return await TrackPlayer.getRepeatMode();
  }

  async stop(): Promise<void> {
    await TrackPlayer.reset();
    this._queue = [];
    this._currentIndex = 0;
  }
}

export default AudioPlayerService.getInstance();

// Re-export hooks for use in components
export { usePlaybackState, useProgress, useActiveTrack };

// Background playback service handler
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => TrackPlayer.seekTo(e.position));
  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    if (e.permanent) await TrackPlayer.pause();
    else if (e.paused) await TrackPlayer.pause();
    else await TrackPlayer.play();
  });
}
