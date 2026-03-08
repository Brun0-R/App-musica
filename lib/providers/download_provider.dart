import 'package:flutter/material.dart';
import '../models/song.dart';
import '../services/database_service.dart';
import '../services/download_service.dart';

class DownloadProvider extends ChangeNotifier {
  final DownloadService _downloadService = DownloadService();
  final DatabaseService _dbService = DatabaseService();

  List<Song> _downloads = [];
  final Map<String, double> _activeDownloads = {};

  List<Song> get downloads => _downloads;
  bool isDownloaded(String songId) => _downloads.any((s) => s.id == songId);
  bool isDownloading(String songId) => _activeDownloads.containsKey(songId);
  double getProgress(String songId) => _activeDownloads[songId] ?? 0.0;

  Future<void> loadDownloads() async {
    _downloads = await _dbService.getDownloadedSongs();
    notifyListeners();
  }

  Future<void> downloadSong(Song song) async {
    if (_activeDownloads.containsKey(song.id)) return;

    _activeDownloads[song.id] = 0.0;
    notifyListeners();

    final success = await _downloadService.downloadSong(
      song,
      onProgress: (progress) {
        _activeDownloads[song.id] = progress;
        notifyListeners();
      },
    );

    _activeDownloads.remove(song.id);

    if (success) {
      await loadDownloads();
    }
    notifyListeners();
  }

  Future<void> deleteSong(String songId) async {
    await _downloadService.deleteSong(songId);
    _downloads.removeWhere((s) => s.id == songId);
    notifyListeners();
  }
}
