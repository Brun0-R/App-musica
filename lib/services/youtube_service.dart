import 'package:youtube_explode_dart/youtube_explode_dart.dart' hide SearchResult;
import '../models/search_result.dart';

class YouTubeService {
  static final YouTubeService _instance = YouTubeService._internal();
  factory YouTubeService() => _instance;
  YouTubeService._internal();

  final YoutubeExplode _yt = YoutubeExplode();

  Future<List<SearchResult>> search(String query, {int maxResults = 20}) async {
    try {
      final searchResults = await _yt.search.search(query);
      final results = <SearchResult>[];

      for (final video in searchResults.take(maxResults)) {
        results.add(SearchResult(
          videoId: video.id.value,
          title: video.title,
          author: video.author,
          thumbnailUrl: video.thumbnails.highResUrl,
          duration: video.duration ?? Duration.zero,
        ));
      }

      return results;
    } catch (e) {
      print('YouTube search error: $e');
      return [];
    }
  }

  Future<String?> getAudioStreamUrl(String videoId) async {
    try {
      final manifest = await _yt.videos.streamsClient.getManifest(videoId);
      final audioStreams = manifest.audioOnly.sortByBitrate();
      if (audioStreams.isEmpty) return null;
      return audioStreams.last.url.toString();
    } catch (e) {
      print('Error getting audio stream: $e');
      return null;
    }
  }

  Future<Stream<List<int>>?> getAudioStream(String videoId) async {
    try {
      final manifest = await _yt.videos.streamsClient.getManifest(videoId);
      final audioStreams = manifest.audioOnly.sortByBitrate();
      if (audioStreams.isEmpty) return null;
      final streamInfo = audioStreams.last;
      return _yt.videos.streamsClient.get(streamInfo);
    } catch (e) {
      print('Error getting audio stream data: $e');
      return null;
    }
  }

  Future<int?> getAudioStreamSize(String videoId) async {
    try {
      final manifest = await _yt.videos.streamsClient.getManifest(videoId);
      final audioStreams = manifest.audioOnly.sortByBitrate();
      if (audioStreams.isEmpty) return null;
      return audioStreams.last.size.totalBytes;
    } catch (e) {
      return null;
    }
  }

  Future<List<SearchResult>> getRelatedVideos(String videoId, {int maxResults = 10}) async {
    try {
      final video = await _yt.videos.get(videoId);
      final relatedVideos = await _yt.videos.getRelatedVideos(video);
      if (relatedVideos == null) return [];

      final results = <SearchResult>[];
      for (final related in relatedVideos.take(maxResults)) {
        results.add(SearchResult(
          videoId: related.id.value,
          title: related.title,
          author: related.author,
          thumbnailUrl: related.thumbnails.highResUrl,
          duration: related.duration ?? Duration.zero,
        ));
      }
      return results;
    } catch (e) {
      print('Error getting related videos: $e');
      return [];
    }
  }

  void dispose() {
    _yt.close();
  }
}
