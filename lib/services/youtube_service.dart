import 'package:youtube_explode_dart/youtube_explode_dart.dart' hide SearchResult;
import 'package:youtube_explode_dart/youtube_explode_dart.dart' as yt show SearchVideo;
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
        if (video is! yt.SearchVideo) continue;
        results.add(SearchResult(
          videoId: video.id.value,
          title: video.title,
          author: video.author,
          thumbnailUrl: 'https://img.youtube.com/vi/${video.id.value}/hqdefault.jpg',
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
      final searchResults = await _yt.search.search('${video.title} ${video.author}');

      final results = <SearchResult>[];
      for (final item in searchResults.take(maxResults + 1)) {
        if (item is! yt.SearchVideo || item.id.value == videoId) continue;
        results.add(SearchResult(
          videoId: item.id.value,
          title: item.title,
          author: item.author,
          thumbnailUrl: 'https://img.youtube.com/vi/${item.id.value}/hqdefault.jpg',
          duration: item.duration ?? Duration.zero,
        ));
        if (results.length >= maxResults) break;
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
