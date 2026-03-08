import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'youtube_service.dart';
import 'database_service.dart';
import '../models/song.dart';

class DownloadService {
  static final DownloadService _instance = DownloadService._internal();
  factory DownloadService() => _instance;
  DownloadService._internal();

  final YouTubeService _ytService = YouTubeService();
  final DatabaseService _dbService = DatabaseService();
  final Map<String, double> _downloadProgress = {};

  double getProgress(String songId) => _downloadProgress[songId] ?? 0.0;
  bool isDownloading(String songId) => _downloadProgress.containsKey(songId);

  Future<String> get _downloadDir async {
    final dir = await getApplicationDocumentsDirectory();
    final musicDir = Directory(p.join(dir.path, 'music'));
    if (!await musicDir.exists()) {
      await musicDir.create(recursive: true);
    }
    return musicDir.path;
  }

  Future<bool> downloadSong(Song song, {Function(double)? onProgress}) async {
    if (_downloadProgress.containsKey(song.id)) return false;

    try {
      _downloadProgress[song.id] = 0.0;

      final stream = await _ytService.getAudioStream(song.id);
      if (stream == null) {
        _downloadProgress.remove(song.id);
        return false;
      }

      final totalSize = await _ytService.getAudioStreamSize(song.id);
      final dir = await _downloadDir;
      final filePath = p.join(dir, '${song.id}.m4a');
      final file = File(filePath);
      final sink = file.openWrite();

      int received = 0;
      await for (final chunk in stream) {
        sink.add(chunk);
        received += chunk.length;
        if (totalSize != null && totalSize > 0) {
          final progress = received / totalSize;
          _downloadProgress[song.id] = progress;
          onProgress?.call(progress);
        }
      }

      await sink.close();
      _downloadProgress.remove(song.id);

      await _dbService.updateSongDownload(song.id, true, filePath);
      return true;
    } catch (e) {
      _downloadProgress.remove(song.id);
      print('Download error: $e');
      return false;
    }
  }

  Future<bool> deleteSong(String songId) async {
    try {
      final song = await _dbService.getSong(songId);
      if (song?.filePath != null) {
        final file = File(song!.filePath!);
        if (await file.exists()) {
          await file.delete();
        }
      }
      await _dbService.updateSongDownload(songId, false, null);
      return true;
    } catch (e) {
      print('Delete error: $e');
      return false;
    }
  }

  Future<String?> getLocalPath(String songId) async {
    final song = await _dbService.getSong(songId);
    if (song?.isDownloaded == true && song?.filePath != null) {
      final file = File(song!.filePath!);
      if (await file.exists()) {
        return song.filePath;
      }
    }
    return null;
  }
}
