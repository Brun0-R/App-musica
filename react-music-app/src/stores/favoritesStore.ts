import { create } from 'zustand';
import { Song } from '../models/Song';
import DatabaseService from '../services/DatabaseService';

interface FavoritesState {
  favorites: Song[];
  favoriteIds: Set<string>;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (song: Song) => Promise<void>;
  isFavorite: (songId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  favoriteIds: new Set(),

  loadFavorites: async () => {
    const favorites = await DatabaseService.getFavorites();
    set({ favorites, favoriteIds: new Set(favorites.map((s) => s.id)) });
  },

  toggleFavorite: async (song) => {
    const { favoriteIds } = get();
    if (favoriteIds.has(song.id)) {
      await DatabaseService.removeFavorite(song.id);
      set((state) => {
        const ids = new Set(state.favoriteIds);
        ids.delete(song.id);
        return {
          favorites: state.favorites.filter((s) => s.id !== song.id),
          favoriteIds: ids,
        };
      });
    } else {
      await DatabaseService.addFavorite(song);
      set((state) => {
        const ids = new Set(state.favoriteIds);
        ids.add(song.id);
        return {
          favorites: [song, ...state.favorites],
          favoriteIds: ids,
        };
      });
    }
  },

  isFavorite: (songId) => get().favoriteIds.has(songId),
}));
