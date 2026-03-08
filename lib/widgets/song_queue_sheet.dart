import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../providers/player_provider.dart';
import '../utils/constants.dart';

class SongQueueSheet extends StatelessWidget {
  const SongQueueSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PlayerProvider>();
    final queue = provider.queue;
    final currentSong = provider.currentSong;

    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.textTertiary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Text(
                  AppStrings.queue,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Text(
                  '${queue.length} canciones',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Divider(color: AppColors.divider),
          Expanded(
            child: queue.isEmpty
                ? const Center(
                    child: Text(
                      'La cola está vacía',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  )
                : ListView.builder(
                    itemCount: queue.length,
                    itemBuilder: (context, index) {
                      final song = queue[index];
                      final isCurrent = song.id == currentSong?.id;

                      return ListTile(
                        onTap: () => provider.playFromQueue(index),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: SizedBox(
                            width: 42,
                            height: 42,
                            child: CachedNetworkImage(
                              imageUrl: song.thumbnailUrl,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        title: Text(
                          song.title,
                          style: TextStyle(
                            color: isCurrent ? AppColors.primary : AppColors.textPrimary,
                            fontSize: 13,
                            fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          song.artist,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                        trailing: isCurrent
                            ? const Icon(Icons.equalizer, color: AppColors.primary, size: 20)
                            : IconButton(
                                icon: const Icon(Icons.close, color: AppColors.textSecondary, size: 18),
                                onPressed: () => provider.removeFromQueue(index),
                              ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
