import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../providers/history_provider.dart';
import '../providers/player_provider.dart';
import '../providers/playlist_provider.dart';
import '../models/song.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';
import '../widgets/playlist_card.dart';
import 'playlist_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HistoryProvider>().loadHistory();
      context.read<HistoryProvider>().loadRecommendations();
      context.read<PlaylistProvider>().loadPlaylists();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text(
                  Formatters.greeting(),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),

            // Recently played grid
            Consumer<HistoryProvider>(
              builder: (context, historyProvider, _) {
                final history = historyProvider.history;
                if (history.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());

                return SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 16, 16, 12),
                        child: Text(
                          AppStrings.recentlyPlayed,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      // Grid of recent songs
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 3.5,
                            mainAxisSpacing: 8,
                            crossAxisSpacing: 8,
                          ),
                          itemCount: history.take(6).length,
                          itemBuilder: (context, index) {
                            final song = history[index];
                            return _RecentSongTile(
                              song: song,
                              onTap: () {
                                context.read<PlayerProvider>().playSong(song);
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

            // Recommendations
            Consumer<HistoryProvider>(
              builder: (context, historyProvider, _) {
                final recs = historyProvider.recommendations;
                final isLoading = historyProvider.isLoadingRecommendations;

                return SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                        child: Text(
                          AppStrings.recommendedForYou,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (isLoading)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: CircularProgressIndicator(color: AppColors.primary),
                          ),
                        )
                      else if (recs.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.explore, color: AppColors.textSecondary, size: 48),
                                const SizedBox(height: 8),
                                const Text(
                                  'Busca y reproduce canciones para obtener recomendaciones',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        SizedBox(
                          height: 200,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: recs.length,
                            itemBuilder: (context, index) {
                              final rec = recs[index];
                              return _RecommendationCard(
                                title: rec.title,
                                artist: rec.author,
                                thumbnailUrl: rec.thumbnailUrl,
                                onTap: () {
                                  final song = historyProvider.recommendationToSong(rec);
                                  context.read<PlayerProvider>().playSong(song);
                                },
                              );
                            },
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),

            // Playlists
            Consumer<PlaylistProvider>(
              builder: (context, playlistProvider, _) {
                final playlists = playlistProvider.playlists;
                if (playlists.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());

                return SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                        child: Text(
                          AppStrings.yourPlaylists,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      SizedBox(
                        height: 200,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: playlists.length,
                          itemBuilder: (context, index) {
                            return PlaylistCard(
                              playlist: playlists[index],
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => PlaylistDetailScreen(
                                      playlist: playlists[index],
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

            // Bottom padding for mini player
            const SliverToBoxAdapter(
              child: SizedBox(height: 140),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentSongTile extends StatelessWidget {
  final Song song;
  final VoidCallback onTap;

  const _RecentSongTile({required this.song, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(4),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(4)),
              child: SizedBox(
                width: 48,
                height: double.infinity,
                child: CachedNetworkImage(
                  imageUrl: song.thumbnailUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.surfaceLight),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                song.title,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
          ],
        ),
      ),
    );
  }
}

class _RecommendationCard extends StatelessWidget {
  final String title;
  final String artist;
  final String thumbnailUrl;
  final VoidCallback onTap;

  const _RecommendationCard({
    required this.title,
    required this.artist,
    required this.thumbnailUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppSizes.borderRadius),
              child: SizedBox(
                width: 150,
                height: 150,
                child: CachedNetworkImage(
                  imageUrl: thumbnailUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.surface),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              artist,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 11,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
