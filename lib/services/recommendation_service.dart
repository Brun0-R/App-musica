import 'youtube_service.dart';
import 'database_service.dart';
import '../models/search_result.dart';

class RecommendationService {
  static final RecommendationService _instance = RecommendationService._internal();
  factory RecommendationService() => _instance;
  RecommendationService._internal();

  final YouTubeService _ytService = YouTubeService();
  final DatabaseService _dbService = DatabaseService();

  Future<List<SearchResult>> getRecommendations({int maxResults = 15}) async {
    try {
      // Get top artists from history
      final topArtists = await _dbService.getTopArtists(limit: 5);
      final history = await _dbService.getHistory(limit: 10);

      if (topArtists.isEmpty && history.isEmpty) {
        // No history, return trending music
        return await _ytService.search('trending music 2026', maxResults: maxResults);
      }

      final recommendations = <SearchResult>[];
      final seenIds = <String>{};

      // Add history song IDs to avoid duplicates
      for (final song in history) {
        seenIds.add(song.id);
      }

      // Get related videos from recent history
      if (history.isNotEmpty) {
        for (final song in history.take(3)) {
          final related = await _ytService.getRelatedVideos(song.id, maxResults: 5);
          for (final result in related) {
            if (!seenIds.contains(result.videoId)) {
              seenIds.add(result.videoId);
              recommendations.add(result);
            }
          }
          if (recommendations.length >= maxResults) break;
        }
      }

      // Search by top artists if we need more
      if (recommendations.length < maxResults && topArtists.isNotEmpty) {
        for (final artist in topArtists.take(3)) {
          final results = await _ytService.search('$artist music', maxResults: 5);
          for (final result in results) {
            if (!seenIds.contains(result.videoId)) {
              seenIds.add(result.videoId);
              recommendations.add(result);
            }
          }
          if (recommendations.length >= maxResults) break;
        }
      }

      return recommendations.take(maxResults).toList();
    } catch (e) {
      print('Recommendation error: $e');
      return [];
    }
  }
}
