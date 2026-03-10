import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { useSearchStore } from '../stores/searchStore';
import { usePlayerStore } from '../stores/playerStore';
import { searchResultToSong } from '../models/SearchResult';
import SongTile from '../components/SongTile';

export default function SearchScreen() {
  const [text, setText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { results, isSearching, search, clearSearch } = useSearchStore();
  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      clearSearch();
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(value.trim());
    }, 500);
  };

  const handleClear = () => {
    setText('');
    clearSearch();
    Keyboard.dismiss();
  };

  const songs = results.map(searchResultToSong);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={AppColors.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder={AppStrings.searchPlaceholder}
            placeholderTextColor={AppColors.textTertiary}
            value={text}
            onChangeText={handleTextChange}
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={() => {
              if (text.trim()) search(text.trim());
            }}
          />
          {text.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={AppColors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isSearching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : results.length === 0 && text.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="musical-notes-outline" size={64} color={AppColors.textTertiary} />
          <Text style={styles.emptyText}>{AppStrings.searchPrompt}</Text>
        </View>
      ) : results.length === 0 && text.length > 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={64} color={AppColors.textTertiary} />
          <Text style={styles.emptyText}>{AppStrings.noResults}</Text>
        </View>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item) => item.videoId}
          estimatedItemSize={72}
          renderItem={({ item, index }) => (
            <SongTile
              song={songs[index]}
              onTap={() => playSong(songs[index], songs, index)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  searchBarContainer: {
    paddingHorizontal: AppSizes.padding,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: AppColors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppSizes.borderRadiusLarge,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listContent: { paddingBottom: 140 },
});
