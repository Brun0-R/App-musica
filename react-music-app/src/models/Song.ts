export interface Song {
  id: string; // YouTube video ID (PK)
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration: number; // seconds
  isDownloaded: boolean;
  filePath?: string;
  createdAt: string; // ISO date string
}

export function songHighResThumbnail(song: Song): string {
  return `https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`;
}

export function songMediumResThumbnail(song: Song): string {
  return `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
}

export function songToMap(song: Song): Record<string, unknown> {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    thumbnail_url: song.thumbnailUrl,
    duration: song.duration,
    is_downloaded: song.isDownloaded ? 1 : 0,
    file_path: song.filePath ?? null,
    created_at: song.createdAt,
  };
}

export function songFromMap(map: Record<string, unknown>): Song {
  return {
    id: map.id as string,
    title: map.title as string,
    artist: map.artist as string,
    thumbnailUrl: (map.thumbnail_url as string) || '',
    duration: (map.duration as number) || 0,
    isDownloaded: map.is_downloaded === 1,
    filePath: (map.file_path as string) || undefined,
    createdAt: (map.created_at as string) || new Date().toISOString(),
  };
}
