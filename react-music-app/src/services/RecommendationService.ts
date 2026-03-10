import { SearchResult } from '../models/SearchResult';
import YouTubeService from './YouTubeService';
import DatabaseService from './DatabaseService';

class RecommendationService {
  private static instance: RecommendationService;

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  async getRecommendations(maxResults = 15): Promise<SearchResult[]> {
    try {
      const recentIds = await DatabaseService.getRecentlyPlayedIds(10);
      if (recentIds.length === 0) {
        return await YouTubeService.search('trending music', maxResults);
      }

      const topArtists = await DatabaseService.getTopArtists(3);
      const seen = new Set<string>(recentIds);
      const results: SearchResult[] = [];

      // Get related videos for top 3 recently played songs
      const topRecent = recentIds.slice(0, 3);
      for (const videoId of topRecent) {
        if (results.length >= maxResults) break;
        const related = await YouTubeService.getRelatedVideos(videoId, 5);
        for (const r of related) {
          if (!seen.has(r.videoId)) {
            seen.add(r.videoId);
            results.push(r);
          }
        }
      }

      // If still need more, search by top artists
      if (results.length < maxResults && topArtists.length > 0) {
        for (const artist of topArtists) {
          if (results.length >= maxResults) break;
          const artistResults = await YouTubeService.search(artist, 5);
          for (const r of artistResults) {
            if (!seen.has(r.videoId)) {
              seen.add(r.videoId);
              results.push(r);
              if (results.length >= maxResults) break;
            }
          }
        }
      }

      return results.slice(0, maxResults);
    } catch (err) {
      console.error('RecommendationService.getRecommendations error:', err);
      return [];
    }
  }
}

export default RecommendationService.getInstance();
