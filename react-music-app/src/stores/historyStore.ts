import { create } from 'zustand';
import { Song } from '../models/Song';
import { SearchResult, searchResultToSong } from '../models/SearchResult';
import DatabaseService from '../services/DatabaseService';
import RecommendationService from '../services/RecommendationService';

interface HistoryState {
  history: Song[];
  recommendations: SearchResult[];
  isLoadingRecommendations: boolean;
  loadHistory: () => Promise<void>;
  loadRecommendations: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  history: [],
  recommendations: [],
  isLoadingRecommendations: false,

  loadHistory: async () => {
    const history = await DatabaseService.getHistory(50);
    set({ history });
  },

  loadRecommendations: async () => {
    set({ isLoadingRecommendations: true });
    try {
      const recommendations = await RecommendationService.getRecommendations(15);
      set({ recommendations, isLoadingRecommendations: false });
    } catch (err) {
      console.error('historyStore.loadRecommendations error:', err);
      set({ isLoadingRecommendations: false });
    }
  },
}));
