import { SearchResult } from '../models/SearchResult';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://10.0.2.2:3001';

class YouTubeService {
  private static instance: YouTubeService;

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  async search(query: string, maxResults = 20): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${SERVER_URL}/search?q=${encodeURIComponent(query)}&limit=${maxResults}`
      );
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('YouTubeService.search error:', err);
      return [];
    }
  }

  async getAudioStreamUrl(videoId: string): Promise<string | null> {
    try {
      const res = await fetch(`${SERVER_URL}/stream/${videoId}`);
      if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error('YouTubeService.getAudioStreamUrl error:', err);
      return null;
    }
  }

  async getStreamData(videoId: string): Promise<{ url: string; contentLength?: number } | null> {
    try {
      const res = await fetch(`${SERVER_URL}/stream-data/${videoId}`);
      if (!res.ok) throw new Error(`Stream data fetch failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('YouTubeService.getStreamData error:', err);
      return null;
    }
  }

  async getRelatedVideos(videoId: string, maxResults = 10): Promise<SearchResult[]> {
    try {
      const res = await fetch(`${SERVER_URL}/related/${videoId}?limit=${maxResults}`);
      if (!res.ok) throw new Error(`Related fetch failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('YouTubeService.getRelatedVideos error:', err);
      return [];
    }
  }
}

export default YouTubeService.getInstance();
