import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../providers/player_provider.dart';
import '../providers/favorites_provider.dart';
import '../providers/download_provider.dart';
import '../services/audio_player_service.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';
import '../widgets/song_queue_sheet.dart';

class PlayerScreen extends StatelessWidget {
  const PlayerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PlayerProvider>();
    final favProvider = context.watch<FavoritesProvider>();
    final downloadProvider = context.watch<DownloadProvider>();
    final song = provider.currentSong;

    if (song == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: const Center(
          child: Text('No hay canción reproduciéndose',
              style: TextStyle(color: AppColors.textSecondary)),
        ),
      );
    }

    final isFav = favProvider.isFavorite(song.id);
    final isDownloaded = downloadProvider.isDownloaded(song.id);
    final isDownloading = downloadProvider.isDownloading(song.id);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.center,
            colors: [
              AppColors.surfaceLight.withOpacity(0.8),
              AppColors.background,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.textPrimary, size: 30),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Expanded(
                      child: Text(
                        'REPRODUCIENDO',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.more_vert, color: AppColors.textPrimary),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 1),

              // Album art
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.5),
                          blurRadius: 30,
                          offset: const Offset(0, 15),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl: song.mediumResThumbnail,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          color: AppColors.surface,
                          child: const Icon(Icons.music_note, color: AppColors.textSecondary, size: 64),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.surface,
                          child: const Icon(Icons.music_note, color: AppColors.textSecondary, size: 64),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              const Spacer(flex: 1),

              // Song info + favorite
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            song.title,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            song.artist,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 15,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        isFav ? Icons.favorite : Icons.favorite_border,
                        color: isFav ? AppColors.primary : AppColors.textPrimary,
                        size: 24,
                      ),
                      onPressed: () => favProvider.toggleFavorite(song),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Progress bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 3,
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                      ),
                      child: Slider(
                        value: provider.progress.clamp(0.0, 1.0),
                        onChanged: (value) {
                          final newPosition = Duration(
                            milliseconds: (value * provider.duration.inMilliseconds).round(),
                          );
                          provider.seek(newPosition);
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            Formatters.duration(provider.position),
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                          Text(
                            Formatters.duration(provider.duration),
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Controls
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.shuffle,
                        color: provider.isShuffle ? AppColors.primary : AppColors.textPrimary,
                        size: 22,
                      ),
                      onPressed: provider.toggleShuffle,
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_previous, color: AppColors.textPrimary, size: 36),
                      onPressed: provider.playPrevious,
                    ),
                    // Play/Pause button
                    Container(
                      width: 64,
                      height: 64,
                      decoration: const BoxDecoration(
                        color: AppColors.textPrimary,
                        shape: BoxShape.circle,
                      ),
                      child: provider.isLoading
                          ? const Center(
                              child: SizedBox(
                                width: 28,
                                height: 28,
                                child: CircularProgressIndicator(
                                  strokeWidth: 3,
                                  color: AppColors.background,
                                ),
                              ),
                            )
                          : IconButton(
                              icon: Icon(
                                provider.isPlaying ? Icons.pause : Icons.play_arrow,
                                color: AppColors.background,
                                size: 36,
                              ),
                              onPressed: provider.togglePlayPause,
                            ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_next, color: AppColors.textPrimary, size: 36),
                      onPressed: provider.playNext,
                    ),
                    IconButton(
                      icon: Icon(
                        provider.repeatMode == RepeatMode.one
                            ? Icons.repeat_one
                            : Icons.repeat,
                        color: provider.repeatMode != RepeatMode.off
                            ? AppColors.primary
                            : AppColors.textPrimary,
                        size: 22,
                      ),
                      onPressed: provider.toggleRepeat,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Bottom actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Download button
                    IconButton(
                      icon: isDownloading
                          ? SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                value: downloadProvider.getProgress(song.id),
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            )
                          : Icon(
                              isDownloaded ? Icons.download_done : Icons.download,
                              color: isDownloaded ? AppColors.primary : AppColors.textSecondary,
                              size: 22,
                            ),
                      onPressed: isDownloaded || isDownloading
                          ? null
                          : () {
                              downloadProvider.downloadSong(song);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Descargando...')),
                              );
                            },
                    ),
                    // Queue button
                    IconButton(
                      icon: const Icon(Icons.queue_music, color: AppColors.textSecondary, size: 22),
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (_) => const SongQueueSheet(),
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
