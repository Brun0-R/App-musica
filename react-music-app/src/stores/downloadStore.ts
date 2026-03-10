import { create } from 'zustand';
import { Song } from '../models/Song';
import DatabaseService from '../services/DatabaseService';
import DownloadService from '../services/DownloadService';

interface DownloadState {
  downloads: Song[];
  activeDownloads: Record<string, number>; // songId -> progress 0-1
  loadDownloads: () => Promise<void>;
  downloadSong: (song: Song) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  isDownloaded: (songId: string) => boolean;
  isDownloading: (songId: string) => boolean;
  getProgress: (songId: string) => number;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  activeDownloads: {},

  loadDownloads: async () => {
    const downloads = await DatabaseService.getDownloadedSongs();
    set({ downloads });
  },

  downloadSong: async (song) => {
    if (get().isDownloading(song.id) || get().isDownloaded(song.id)) return;

    set((state) => ({
      activeDownloads: { ...state.activeDownloads, [song.id]: 0 },
    }));

    const success = await DownloadService.downloadSong(song, (progress) => {
      set((state) => ({
        activeDownloads: { ...state.activeDownloads, [song.id]: progress },
      }));
    });

    if (success) {
      const updatedSong: Song = {
        ...song,
        isDownloaded: true,
        filePath: DownloadService.getLocalPath(song.id),
      };
      set((state) => {
        const { [song.id]: _, ...rest } = state.activeDownloads;
        return {
          downloads: [updatedSong, ...state.downloads],
          activeDownloads: rest,
        };
      });
    } else {
      set((state) => {
        const { [song.id]: _, ...rest } = state.activeDownloads;
        return { activeDownloads: rest };
      });
    }
  },

  deleteSong: async (songId) => {
    await DownloadService.deleteSong(songId);
    set((state) => ({
      downloads: state.downloads.filter((s) => s.id !== songId),
    }));
  },

  isDownloaded: (songId) => get().downloads.some((s) => s.id === songId),

  isDownloading: (songId) => songId in get().activeDownloads,

  getProgress: (songId) => get().activeDownloads[songId] ?? 0,
}));
