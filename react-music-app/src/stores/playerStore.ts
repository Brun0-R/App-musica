import { create } from 'zustand';
import { Song } from '../models/Song';
import AudioPlayerService, { RepeatMode } from '../services/AudioPlayerService';
import DatabaseService from '../services/DatabaseService';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  position: number; // seconds
  duration: number; // seconds
  isShuffle: boolean;
  repeatMode: RepeatMode;
  // Actions
  playSong: (song: Song, queue?: Song[], index?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => Promise<void>;
  addToQueue: (song: Song) => Promise<void>;
  removeFromQueue: (index: number) => Promise<void>;
  playFromQueue: (index: number) => Promise<void>;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  setIsLoading: (loading: boolean) => void;
  setQueue: (queue: Song[]) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  isShuffle: false,
  repeatMode: RepeatMode.Off,

  playSong: async (song, queue, index) => {
    set({ isLoading: true, currentSong: song });
    try {
      await DatabaseService.addToHistory(song);
      await AudioPlayerService.playSong(song, queue, index);
      set({ queue: queue ?? [song], isLoading: false });
    } catch (err) {
      console.error('playerStore.playSong error:', err);
      set({ isLoading: false });
    }
  },

  togglePlayPause: async () => {
    await AudioPlayerService.togglePlayPause();
  },

  playNext: async () => {
    const { queue, currentSong } = get();
    await AudioPlayerService.playNext();
    // History tracked via TrackPlayer event in App.tsx
  },

  playPrevious: async () => {
    await AudioPlayerService.playPrevious();
  },

  seek: async (position) => {
    await AudioPlayerService.seek(position);
  },

  toggleShuffle: () => {
    set((state) => ({ isShuffle: !state.isShuffle }));
  },

  toggleRepeat: async () => {
    const { repeatMode } = get();
    let next: RepeatMode;
    if (repeatMode === RepeatMode.Off) next = RepeatMode.Queue;
    else if (repeatMode === RepeatMode.Queue) next = RepeatMode.Track;
    else next = RepeatMode.Off;
    await AudioPlayerService.setRepeatMode(next);
    set({ repeatMode: next });
  },

  addToQueue: async (song) => {
    await AudioPlayerService.addToQueue(song);
    set((state) => ({ queue: [...state.queue, song] }));
  },

  removeFromQueue: async (index) => {
    await AudioPlayerService.removeFromQueue(index);
    set((state) => {
      const queue = [...state.queue];
      queue.splice(index, 1);
      return { queue };
    });
  },

  playFromQueue: async (index) => {
    const { queue } = get();
    await AudioPlayerService.playFromQueue(index);
    set({ currentSong: queue[index] ?? null });
  },

  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (pos) => set({ position: pos }),
  setDuration: (dur) => set({ duration: dur }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setQueue: (queue) => set({ queue }),
}));
