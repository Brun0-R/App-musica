import 'package:flutter/material.dart';
import '../models/song.dart';
import '../models/search_result.dart';
import '../services/database_service.dart';
import '../services/recommendation_service.dart';

class HistoryProvider extends ChangeNotifier {
  final DatabaseService _dbService = DatabaseService();
  final RecommendationService _recService = RecommendationService();

  List<Song> _history = [];
  List<SearchResult> _recommendations = [];
  bool _isLoadingRecommendations = false;

  List<Song> get history => _history;
  List<SearchResult> get recommendations => _recommendations;
  bool get isLoadingRecommendations => _isLoadingRecommendations;

  Future<void> loadHistory() async {
    _history = await _dbService.getHistory();
    notifyListeners();
  }

  Future<void> loadRecommendations() async {
    _isLoadingRecommendations = true;
    notifyListeners();

    _recommendations = await _recService.getRecommendations();
    _isLoadingRecommendations = false;
    notifyListeners();
  }

  Song recommendationToSong(SearchResult result) {
    return Song(
      id: result.videoId,
      title: result.title,
      artist: result.author,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.durationInSeconds,
    );
  }
}
