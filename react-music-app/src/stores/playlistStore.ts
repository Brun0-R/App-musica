import { create } from 'zustand';
import { Playlist } from '../models/Playlist';
import { Song } from '../models/Song';
import DatabaseService from '../services/DatabaseService';

interface PlaylistState {
  playlists: Playlist[];
  playlistSongs: Record<number, Song[]>;
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<number>;
  deletePlaylist: (id: number) => Promise<void>;
  renamePlaylist: (id: number, name: string) => Promise<void>;
  loadPlaylistSongs: (playlistId: number) => Promise<void>;
  getPlaylistSongs: (playlistId: number) => Song[];
  addSongToPlaylist: (playlistId: number, song: Song) => Promise<void>;
  removeSongFromPlaylist: (playlistId: number, songId: string) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  playlistSongs: {},

  loadPlaylists: async () => {
    const playlists = await DatabaseService.getPlaylists();
    set({ playlists });
  },

  createPlaylist: async (name) => {
    const id = await DatabaseService.createPlaylist(name);
    await get().loadPlaylists();
    return id;
  },

  deletePlaylist: async (id) => {
    await DatabaseService.deletePlaylist(id);
    set((state) => ({
      playlists: state.playlists.filter((p) => p.id !== id),
      playlistSongs: Object.fromEntries(
        Object.entries(state.playlistSongs).filter(([k]) => Number(k) !== id)
      ),
    }));
  },

  renamePlaylist: async (id, name) => {
    await DatabaseService.renamePlaylist(id, name);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  },

  loadPlaylistSongs: async (playlistId) => {
    const songs = await DatabaseService.getPlaylistSongs(playlistId);
    set((state) => ({
      playlistSongs: { ...state.playlistSongs, [playlistId]: songs },
    }));
  },

  getPlaylistSongs: (playlistId) => get().playlistSongs[playlistId] ?? [],

  addSongToPlaylist: async (playlistId, song) => {
    await DatabaseService.addSongToPlaylist(playlistId, song);
    await get().loadPlaylistSongs(playlistId);
    await get().loadPlaylists();
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    await DatabaseService.removeSongFromPlaylist(playlistId, songId);
    set((state) => ({
      playlistSongs: {
        ...state.playlistSongs,
        [playlistId]: (state.playlistSongs[playlistId] ?? []).filter((s) => s.id !== songId),
      },
    }));
    await get().loadPlaylists();
  },
}));
