import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { greeting, formatDuration } from '../utils/formatters';
import { useHistoryStore } from '../stores/historyStore';
import { usePlaylistStore } from '../stores/playlistStore';
import { usePlayerStore } from '../stores/playerStore';
import { searchResultToSong } from '../models/SearchResult';
import PlaylistCard from '../components/PlaylistCard';

type HomeNav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { history, recommendations, isLoadingRecommendations, loadHistory, loadRecommendations } =
    useHistoryStore();
  const { playlists, loadPlaylists } = usePlaylistStore();
  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    loadHistory();
    loadRecommendations();
    loadPlaylists();
  }, []);

  const recentSongs = history.slice(0, 6);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header greeting */}
      <Text style={styles.greeting}>{greeting()}</Text>

      {/* Recently Played */}
      {recentSongs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{AppStrings.recentlyPlayed}</Text>
          <View style={styles.recentGrid}>
            {recentSongs.map((song, i) => (
              <TouchableOpacity
                key={`${song.id}-${i}`}
                style={styles.recentItem}
                onPress={() => playSong(song, recentSongs, i)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: song.thumbnailUrl }}
                  style={styles.recentThumbnail}
                  contentFit="cover"
                />
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {song.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>{AppStrings.recommendedForYou}</Text>
      {isLoadingRecommendations ? (
        <View style={styles.loadingRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.recommendationPlaceholder} />
          ))}
        </View>
      ) : recommendations.length === 0 ? (
        <Text style={styles.emptyText}>{AppStrings.noRecommendations}</Text>
      ) : (
        <FlatList
          horizontal
          data={recommendations}
          keyExtractor={(item) => item.videoId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item, index }) => {
            const song = searchResultToSong(item);
            return (
              <TouchableOpacity
                style={styles.recommendationCard}
                onPress={() => playSong(song, recommendations.map(searchResultToSong), index)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.recommendationImage}
                  contentFit="cover"
                />
                <Text style={styles.recommendationTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.recommendationArtist} numberOfLines={1}>
                  {item.author}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Your Playlists */}
      {playlists.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{AppStrings.yourPlaylists}</Text>
          <FlatList
            horizontal
            data={playlists}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <PlaylistCard
                playlist={item}
                onPress={() =>
                  navigation.navigate('PlaylistDetail', {
                    playlistId: item.id,
                    playlistName: item.name,
                  })
                }
              />
            )}
          />
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { paddingTop: 60 },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginHorizontal: AppSizes.padding,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginHorizontal: AppSizes.padding,
    marginBottom: 12,
    marginTop: 8,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: AppSizes.padding,
    gap: 8,
    marginBottom: 8,
  },
  recentItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppSizes.borderRadius,
    overflow: 'hidden',
    gap: 8,
  },
  recentThumbnail: {
    width: 56,
    height: 56,
  },
  recentTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
    paddingRight: 8,
  },
  horizontalList: {
    paddingHorizontal: AppSizes.padding,
    gap: 12,
    paddingBottom: 4,
  },
  recommendationCard: {
    width: 150,
  },
  recommendationImage: {
    width: 150,
    height: 150,
    borderRadius: AppSizes.borderRadius,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  recommendationArtist: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: AppSizes.padding,
  },
  recommendationPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: AppSizes.borderRadius,
    backgroundColor: AppColors.surface,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    marginHorizontal: AppSizes.padding,
    marginBottom: 16,
  },
  bottomPadding: { height: 140 },
});
