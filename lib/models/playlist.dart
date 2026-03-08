class Playlist {
  final int? id;
  final String name;
  final String? coverUrl;
  final DateTime createdAt;
  final int songCount;

  Playlist({
    this.id,
    required this.name,
    this.coverUrl,
    DateTime? createdAt,
    this.songCount = 0,
  }) : createdAt = createdAt ?? DateTime.now();

  Playlist copyWith({
    int? id,
    String? name,
    String? coverUrl,
    DateTime? createdAt,
    int? songCount,
  }) {
    return Playlist(
      id: id ?? this.id,
      name: name ?? this.name,
      coverUrl: coverUrl ?? this.coverUrl,
      createdAt: createdAt ?? this.createdAt,
      songCount: songCount ?? this.songCount,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'cover_url': coverUrl,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory Playlist.fromMap(Map<String, dynamic> map) {
    return Playlist(
      id: map['id'] as int?,
      name: map['name'] as String,
      coverUrl: map['cover_url'] as String?,
      createdAt: map['created_at'] != null
          ? DateTime.parse(map['created_at'] as String)
          : DateTime.now(),
      songCount: map['song_count'] as int? ?? 0,
    );
  }
}
