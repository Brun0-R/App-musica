class Song {
  final String id; // YouTube video ID
  final String title;
  final String artist;
  final String thumbnailUrl;
  final int duration; // seconds
  final bool isDownloaded;
  final String? filePath;
  final DateTime createdAt;

  Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.thumbnailUrl,
    required this.duration,
    this.isDownloaded = false,
    this.filePath,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  String get highResThumbnail => 'https://img.youtube.com/vi/$id/maxresdefault.jpg';
  String get mediumResThumbnail => 'https://img.youtube.com/vi/$id/hqdefault.jpg';

  Song copyWith({
    String? id,
    String? title,
    String? artist,
    String? thumbnailUrl,
    int? duration,
    bool? isDownloaded,
    String? filePath,
    DateTime? createdAt,
  }) {
    return Song(
      id: id ?? this.id,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      duration: duration ?? this.duration,
      isDownloaded: isDownloaded ?? this.isDownloaded,
      filePath: filePath ?? this.filePath,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'artist': artist,
      'thumbnail_url': thumbnailUrl,
      'duration': duration,
      'is_downloaded': isDownloaded ? 1 : 0,
      'file_path': filePath,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory Song.fromMap(Map<String, dynamic> map) {
    return Song(
      id: map['id'] as String,
      title: map['title'] as String,
      artist: map['artist'] as String? ?? 'Artista desconocido',
      thumbnailUrl: map['thumbnail_url'] as String? ?? '',
      duration: map['duration'] as int? ?? 0,
      isDownloaded: (map['is_downloaded'] as int? ?? 0) == 1,
      filePath: map['file_path'] as String?,
      createdAt: map['created_at'] != null
          ? DateTime.parse(map['created_at'] as String)
          : DateTime.now(),
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is Song && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
