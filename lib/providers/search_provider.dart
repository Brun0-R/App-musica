import 'package:flutter/material.dart';
import '../models/search_result.dart';
import '../models/song.dart';
import '../services/youtube_service.dart';

class SearchProvider extends ChangeNotifier {
  final YouTubeService _ytService = YouTubeService();

  List<SearchResult> _results = [];
  bool _isSearching = false;
  String _query = '';

  List<SearchResult> get results => _results;
  bool get isSearching => _isSearching;
  String get query => _query;
  bool get hasResults => _results.isNotEmpty;

  Future<void> search(String query) async {
    if (query.trim().isEmpty) {
      _results = [];
      _query = '';
      notifyListeners();
      return;
    }

    _query = query;
    _isSearching = true;
    notifyListeners();

    _results = await _ytService.search(query);
    _isSearching = false;
    notifyListeners();
  }

  void clearSearch() {
    _results = [];
    _query = '';
    _isSearching = false;
    notifyListeners();
  }

  Song searchResultToSong(SearchResult result) {
    return Song(
      id: result.videoId,
      title: result.title,
      artist: result.author,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.durationInSeconds,
    );
  }

  List<Song> resultsToSongs() {
    return _results.map((r) => searchResultToSong(r)).toList();
  }
}
