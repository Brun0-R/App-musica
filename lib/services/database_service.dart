import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/song.dart';
import '../models/playlist.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  Database? _database;

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'musica.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        thumbnail_url TEXT,
        duration INTEGER,
        is_downloaded INTEGER DEFAULT 0,
        file_path TEXT,
        created_at TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cover_url TEXT,
        created_at TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE playlist_songs (
        playlist_id INTEGER,
        song_id TEXT,
        position INTEGER,
        PRIMARY KEY (playlist_id, song_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE favorites (
        song_id TEXT PRIMARY KEY,
        added_at TEXT,
        FOREIGN KEY (song_id) REFERENCES songs(id)
      )
    ''');

    await db.execute('''
      CREATE TABLE history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT,
        played_at TEXT,
        FOREIGN KEY (song_id) REFERENCES songs(id)
      )
    ''');
  }

  // === Songs ===

  Future<void> insertOrUpdateSong(Song song) async {
    final db = await database;
    await db.insert(
      'songs',
      song.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<Song?> getSong(String id) async {
    final db = await database;
    final maps = await db.query('songs', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return Song.fromMap(maps.first);
  }

  Future<void> updateSongDownload(String id, bool downloaded, String? path) async {
    final db = await database;
    await db.update(
      'songs',
      {'is_downloaded': downloaded ? 1 : 0, 'file_path': path},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // === Playlists ===

  Future<int> createPlaylist(String name) async {
    final db = await database;
    return await db.insert('playlists', {
      'name': name,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Playlist>> getPlaylists() async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT p.*, COUNT(ps.song_id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    ''');
    return maps.map((m) => Playlist.fromMap(m)).toList();
  }

  Future<void> deletePlaylist(int id) async {
    final db = await database;
    await db.delete('playlist_songs', where: 'playlist_id = ?', whereArgs: [id]);
    await db.delete('playlists', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> renamePlaylist(int id, String name) async {
    final db = await database;
    await db.update('playlists', {'name': name}, where: 'id = ?', whereArgs: [id]);
  }

  // === Playlist Songs ===

  Future<void> addSongToPlaylist(int playlistId, Song song) async {
    final db = await database;
    await insertOrUpdateSong(song);

    final count = await db.rawQuery(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM playlist_songs WHERE playlist_id = ?',
      [playlistId],
    );
    final nextPos = (count.first['next_pos'] as int?) ?? 0;

    await db.insert(
      'playlist_songs',
      {'playlist_id': playlistId, 'song_id': song.id, 'position': nextPos},
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  Future<void> removeSongFromPlaylist(int playlistId, String songId) async {
    final db = await database;
    await db.delete(
      'playlist_songs',
      where: 'playlist_id = ? AND song_id = ?',
      whereArgs: [playlistId, songId],
    );
  }

  Future<List<Song>> getPlaylistSongs(int playlistId) async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT s.* FROM songs s
      INNER JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position ASC
    ''', [playlistId]);
    return maps.map((m) => Song.fromMap(m)).toList();
  }

  // === Favorites ===

  Future<void> addFavorite(Song song) async {
    final db = await database;
    await insertOrUpdateSong(song);
    await db.insert(
      'favorites',
      {'song_id': song.id, 'added_at': DateTime.now().toIso8601String()},
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  Future<void> removeFavorite(String songId) async {
    final db = await database;
    await db.delete('favorites', where: 'song_id = ?', whereArgs: [songId]);
  }

  Future<bool> isFavorite(String songId) async {
    final db = await database;
    final result = await db.query(
      'favorites',
      where: 'song_id = ?',
      whereArgs: [songId],
    );
    return result.isNotEmpty;
  }

  Future<List<Song>> getFavorites() async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT s.* FROM songs s
      INNER JOIN favorites f ON s.id = f.song_id
      ORDER BY f.added_at DESC
    ''');
    return maps.map((m) => Song.fromMap(m)).toList();
  }

  // === History ===

  Future<void> addToHistory(Song song) async {
    final db = await database;
    await insertOrUpdateSong(song);
    await db.insert('history', {
      'song_id': song.id,
      'played_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Song>> getHistory({int limit = 50}) async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT s.*, h.played_at FROM songs s
      INNER JOIN (
        SELECT song_id, MAX(played_at) as played_at
        FROM history
        GROUP BY song_id
      ) h ON s.id = h.song_id
      ORDER BY h.played_at DESC
      LIMIT ?
    ''', [limit]);
    return maps.map((m) => Song.fromMap(m)).toList();
  }

  Future<List<String>> getTopArtists({int limit = 10}) async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT s.artist, COUNT(*) as play_count
      FROM history h
      INNER JOIN songs s ON h.song_id = s.id
      WHERE s.artist IS NOT NULL AND s.artist != ''
      GROUP BY s.artist
      ORDER BY play_count DESC
      LIMIT ?
    ''', [limit]);
    return maps.map((m) => m['artist'] as String).toList();
  }

  // === Downloads ===

  Future<List<Song>> getDownloadedSongs() async {
    final db = await database;
    final maps = await db.query(
      'songs',
      where: 'is_downloaded = 1',
      orderBy: 'created_at DESC',
    );
    return maps.map((m) => Song.fromMap(m)).toList();
  }
}
