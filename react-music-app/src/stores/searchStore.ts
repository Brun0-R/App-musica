import { create } from 'zustand';
import { SearchResult, searchResultToSong } from '../models/SearchResult';
import { Song } from '../models/Song';
import YouTubeService from '../services/YouTubeService';

interface SearchState {
  results: SearchResult[];
  isSearching: boolean;
  query: string;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  resultsToSongs: () => Song[];
}

export const useSearchStore = create<SearchState>((set, get) => ({
  results: [],
  isSearching: false,
  query: '',

  search: async (query) => {
    if (!query.trim()) {
      set({ results: [], query: '', isSearching: false });
      return;
    }
    set({ isSearching: true, query });
    try {
      const results = await YouTubeService.search(query);
      set({ results, isSearching: false });
    } catch (err) {
      console.error('searchStore.search error:', err);
      set({ isSearching: false, results: [] });
    }
  },

  clearSearch: () => set({ results: [], query: '', isSearching: false }),

  resultsToSongs: () => get().results.map(searchResultToSong),
}));
