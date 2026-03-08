import 'package:flutter/material.dart';
import '../models/playlist.dart';
import '../models/song.dart';
import '../services/database_service.dart';

class PlaylistProvider extends ChangeNotifier {
  final DatabaseService _dbService = DatabaseService();

  List<Playlist> _playlists = [];
  Map<int, List<Song>> _playlistSongs = {};

  List<Playlist> get playlists => _playlists;

  List<Song> getPlaylistSongs(int playlistId) => _playlistSongs[playlistId] ?? [];

  Future<void> loadPlaylists() async {
    _playlists = await _dbService.getPlaylists();
    notifyListeners();
  }

  Future<int> createPlaylist(String name) async {
    final id = await _dbService.createPlaylist(name);
    await loadPlaylists();
    return id;
  }

  Future<void> deletePlaylist(int id) async {
    await _dbService.deletePlaylist(id);
    _playlistSongs.remove(id);
    await loadPlaylists();
  }

  Future<void> renamePlaylist(int id, String name) async {
    await _dbService.renamePlaylist(id, name);
    await loadPlaylists();
  }

  Future<void> loadPlaylistSongs(int playlistId) async {
    final songs = await _dbService.getPlaylistSongs(playlistId);
    _playlistSongs[playlistId] = songs;
    notifyListeners();
  }

  Future<void> addSongToPlaylist(int playlistId, Song song) async {
    await _dbService.addSongToPlaylist(playlistId, song);
    await loadPlaylistSongs(playlistId);
    await loadPlaylists();
  }

  Future<void> removeSongFromPlaylist(int playlistId, String songId) async {
    await _dbService.removeSongFromPlaylist(playlistId, songId);
    await loadPlaylistSongs(playlistId);
    await loadPlaylists();
  }
}
