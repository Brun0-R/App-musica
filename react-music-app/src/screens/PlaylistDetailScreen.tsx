import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { songCountLabel } from '../utils/formatters';
import { usePlaylistStore } from '../stores/playlistStore';
import { usePlayerStore } from '../stores/playerStore';
import SongTile from '../components/SongTile';

type PlaylistDetailRoute = RouteProp<RootStackParamList, 'PlaylistDetail'>;

const GRADIENT_PALETTES = [
  ['#1DB954', '#121212'],
  ['#E91E63', '#121212'],
  ['#9C27B0', '#121212'],
  ['#FF5722', '#121212'],
  ['#2196F3', '#121212'],
  ['#FF9800', '#121212'],
  ['#00BCD4', '#121212'],
  ['#4CAF50', '#121212'],
];

function gradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length] as [string, string];
}

export default function PlaylistDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<PlaylistDetailRoute>();
  const { playlistId, playlistName } = route.params;
  const { loadPlaylistSongs, getPlaylistSongs, removeSongFromPlaylist } = usePlaylistStore();
  const playSong = usePlayerStore((s) => s.playSong);
  const songs = getPlaylistSongs(playlistId);
  const [start, end] = gradientForName(playlistName);

  useEffect(() => {
    loadPlaylistSongs(playlistId);
  }, [playlistId]);

  const handlePlayAll = () => {
    if (songs.length > 0) playSong(songs[0], songs, 0);
  };

  const handleRemove = (songId: string) => {
    Alert.alert('Remove song', 'Remove this song from the playlist?', [
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeSongFromPlaylist(playlistId, songId),
      },
      { text: AppStrings.cancel, style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[start, end]} style={styles.gradient}>
        <SafeAreaView>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="musical-notes" size={64} color={AppColors.textPrimary} />
            </View>
            <Text style={styles.playlistName}>{playlistName}</Text>
            <Text style={styles.songCount}>{songCountLabel(songs.length)}</Text>
          </View>
          {songs.length > 0 && (
            <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
              <Ionicons name="play" size={20} color={AppColors.background} />
              <Text style={styles.playAllText}>{AppStrings.playAll}</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>

      {songs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>This playlist is empty</Text>
        </View>
      ) : (
        <FlashList
          data={songs}
          keyExtractor={(item) => item.id}
          estimatedItemSize={72}
          renderItem={({ item, index }) => (
            <SongTile
              song={item}
              onTap={() => playSong(item, songs, index)}
              trailing={
                <TouchableOpacity onPress={() => handleRemove(item.id)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
              }
            />
          )}
          contentContainerStyle={{ paddingBottom: 140 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  gradient: { paddingBottom: 24 },
  backButton: { marginHorizontal: AppSizes.padding, marginTop: 8 },
  headerContent: { alignItems: 'center', paddingHorizontal: AppSizes.padding, marginTop: 16 },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: AppSizes.borderRadiusLarge,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  songCount: { fontSize: 14, color: AppColors.textSecondary },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 16,
    gap: 8,
  },
  playAllText: { fontSize: 16, fontWeight: '700', color: AppColors.background },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: AppColors.textSecondary },
});
