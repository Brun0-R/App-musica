import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/playlist.dart';
import '../providers/playlist_provider.dart';
import '../providers/player_provider.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';
import '../widgets/song_tile.dart';

class PlaylistDetailScreen extends StatefulWidget {
  final Playlist playlist;

  const PlaylistDetailScreen({super.key, required this.playlist});

  @override
  State<PlaylistDetailScreen> createState() => _PlaylistDetailScreenState();
}

class _PlaylistDetailScreenState extends State<PlaylistDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PlaylistProvider>().loadPlaylistSongs(widget.playlist.id!);
    });
  }

  List<Color> _getGradientColors() {
    final hash = widget.playlist.name.hashCode;
    final gradients = [
      [const Color(0xFF1DB954), const Color(0xFF121212)],
      [const Color(0xFF6366F1), const Color(0xFF121212)],
      [const Color(0xFFEC4899), const Color(0xFF121212)],
      [const Color(0xFFF59E0B), const Color(0xFF121212)],
      [const Color(0xFF3B82F6), const Color(0xFF121212)],
      [const Color(0xFFEF4444), const Color(0xFF121212)],
    ];
    return gradients[hash.abs() % gradients.length];
  }

  @override
  Widget build(BuildContext context) {
    final colors = _getGradientColors();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Consumer<PlaylistProvider>(
        builder: (context, provider, _) {
          final songs = provider.getPlaylistSongs(widget.playlist.id!);

          return CustomScrollView(
            slivers: [
              // App bar with gradient
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                backgroundColor: colors[0].withOpacity(0.8),
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: colors,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 60),
                        Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            color: colors[0].withOpacity(0.6),
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.3),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.queue_music, color: Colors.white70, size: 64),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          widget.playlist.name,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.songCount(songs.length),
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Play all button
              if (songs.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            context.read<PlayerProvider>().playSong(
                              songs.first,
                              queue: songs,
                              index: 0,
                            );
                          },
                          child: Container(
                            width: 56,
                            height: 56,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.play_arrow, color: Colors.white, size: 32),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Songs list
              if (songs.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.music_off, color: AppColors.textSecondary.withOpacity(0.5), size: 48),
                        const SizedBox(height: 16),
                        const Text(
                          AppStrings.noSongsInPlaylist,
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Busca canciones y agrégalas a esta playlist',
                          style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final song = songs[index];
                      return Dismissible(
                        key: Key(song.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: AppColors.error,
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (_) {
                          provider.removeSongFromPlaylist(widget.playlist.id!, song.id);
                        },
                        child: SongTile(
                          song: song,
                          onTap: () {
                            context.read<PlayerProvider>().playSong(
                              song,
                              queue: songs,
                              index: index,
                            );
                          },
                        ),
                      );
                    },
                    childCount: songs.length,
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 140)),
            ],
          );
        },
      ),
    );
  }
}
