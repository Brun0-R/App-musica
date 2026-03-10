import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useProgress, usePlaybackState } from 'react-native-track-player';
import { State } from 'react-native-track-player';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppColors } from '../constants/colors';
import { AppSizes } from '../constants/sizes';
import { usePlayerStore } from '../stores/playerStore';

type MiniNav = StackNavigationProp<RootStackParamList>;

export default function MiniPlayer() {
  const navigation = useNavigation<MiniNav>();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const playNext = usePlayerStore((s) => s.playNext);
  const progress = useProgress();
  const playbackState = usePlaybackState();

  if (!currentSong) return null;

  const isPlaying = playbackState.state === State.Playing;
  const isLoading =
    playbackState.state === State.Loading || playbackState.state === State.Buffering;
  const progressFraction =
    progress.duration > 0 ? progress.position / progress.duration : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.9}
    >
      {/* Progress bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressFraction * 100}%` }]} />
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: currentSong.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          hitSlop={8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={AppColors.textPrimary} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color={AppColors.textPrimary}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            playNext();
          }}
          hitSlop={8}
        >
          <Ionicons name="play-skip-forward" size={26} color={AppColors.textPrimary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: AppSizes.miniPlayerHeight,
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.divider,
  },
  progressBarTrack: {
    height: 2,
    backgroundColor: AppColors.surfaceLight,
  },
  progressBarFill: {
    height: 2,
    backgroundColor: AppColors.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    gap: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
  artist: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
