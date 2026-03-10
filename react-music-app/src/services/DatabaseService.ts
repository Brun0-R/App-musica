import * as SQLite from 'expo-sqlite';
import { Song, songFromMap, songToMap } from '../models/Song';
import { Playlist, playlistFromMap } from '../models/Playlist';

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('musica.db');
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    await this.db!.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 0,
        is_downloaded INTEGER NOT NULL DEFAULT 0,
        file_path TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cover_url TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlist_songs (
        playlist_id INTEGER NOT NULL,
        song_id TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (playlist_id, song_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS favorites (
        song_id TEXT PRIMARY KEY,
        added_at TEXT NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        played_at TEXT NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );
    `);
  }

  // --- Songs ---
  async insertOrUpdateSong(song: Song): Promise<void> {
    const map = songToMap(song);
    await this.db!.runAsync(
      `INSERT OR REPLACE INTO songs (id, title, artist, thumbnail_url, duration, is_downloaded, file_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [map.id, map.title, map.artist, map.thumbnail_url, map.duration, map.is_downloaded, map.file_path, map.created_at]
    );
  }

  async getSong(id: string): Promise<Song | null> {
    const row = await this.db!.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM songs WHERE id = ?', [id]
    );
    return row ? songFromMap(row) : null;
  }

  async updateSongDownload(id: string, isDownloaded: boolean, filePath?: string): Promise<void> {
    await this.db!.runAsync(
      'UPDATE songs SET is_downloaded = ?, file_path = ? WHERE id = ?',
      [isDownloaded ? 1 : 0, filePath ?? null, id]
    );
  }

  async getDownloadedSongs(): Promise<Song[]> {
    const rows = await this.db!.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM songs WHERE is_downloaded = 1 ORDER BY created_at DESC'
    );
    return rows.map(songFromMap);
  }

  // --- Playlists ---
  async createPlaylist(name: string): Promise<number> {
    const result = await this.db!.runAsync(
      'INSERT INTO playlists (name, cover_url, created_at) VALUES (?, ?, ?)',
      [name, null, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  }

  async getPlaylists(): Promise<Playlist[]> {
    const rows = await this.db!.getAllAsync<Record<string, unknown>>(
      `SELECT p.*, COUNT(ps.song_id) as song_count
       FROM playlists p
       LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    return rows.map(playlistFromMap);
  }

  async deletePlaylist(id: number): Promise<void> {
    await this.db!.runAsync('DELETE FROM playlists WHERE id = ?', [id]);
  }

  async renamePlaylist(id: number, name: string): Promise<void> {
    await this.db!.runAsync('UPDATE playlists SET name = ? WHERE id = ?', [name, id]);
  }

  // --- Playlist Songs ---
  async addSongToPlaylist(playlistId: number, song: Song): Promise<void> {
    await this.insertOrUpdateSong(song);
    const maxPos = await this.db!.getFirstAsync<{ max_pos: number }>(
      'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?',
      [playlistId]
    );
    const pos = (maxPos?.max_pos ?? -1) + 1;
    await this.db!.runAsync(
      'INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
      [playlistId, song.id, pos]
    );
  }

  async removeSongFromPlaylist(playlistId: number, songId: string): Promise<void> {
    await this.db!.runAsync(
      'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
      [playlistId, songId]
    );
  }

  async getPlaylistSongs(playlistId: number): Promise<Song[]> {
    const rows = await this.db!.getAllAsync<Record<string, unknown>>(
      `SELECT s.* FROM songs s
       JOIN playlist_songs ps ON s.id = ps.song_id
       WHERE ps.playlist_id = ?
       ORDER BY ps.position`,
      [playlistId]
    );
    return rows.map(songFromMap);
  }

  // --- Favorites ---
  async addFavorite(song: Song): Promise<void> {
    await this.insertOrUpdateSong(song);
    await this.db!.runAsync(
      'INSERT OR IGNORE INTO favorites (song_id, added_at) VALUES (?, ?)',
      [song.id, new Date().toISOString()]
    );
  }

  async removeFavorite(songId: string): Promise<void> {
    await this.db!.runAsync('DELETE FROM favorites WHERE song_id = ?', [songId]);
  }

  async isFavorite(songId: string): Promise<boolean> {
    const row = await this.db!.getFirstAsync(
      'SELECT 1 FROM favorites WHERE song_id = ?', [songId]
    );
    return row !== null;
  }

  async getFavorites(): Promise<Song[]> {
    const rows = await this.db!.getAllAsync<Record<string, unknown>>(
      `SELECT s.* FROM songs s
       JOIN favorites f ON s.id = f.song_id
       ORDER BY f.added_at DESC`
    );
    return rows.map(songFromMap);
  }

  // --- History ---
  async addToHistory(song: Song): Promise<void> {
    await this.insertOrUpdateSong(song);
    await this.db!.runAsync(
      'INSERT INTO history (song_id, played_at) VALUES (?, ?)',
      [song.id, new Date().toISOString()]
    );
  }

  async getHistory(limit = 50): Promise<Song[]> {
    const rows = await this.db!.getAllAsync<Record<string, unknown>>(
      `SELECT DISTINCT s.* FROM songs s
       JOIN history h ON s.id = h.song_id
       ORDER BY h.played_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map(songFromMap);
  }

  async getTopArtists(limit = 5): Promise<string[]> {
    const rows = await this.db!.getAllAsync<{ artist: string }>(
      `SELECT s.artist, COUNT(*) as play_count
       FROM history h JOIN songs s ON h.song_id = s.id
       GROUP BY s.artist
       ORDER BY play_count DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((r) => r.artist);
  }

  async getRecentlyPlayedIds(limit = 10): Promise<string[]> {
    const rows = await this.db!.getAllAsync<{ song_id: string }>(
      `SELECT DISTINCT song_id FROM history ORDER BY played_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map((r) => r.song_id);
  }
}

export default DatabaseService.getInstance();
