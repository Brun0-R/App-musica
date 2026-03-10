export interface Playlist {
  id: number;
  name: string;
  coverUrl?: string;
  createdAt: string;
  songCount: number;
}

export function playlistFromMap(map: Record<string, unknown>): Playlist {
  return {
    id: map.id as number,
    name: map.name as string,
    coverUrl: (map.cover_url as string) || undefined,
    createdAt: (map.created_at as string) || new Date().toISOString(),
    songCount: (map.song_count as number) || 0,
  };
}

export function playlistToMap(playlist: Omit<Playlist, 'id' | 'songCount'>): Record<string, unknown> {
  return {
    name: playlist.name,
    cover_url: playlist.coverUrl ?? null,
    created_at: playlist.createdAt,
  };
}
