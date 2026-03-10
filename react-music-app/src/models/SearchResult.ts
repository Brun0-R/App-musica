import { Song } from './Song';

export interface SearchResult {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export function searchResultToSong(result: SearchResult): Song {
  return {
    id: result.videoId,
    title: result.title,
    artist: result.author,
    thumbnailUrl: result.thumbnailUrl,
    duration: result.durationSeconds,
    isDownloaded: false,
    createdAt: new Date().toISOString(),
  };
}
