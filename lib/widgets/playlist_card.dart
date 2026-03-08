import 'package:flutter/material.dart';
import '../models/playlist.dart';
import '../utils/constants.dart';
import '../utils/formatters.dart';

class PlaylistCard extends StatelessWidget {
  final Playlist playlist;
  final VoidCallback? onTap;

  const PlaylistCard({
    super.key,
    required this.playlist,
    this.onTap,
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
            // Cover
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSizes.borderRadius),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: _getGradientColors(playlist.name),
                ),
              ),
              child: Center(
                child: Icon(
                  Icons.queue_music,
                  color: AppColors.textPrimary.withValues(alpha: 0.7),
                  size: 48,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              playlist.name,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              Formatters.songCount(playlist.songCount),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Color> _getGradientColors(String name) {
    final hash = name.hashCode;
    final gradients = [
      [const Color(0xFF1DB954), const Color(0xFF191414)],
      [const Color(0xFF6366F1), const Color(0xFF1E1B4B)],
      [const Color(0xFFEC4899), const Color(0xFF831843)],
      [const Color(0xFFF59E0B), const Color(0xFF78350F)],
      [const Color(0xFF3B82F6), const Color(0xFF1E3A5F)],
      [const Color(0xFFEF4444), const Color(0xFF7F1D1D)],
      [const Color(0xFF8B5CF6), const Color(0xFF3B0764)],
      [const Color(0xFF14B8A6), const Color(0xFF134E4A)],
    ];
    return gradients[hash.abs() % gradients.length];
  }
}

class PlaylistListTile extends StatelessWidget {
  final Playlist playlist;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const PlaylistListTile({
    super.key,
    required this.playlist,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      onLongPress: onLongPress,
      leading: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: _getGradientColors(playlist.name),
          ),
        ),
        child: const Icon(Icons.queue_music, color: Colors.white70, size: 28),
      ),
      title: Text(
        playlist.name,
        style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        'Playlist · ${Formatters.songCount(playlist.songCount)}',
        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  List<Color> _getGradientColors(String name) {
    final hash = name.hashCode;
    final gradients = [
      [const Color(0xFF1DB954), const Color(0xFF191414)],
      [const Color(0xFF6366F1), const Color(0xFF1E1B4B)],
      [const Color(0xFFEC4899), const Color(0xFF831843)],
      [const Color(0xFFF59E0B), const Color(0xFF78350F)],
      [const Color(0xFF3B82F6), const Color(0xFF1E3A5F)],
      [const Color(0xFFEF4444), const Color(0xFF7F1D1D)],
      [const Color(0xFF8B5CF6), const Color(0xFF3B0764)],
      [const Color(0xFF14B8A6), const Color(0xFF134E4A)],
    ];
    return gradients[hash.abs() % gradients.length];
  }
}
