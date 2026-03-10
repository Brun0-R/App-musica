import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import Slider from '@miblanchard/react-native-slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProgress, usePlaybackState } from 'react-native-track-player';
import { State } from 'react-native-track-player';
import { RepeatMode } from 'react-native-track-player';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { formatDuration } from '../utils/formatters';
import { usePlayerStore } from '../stores/playerStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { useDownloadStore } from '../stores/downloadStore';
import SongQueueSheet from '../components/SongQueueSheet';

const { width } = Dimensions.get('window');

export default function PlayerScreen() {
  const navigation = useNavigation();
  const { currentSong, queue, repeatMode, isShuffle, togglePlayPause, playNext, playPrevious, seek, toggleRepeat, toggleShuffle } =
    usePlayerStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { isDownloaded, isDownloading, getProgress, downloadSong } = useDownloadStore();
  const progress = useProgress();
  const playbackState = usePlaybackState();
  const [queueVisible, setQueueVisible] = React.useState(false);

  const isPlaying = playbackState.state === State.Playing;
  const favorite = currentSong ? isFavorite(currentSong.id) : false;
  const downloaded = currentSong ? isDownloaded(currentSong.id) : false;
  const downloading = currentSong ? isDownloading(currentSong.id) : false;
  const dlProgress = currentSong ? getProgress(currentSong.id) : 0;

  const repeatIcon = () => {
    if (repeatMode === RepeatMode.Track) return 'repeat-outline'; // repeat one
    return 'repeat-outline';
  };
  const repeatColor = repeatMode === RepeatMode.Off ? AppColors.textSecondary : AppColors.primary;

  if (!currentSong) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{AppStrings.nowPlaying}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Album Art */}
      <View style={styles.artContainer}>
        <Image
          source={{ uri: currentSong.thumbnailUrl }}
          style={styles.art}
          contentFit="cover"
        />
      </View>

      {/* Song Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoText}>
          <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(currentSong)}>
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={28}
            color={favorite ? AppColors.primary : AppColors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          value={progress.position}
          minimumValue={0}
          maximumValue={progress.duration || 1}
          onSlidingComplete={(value) => seek(Array.isArray(value) ? value[0] : value)}
          minimumTrackTintColor={AppColors.primary}
          maximumTrackTintColor={AppColors.surfaceLight}
          thumbTintColor={AppColors.primary}
          trackStyle={styles.track}
          thumbStyle={styles.thumb}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatDuration(progress.position)}</Text>
          <Text style={styles.timeText}>{formatDuration(progress.duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleShuffle}>
          <Ionicons
            name="shuffle-outline"
            size={26}
            color={isShuffle ? AppColors.primary : AppColors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={playPrevious}>
          <Ionicons name="play-skip-back" size={36} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          {playbackState.state === State.Loading || playbackState.state === State.Buffering ? (
            <ActivityIndicator color={AppColors.background} size="large" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color={AppColors.background}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext}>
          <Ionicons name="play-skip-forward" size={36} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleRepeat}>
          <Ionicons
            name={repeatMode === RepeatMode.Track ? 'repeat' : 'repeat-outline'}
            size={26}
            color={repeatColor}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          onPress={() => {
            if (!downloaded && !downloading) downloadSong(currentSong);
          }}
          disabled={downloaded}
          style={styles.actionButton}
        >
          {downloading ? (
            <View style={styles.downloadProgress}>
              <ActivityIndicator size="small" color={AppColors.primary} />
              <Text style={styles.actionText}>{Math.round(dlProgress * 100)}%</Text>
            </View>
          ) : (
            <>
              <Ionicons
                name={downloaded ? 'checkmark-circle' : 'download-outline'}
                size={22}
                color={downloaded ? AppColors.primary : AppColors.textSecondary}
              />
              <Text style={[styles.actionText, downloaded && { color: AppColors.primary }]}>
                {downloaded ? AppStrings.downloaded : AppStrings.download}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setQueueVisible(true)}>
          <Ionicons name="list" size={22} color={AppColors.textSecondary} />
          <Text style={styles.actionText}>{AppStrings.queue}</Text>
        </TouchableOpacity>
      </View>

      <SongQueueSheet visible={queueVisible} onClose={() => setQueueVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textSecondary,
    letterSpacing: 2,
  },
  artContainer: {
    alignItems: 'center',
    paddingHorizontal: AppSizes.paddingLarge,
    marginTop: 16,
    marginBottom: 32,
  },
  art: {
    width: width - AppSizes.paddingLarge * 2,
    height: width - AppSizes.paddingLarge * 2,
    borderRadius: AppSizes.borderRadiusLarge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    marginBottom: 16,
    gap: 12,
  },
  infoText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 4 },
  artist: { fontSize: 16, color: AppColors.textSecondary },
  sliderContainer: { paddingHorizontal: AppSizes.padding },
  track: { height: 3 },
  thumb: { width: 14, height: 14 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 12, color: AppColors.textSecondary },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSizes.paddingLarge,
    marginTop: 24,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: AppSizes.padding,
    marginTop: 32,
  },
  actionButton: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: AppColors.textSecondary },
  downloadProgress: { alignItems: 'center', gap: 4 },
});
