import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Playlist } from '../models/Playlist';
import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { songCountLabel } from '../utils/formatters';

const GRADIENT_PALETTES: [string, string][] = [
  ['#1DB954', '#166d35'],
  ['#E91E63', '#8e0038'],
  ['#9C27B0', '#5c0073'],
  ['#FF5722', '#b53b18'],
  ['#2196F3', '#0b5fa5'],
  ['#FF9800', '#b56800'],
  ['#00BCD4', '#006978'],
  ['#4CAF50', '#2e7d32'],
];

function gradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
}

interface PlaylistCardProps {
  playlist: Playlist;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'card' | 'list';
}

export default function PlaylistCard({
  playlist,
  onPress,
  onLongPress,
  variant = 'card',
}: PlaylistCardProps) {
  const [start, end] = gradientForName(playlist.name);

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={styles.listContainer}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <LinearGradient colors={[start, end]} style={styles.listIcon}>
          <Ionicons name="musical-notes" size={24} color={AppColors.textPrimary} />
        </LinearGradient>
        <View style={styles.listInfo}>
          <Text style={styles.listTitle} numberOfLines={1}>{playlist.name}</Text>
          <Text style={styles.listSubtitle}>
            {AppStrings.playlists} · {songCountLabel(playlist.songCount)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={AppColors.textTertiary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient colors={[start, end]} style={styles.cardGradient}>
        <Ionicons name="queue-music-sharp" size={48} color="rgba(255,255,255,0.8)" />
      </LinearGradient>
      <Text style={styles.cardName} numberOfLines={1}>{playlist.name}</Text>
      <Text style={styles.cardCount}>{songCountLabel(playlist.songCount)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Card variant
  cardContainer: { width: 150 },
  cardGradient: {
    width: 150,
    height: 150,
    borderRadius: AppSizes.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  cardCount: { fontSize: 12, color: AppColors.textSecondary },
  // List variant
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 10,
    gap: 12,
  },
  listIcon: {
    width: 56,
    height: 56,
    borderRadius: AppSizes.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: '600', color: AppColors.textPrimary, marginBottom: 2 },
  listSubtitle: { fontSize: 13, color: AppColors.textSecondary },
});
