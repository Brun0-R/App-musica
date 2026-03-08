import 'dart:async';
import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';
import 'package:rxdart/rxdart.dart';
import '../models/song.dart';
import 'youtube_service.dart';
import 'download_service.dart';

class AudioPlayerService {
  static final AudioPlayerService _instance = AudioPlayerService._internal();
  factory AudioPlayerService() => _instance;
  AudioPlayerService._internal();

  late AudioHandler _audioHandler;
  final AudioPlayer _player = AudioPlayer();
  final YouTubeService _ytService = YouTubeService();
  final DownloadService _downloadService = DownloadService();

  // State
  final _currentSongController = BehaviorSubject<Song?>.seeded(null);
  final _queueController = BehaviorSubject<List<Song>>.seeded([]);
  final _isShuffleController = BehaviorSubject<bool>.seeded(false);
  final _repeatModeController = BehaviorSubject<RepeatMode>.seeded(RepeatMode.off);
  int _currentIndex = -1;
  List<Song> _originalQueue = [];

  // Streams
  Stream<Song?> get currentSongStream => _currentSongController.stream;
  Stream<List<Song>> get queueStream => _queueController.stream;
  Stream<Duration> get positionStream => _player.positionStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<bool> get playingStream => _player.playingStream;
  Stream<PlayerState> get playerStateStream => _player.playerStateStream;
  Stream<bool> get shuffleStream => _isShuffleController.stream;
  Stream<RepeatMode> get repeatModeStream => _repeatModeController.stream;

  // Getters
  Song? get currentSong => _currentSongController.value;
  List<Song> get queue => _queueController.value;
  bool get isPlaying => _player.playing;
  Duration get position => _player.position;
  Duration get duration => _player.duration ?? Duration.zero;
  bool get isShuffle => _isShuffleController.value;
  RepeatMode get repeatMode => _repeatModeController.value;

  Future<void> init() async {
    _audioHandler = await AudioService.init(
      builder: () => MusicAudioHandler(_player),
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'com.musicapp.musica.channel.audio',
        androidNotificationChannelName: 'Musica',
        androidNotificationOngoing: true,
        androidShowNotificationBadge: true,
        androidStopForegroundOnPause: true,
      ),
    );

    // Listen for song completion
    _player.processingStateStream.listen((state) {
      if (state == ProcessingState.completed) {
        _onSongComplete();
      }
    });
  }

  Future<void> playSong(Song song, {List<Song>? queue, int? index}) async {
    try {
      if (queue != null) {
        _originalQueue = List.from(queue);
        _queueController.add(List.from(queue));
        _currentIndex = index ?? 0;
      } else if (!_queueController.value.contains(song)) {
        _originalQueue.add(song);
        _queueController.value.add(song);
        _queueController.add(_queueController.value);
        _currentIndex = _queueController.value.length - 1;
      } else {
        _currentIndex = _queueController.value.indexOf(song);
      }

      _currentSongController.add(song);
      await _loadAndPlay(song);
    } catch (e) {
      print('Error playing song: $e');
    }
  }

  Future<void> _loadAndPlay(Song song) async {
    // Check for local file first
    final localPath = await _downloadService.getLocalPath(song.id);
    String? audioSource;

    if (localPath != null) {
      audioSource = localPath;
      await _player.setFilePath(localPath);
    } else {
      final url = await _ytService.getAudioStreamUrl(song.id);
      if (url == null) return;
      audioSource = url;
      await _player.setUrl(url);
    }

    if (audioSource != null) {
      _audioHandler.mediaItem.add(MediaItem(
        id: song.id,
        title: song.title,
        artist: song.artist,
        artUri: Uri.parse(song.thumbnailUrl),
        duration: _player.duration,
      ));
      await _player.play();
    }
  }

  void _onSongComplete() {
    switch (_repeatModeController.value) {
      case RepeatMode.one:
        _player.seek(Duration.zero);
        _player.play();
        break;
      case RepeatMode.all:
        playNext();
        break;
      case RepeatMode.off:
        if (_currentIndex < _queueController.value.length - 1) {
          playNext();
        } else {
          _player.pause();
          _player.seek(Duration.zero);
        }
        break;
    }
  }

  Future<void> playNext() async {
    final queue = _queueController.value;
    if (queue.isEmpty) return;

    if (_currentIndex < queue.length - 1) {
      _currentIndex++;
    } else if (_repeatModeController.value == RepeatMode.all) {
      _currentIndex = 0;
    } else {
      return;
    }

    final song = queue[_currentIndex];
    _currentSongController.add(song);
    await _loadAndPlay(song);
  }

  Future<void> playPrevious() async {
    // If more than 3 seconds in, restart current song
    if (_player.position.inSeconds > 3) {
      await _player.seek(Duration.zero);
      return;
    }

    final queue = _queueController.value;
    if (queue.isEmpty) return;

    if (_currentIndex > 0) {
      _currentIndex--;
    } else if (_repeatModeController.value == RepeatMode.all) {
      _currentIndex = queue.length - 1;
    } else {
      await _player.seek(Duration.zero);
      return;
    }

    final song = queue[_currentIndex];
    _currentSongController.add(song);
    await _loadAndPlay(song);
  }

  Future<void> play() async => await _player.play();
  Future<void> pause() async => await _player.pause();

  Future<void> togglePlayPause() async {
    if (_player.playing) {
      await pause();
    } else {
      await play();
    }
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  void toggleShuffle() {
    final newValue = !_isShuffleController.value;
    _isShuffleController.add(newValue);

    if (newValue) {
      final currentSong = _currentSongController.value;
      final shuffled = List<Song>.from(_queueController.value)..shuffle();
      if (currentSong != null) {
        shuffled.remove(currentSong);
        shuffled.insert(0, currentSong);
        _currentIndex = 0;
      }
      _queueController.add(shuffled);
    } else {
      final currentSong = _currentSongController.value;
      _queueController.add(List.from(_originalQueue));
      if (currentSong != null) {
        _currentIndex = _queueController.value.indexOf(currentSong);
      }
    }
  }

  void toggleRepeat() {
    final current = _repeatModeController.value;
    switch (current) {
      case RepeatMode.off:
        _repeatModeController.add(RepeatMode.all);
        break;
      case RepeatMode.all:
        _repeatModeController.add(RepeatMode.one);
        break;
      case RepeatMode.one:
        _repeatModeController.add(RepeatMode.off);
        break;
    }
  }

  void addToQueue(Song song) {
    final queue = List<Song>.from(_queueController.value);
    if (!queue.contains(song)) {
      queue.add(song);
      _originalQueue.add(song);
      _queueController.add(queue);
    }
  }

  void removeFromQueue(int index) {
    final queue = List<Song>.from(_queueController.value);
    if (index < queue.length && index != _currentIndex) {
      final song = queue[index];
      queue.removeAt(index);
      _originalQueue.remove(song);
      if (index < _currentIndex) _currentIndex--;
      _queueController.add(queue);
    }
  }

  void playFromQueue(int index) {
    final queue = _queueController.value;
    if (index < queue.length) {
      _currentIndex = index;
      final song = queue[index];
      _currentSongController.add(song);
      _loadAndPlay(song);
    }
  }

  Future<void> stop() async {
    await _player.stop();
    _currentSongController.add(null);
    _queueController.add([]);
    _currentIndex = -1;
  }

  void dispose() {
    _player.dispose();
    _currentSongController.close();
    _queueController.close();
    _isShuffleController.close();
    _repeatModeController.close();
  }
}

enum RepeatMode { off, all, one }

class MusicAudioHandler extends BaseAudioHandler with SeekHandler {
  final AudioPlayer _player;

  MusicAudioHandler(this._player) {
    _player.playbackEventStream.listen((event) {
      final playing = _player.playing;
      playbackState.add(playbackState.value.copyWith(
        controls: [
          MediaControl.skipToPrevious,
          if (playing) MediaControl.pause else MediaControl.play,
          MediaControl.skipToNext,
        ],
        systemActions: const {
          MediaAction.seek,
          MediaAction.seekForward,
          MediaAction.seekBackward,
        },
        androidCompactActionIndices: const [0, 1, 2],
        processingState: const {
          ProcessingState.idle: AudioProcessingState.idle,
          ProcessingState.loading: AudioProcessingState.loading,
          ProcessingState.buffering: AudioProcessingState.buffering,
          ProcessingState.ready: AudioProcessingState.ready,
          ProcessingState.completed: AudioProcessingState.completed,
        }[_player.processingState]!,
        playing: playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
      ));
    });
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  @override
  Future<void> stop() => _player.stop();
}
