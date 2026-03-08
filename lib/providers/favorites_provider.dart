import 'package:flutter/material.dart';
import '../models/song.dart';
import '../services/database_service.dart';

class FavoritesProvider extends ChangeNotifier {
  final DatabaseService _dbService = DatabaseService();

  List<Song> _favorites = [];
  final Set<String> _favoriteIds = {};

  List<Song> get favorites => _favorites;
  bool isFavorite(String songId) => _favoriteIds.contains(songId);

  Future<void> loadFavorites() async {
    _favorites = await _dbService.getFavorites();
    _favoriteIds.clear();
    for (final song in _favorites) {
      _favoriteIds.add(song.id);
    }
    notifyListeners();
  }

  Future<void> toggleFavorite(Song song) async {
    if (_favoriteIds.contains(song.id)) {
      await _dbService.removeFavorite(song.id);
      _favoriteIds.remove(song.id);
      _favorites.removeWhere((s) => s.id == song.id);
    } else {
      await _dbService.addFavorite(song);
      _favoriteIds.add(song.id);
      _favorites.insert(0, song);
    }
    notifyListeners();
  }
}
