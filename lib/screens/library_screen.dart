import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/playlist_provider.dart';
import '../providers/favorites_provider.dart';
import '../providers/download_provider.dart';
import '../providers/player_provider.dart';
import '../utils/constants.dart';
import '../widgets/song_tile.dart';
import '../widgets/playlist_card.dart';
import 'playlist_detail_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PlaylistProvider>().loadPlaylists();
      context.read<FavoritesProvider>().loadFavorites();
      context.read<DownloadProvider>().loadDownloads();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                AppStrings.library,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),

            // Tabs
            TabBar(
              controller: _tabController,
              indicatorColor: AppColors.primary,
              labelColor: AppColors.textPrimary,
              unselectedLabelColor: AppColors.textSecondary,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w400, fontSize: 14),
              tabs: const [
                Tab(text: AppStrings.playlists),
                Tab(text: AppStrings.favorites),
                Tab(text: AppStrings.downloads),
              ],
            ),

            // Tab content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _PlaylistsTab(),
                  _FavoritesTab(),
                  _DownloadsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlaylistsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<PlaylistProvider>(
      builder: (context, provider, _) {
        return CustomScrollView(
          slivers: [
            // Create playlist button
            SliverToBoxAdapter(
              child: ListTile(
                onTap: () => _showCreatePlaylistDialog(context, provider),
                leading: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(Icons.add, color: AppColors.textPrimary, size: 28),
                ),
                title: const Text(
                  AppStrings.createPlaylist,
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              ),
            ),
            if (provider.playlists.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Text(
                    'Crea tu primera playlist',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final playlist = provider.playlists[index];
                    return PlaylistListTile(
                      playlist: playlist,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PlaylistDetailScreen(playlist: playlist),
                          ),
                        );
                      },
                      onLongPress: () => _showPlaylistOptions(context, provider, playlist),
                    );
                  },
                  childCount: provider.playlists.length,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 140)),
          ],
        );
      },
    );
  }

  void _showCreatePlaylistDialog(BuildContext context, PlaylistProvider provider) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(AppStrings.createPlaylist),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: const InputDecoration(
            hintText: AppStrings.playlistName,
            hintStyle: TextStyle(color: AppColors.textSecondary),
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: AppColors.textSecondary),
            ),
            focusedBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: AppColors.primary),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar', style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                provider.createPlaylist(controller.text.trim());
                Navigator.pop(ctx);
              }
            },
            child: const Text('Crear', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  void _showPlaylistOptions(BuildContext context, PlaylistProvider provider, playlist) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit, color: AppColors.textPrimary),
              title: const Text('Renombrar', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.pop(ctx);
                _showRenameDialog(context, provider, playlist);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: AppColors.error),
              title: const Text(AppStrings.deletePlaylist, style: TextStyle(color: AppColors.error)),
              onTap: () {
                provider.deletePlaylist(playlist.id!);
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showRenameDialog(BuildContext context, PlaylistProvider provider, playlist) {
    final controller = TextEditingController(text: playlist.name);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Renombrar playlist'),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: const InputDecoration(
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: AppColors.textSecondary),
            ),
            focusedBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: AppColors.primary),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar', style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                provider.renamePlaylist(playlist.id!, controller.text.trim());
                Navigator.pop(ctx);
              }
            },
            child: const Text('Guardar', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }
}

class _FavoritesTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<FavoritesProvider>(
      builder: (context, provider, _) {
        if (provider.favorites.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.favorite_border, color: AppColors.textSecondary.withValues(alpha: 0.5), size: 48),
                const SizedBox(height: 16),
                const Text(
                  AppStrings.noFavorites,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Las canciones que marques como favoritas aparecerán aquí',
                  style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.only(bottom: 140),
          itemCount: provider.favorites.length,
          itemBuilder: (context, index) {
            final song = provider.favorites[index];
            return SongTile(
              song: song,
              onTap: () {
                context.read<PlayerProvider>().playSong(
                  song,
                  queue: provider.favorites,
                  index: index,
                );
              },
            );
          },
        );
      },
    );
  }
}

class _DownloadsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<DownloadProvider>(
      builder: (context, provider, _) {
        if (provider.downloads.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.download_outlined, color: AppColors.textSecondary.withValues(alpha: 0.5), size: 48),
                const SizedBox(height: 16),
                const Text(
                  AppStrings.noDownloads,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Descarga canciones para escucharlas sin internet',
                  style: TextStyle(color: AppColors.textTertiary, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.only(bottom: 140),
          itemCount: provider.downloads.length,
          itemBuilder: (context, index) {
            final song = provider.downloads[index];
            return SongTile(
              song: song,
              onTap: () {
                context.read<PlayerProvider>().playSong(
                  song,
                  queue: provider.downloads,
                  index: index,
                );
              },
            );
          },
        );
      },
    );
  }
}
