import 'dart:async';
import 'package:flutter/material.dart';
import '../models/song.dart';
import '../services/audio_player_service.dart';
import '../services/database_service.dart';

class PlayerProvider extends ChangeNotifier {
  final AudioPlayerService _audioService = AudioPlayerService();
  final DatabaseService _dbService = DatabaseService();

  Song? _currentSong;
  List<Song> _queue = [];
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  bool _isPlaying = false;
  bool _isLoading = false;
  bool _isShuffle = false;
  RepeatMode _repeatMode = RepeatMode.off;

  final List<StreamSubscription> _subscriptions = [];

  Song? get currentSong => _currentSong;
  List<Song> get queue => _queue;
  Duration get position => _position;
  Duration get duration => _duration;
  bool get isPlaying => _isPlaying;
  bool get isLoading => _isLoading;
  bool get isShuffle => _isShuffle;
  RepeatMode get repeatMode => _repeatMode;
  bool get hasSong => _currentSong != null;

  double get progress {
    if (_duration.inMilliseconds == 0) return 0;
    return _position.inMilliseconds / _duration.inMilliseconds;
  }

  Future<void> init() async {
    await _audioService.init();

    _subscriptions.add(
      _audioService.currentSongStream.listen((song) {
        _currentSong = song;
        _isLoading = false;
        notifyListeners();
      }),
    );

    _subscriptions.add(
      _audioService.queueStream.listen((queue) {
        _queue = queue;
        notifyListeners();
      }),
    );

    _subscriptions.add(
      _audioService.positionStream.listen((pos) {
        _position = pos;
        notifyListeners();
      }),
    );

    _subscriptions.add(
      _audioService.durationStream.listen((dur) {
        _duration = dur ?? Duration.zero;
        notifyListeners();
      }),
    );

    _subscriptions.add(
      _audioService.playingStream.listen((playing) {
        _isPlaying = playing;
        notifyListeners();
      }),
    );

    _subscriptions.add(
      _audioService.shuffleStream.listen((shuffle) {
        _isShuffle = shuffle;
        notifyListeners();
      }),
    );

    _subscriptions.add(
      _audioService.repeatModeStream.listen((mode) {
        _repeatMode = mode;
        notifyListeners();
      }),
    );
  }

  Future<void> playSong(Song song, {List<Song>? queue, int? index}) async {
    _isLoading = true;
    notifyListeners();
    await _audioService.playSong(song, queue: queue, index: index);
    await _dbService.addToHistory(song);
  }

  Future<void> togglePlayPause() async {
    await _audioService.togglePlayPause();
  }

  Future<void> playNext() async {
    _isLoading = true;
    notifyListeners();
    await _audioService.playNext();
    if (_currentSong != null) {
      await _dbService.addToHistory(_currentSong!);
    }
  }

  Future<void> playPrevious() async {
    _isLoading = true;
    notifyListeners();
    await _audioService.playPrevious();
    if (_currentSong != null) {
      await _dbService.addToHistory(_currentSong!);
    }
  }

  Future<void> seek(Duration position) async {
    await _audioService.seek(position);
  }

  void toggleShuffle() => _audioService.toggleShuffle();
  void toggleRepeat() => _audioService.toggleRepeat();

  void addToQueue(Song song) => _audioService.addToQueue(song);
  void removeFromQueue(int index) => _audioService.removeFromQueue(index);
  void playFromQueue(int index) {
    _isLoading = true;
    notifyListeners();
    _audioService.playFromQueue(index);
    if (index < _queue.length) {
      _dbService.addToHistory(_queue[index]);
    }
  }

  @override
  void dispose() {
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    _audioService.dispose();
    super.dispose();
  }
}
