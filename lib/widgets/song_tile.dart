import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../models/song.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';
import '../providers/player_provider.dart';
import '../providers/favorites_provider.dart';
import '../providers/download_provider.dart';
import '../providers/playlist_provider.dart';

class SongTile extends StatelessWidget {
  final Song song;
  final VoidCallback? onTap;
  final bool showDuration;
  final bool showOptions;
  final Widget? trailing;

  const SongTile({
    super.key,
    required this.song,
    this.onTap,
    this.showDuration = true,
    this.showOptions = true,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final playerProvider = context.watch<PlayerProvider>();
    final isCurrentSong = playerProvider.currentSong?.id == song.id;

    return InkWell(
      onTap: onTap,
      onLongPress: showOptions ? () => _showOptionsSheet(context) : null,
      borderRadius: BorderRadius.circular(AppSizes.borderRadius),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                width: AppSizes.thumbnailSize,
                height: AppSizes.thumbnailSize,
                child: CachedNetworkImage(
                  imageUrl: song.thumbnailUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    color: AppColors.surface,
                    child: const Icon(Icons.music_note, color: AppColors.textSecondary),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: AppColors.surface,
                    child: const Icon(Icons.music_note, color: AppColors.textSecondary),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Song info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    song.title,
                    style: TextStyle(
                      color: isCurrentSong ? AppColors.primary : AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (song.isDownloaded)
                        Padding(
                          padding: const EdgeInsets.only(right: 4),
                          child: Icon(
                            Icons.download_done,
                            size: 14,
                            color: AppColors.primary,
                          ),
                        ),
                      Expanded(
                        child: Text(
                          song.artist,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (showDuration && song.duration > 0)
                        Text(
                          Formatters.durationFromSeconds(song.duration),
                          style: const TextStyle(
                            color: AppColors.textTertiary,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            if (trailing != null) trailing!,
            if (showOptions && trailing == null)
              IconButton(
                icon: const Icon(Icons.more_vert, color: AppColors.textSecondary, size: 20),
                onPressed: () => _showOptionsSheet(context),
              ),
          ],
        ),
      ),
    );
  }

  void _showOptionsSheet(BuildContext context) {
    final favProvider = context.read<FavoritesProvider>();
    final downloadProvider = context.read<DownloadProvider>();
    final playerProvider = context.read<PlayerProvider>();
    final playlistProvider = context.read<PlaylistProvider>();

    final isFav = favProvider.isFavorite(song.id);
    final isDownloaded = downloadProvider.isDownloaded(song.id);

    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Song header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: SizedBox(
                      width: 48,
                      height: 48,
                      child: CachedNetworkImage(
                        imageUrl: song.thumbnailUrl,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          song.title,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          song.artist,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Divider(color: AppColors.divider),
            _OptionTile(
              icon: isFav ? Icons.favorite : Icons.favorite_border,
              iconColor: isFav ? AppColors.primary : null,
              label: isFav ? AppStrings.removeFromFavorites : AppStrings.addToFavorites,
              onTap: () {
                favProvider.toggleFavorite(song);
                Navigator.pop(ctx);
              },
            ),
            _OptionTile(
              icon: Icons.queue_music,
              label: 'Agregar a la cola',
              onTap: () {
                playerProvider.addToQueue(song);
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Agregado a la cola')),
                );
              },
            ),
            _OptionTile(
              icon: Icons.playlist_add,
              label: AppStrings.addToPlaylist,
              onTap: () {
                Navigator.pop(ctx);
                _showAddToPlaylistDialog(context, playlistProvider);
              },
            ),
            if (!isDownloaded)
              _OptionTile(
                icon: Icons.download,
                label: AppStrings.download,
                onTap: () {
                  downloadProvider.downloadSong(song);
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Descargando...')),
                  );
                },
              )
            else
              _OptionTile(
                icon: Icons.delete_outline,
                label: 'Eliminar descarga',
                onTap: () {
                  downloadProvider.deleteSong(song.id);
                  Navigator.pop(ctx);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showAddToPlaylistDialog(BuildContext context, PlaylistProvider provider) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              AppStrings.addToPlaylist,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Icon(Icons.add, color: AppColors.textPrimary),
              ),
              title: const Text(
                AppStrings.createPlaylist,
                style: TextStyle(color: AppColors.textPrimary),
              ),
              onTap: () {
                Navigator.pop(ctx);
                _showCreatePlaylistDialog(context, provider);
              },
            ),
            ...provider.playlists.map((playlist) => ListTile(
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Icon(Icons.queue_music, color: AppColors.textSecondary),
              ),
              title: Text(
                playlist.name,
                style: const TextStyle(color: AppColors.textPrimary),
              ),
              subtitle: Text(
                Formatters.songCount(playlist.songCount),
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              onTap: () {
                provider.addSongToPlaylist(playlist.id!, song);
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Agregado a ${playlist.name}')),
                );
              },
            )),
          ],
        ),
      ),
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
            onPressed: () async {
              if (controller.text.trim().isNotEmpty) {
                final id = await provider.createPlaylist(controller.text.trim());
                await provider.addSongToPlaylist(id, song);
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Playlist "${controller.text.trim()}" creada')),
                );
              }
            },
            child: const Text('Crear', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String label;
  final VoidCallback onTap;

  const _OptionTile({
    required this.icon,
    this.iconColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppColors.textPrimary),
      title: Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14)),
      onTap: onTap,
    );
  }
}
