class SearchResult {
  final String videoId;
  final String title;
  final String author;
  final String thumbnailUrl;
  final Duration duration;

  SearchResult({
    required this.videoId,
    required this.title,
    required this.author,
    required this.thumbnailUrl,
    required this.duration,
  });

  int get durationInSeconds => duration.inSeconds;
}
