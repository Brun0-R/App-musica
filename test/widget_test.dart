import 'package:flutter_test/flutter_test.dart';
import 'package:musica/models/search_result.dart';
import 'package:musica/models/song.dart';

void main() {
  test('SearchResult returns correct duration in seconds', () {
    final result = SearchResult(
      videoId: 'abc123',
      title: 'Test Song',
      author: 'Test Artist',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: const Duration(minutes: 3, seconds: 45),
    );

    expect(result.durationInSeconds, 225);
  });

  test('Song toMap and fromMap roundtrip', () {
    final song = Song(
      id: 'abc123',
      title: 'Test Song',
      artist: 'Test Artist',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: 225,
    );

    final map = song.toMap();
    final restored = Song.fromMap(map);

    expect(restored.id, song.id);
    expect(restored.title, song.title);
    expect(restored.artist, song.artist);
    expect(restored.duration, song.duration);
  });
}
