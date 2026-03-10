import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { useFavoritesStore } from '../stores/favoritesStore';
import { useDownloadStore } from '../stores/downloadStore';
import { usePlaylistStore } from '../stores/playlistStore';
import { usePlayerStore } from '../stores/playerStore';
import SongTile from '../components/SongTile';
import PlaylistCard from '../components/PlaylistCard';
import { songCountLabel } from '../utils/formatters';

type LibNav = StackNavigationProp<RootStackParamList>;

const TABS = [AppStrings.playlists, AppStrings.favorites, AppStrings.downloads];

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    useFavoritesStore.getState().loadFavorites();
    useDownloadStore.getState().loadDownloads();
    usePlaylistStore.getState().loadPlaylists();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{AppStrings.library}</Text>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 0 && <PlaylistsTab />}
      {activeTab === 1 && <FavoritesTab />}
      {activeTab === 2 && <DownloadsTab />}
    </View>
  );
}

function PlaylistsTab() {
  const navigation = useNavigation<LibNav>();
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist } = usePlaylistStore();
  const [createVisible, setCreateVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleCreate = async () => {
    if (!nameInput.trim()) return;
    await createPlaylist(nameInput.trim());
    setNameInput('');
    setCreateVisible(false);
  };

  const handleLongPress = (playlist: { id: number; name: string }) => {
    Alert.alert(playlist.name, undefined, [
      {
        text: AppStrings.rename,
        onPress: () => {
          Alert.prompt(
            AppStrings.rename,
            undefined,
            (newName) => { if (newName?.trim()) renamePlaylist(playlist.id, newName.trim()); },
            'plain-text',
            playlist.name
          );
        },
      },
      {
        text: AppStrings.delete,
        style: 'destructive',
        onPress: () => deletePlaylist(playlist.id),
      },
      { text: AppStrings.cancel, style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.createButton} onPress={() => setCreateVisible(true)}>
        <Ionicons name="add" size={20} color={AppColors.primary} />
        <Text style={styles.createButtonText}>{AppStrings.createPlaylist}</Text>
      </TouchableOpacity>

      {playlists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={64} color={AppColors.textTertiary} />
          <Text style={styles.emptyText}>{AppStrings.noPlaylists}</Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              variant="list"
              onPress={() =>
                navigation.navigate('PlaylistDetail', {
                  playlistId: item.id,
                  playlistName: item.name,
                })
              }
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 140 }}
        />
      )}

      <Modal visible={createVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setCreateVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{AppStrings.newPlaylist}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={AppStrings.playlistName}
              placeholderTextColor={AppColors.textTertiary}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCreateVisible(false)}>
                <Text style={styles.cancelText}>{AppStrings.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate}>
                <Text style={styles.createText}>{AppStrings.create}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FavoritesTab() {
  const { favorites } = useFavoritesStore();
  const playSong = usePlayerStore((s) => s.playSong);

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="heart-outline" size={64} color={AppColors.textTertiary} />
        <Text style={styles.emptyText}>{AppStrings.noFavorites}</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={favorites}
      keyExtractor={(item) => item.id}
      estimatedItemSize={72}
      renderItem={({ item, index }) => (
        <SongTile song={item} onTap={() => playSong(item, favorites, index)} />
      )}
      contentContainerStyle={{ paddingBottom: 140 }}
    />
  );
}

function DownloadsTab() {
  const { downloads } = useDownloadStore();
  const playSong = usePlayerStore((s) => s.playSong);

  if (downloads.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="download-outline" size={64} color={AppColors.textTertiary} />
        <Text style={styles.emptyText}>{AppStrings.noDownloads}</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={downloads}
      keyExtractor={(item) => item.id}
      estimatedItemSize={72}
      renderItem={({ item, index }) => (
        <SongTile song={item} onTap={() => playSong(item, downloads, index)} />
      )}
      contentContainerStyle={{ paddingBottom: 140 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, paddingTop: 56 },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginHorizontal: AppSizes.padding,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: AppSizes.padding,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
  },
  tabActive: { backgroundColor: AppColors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: AppColors.textSecondary },
  tabTextActive: { color: AppColors.textPrimary },
  tabContent: { flex: 1 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  createButtonText: { fontSize: 16, color: AppColors.primary, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: AppColors.textSecondary, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppSizes.borderRadiusLarge,
    padding: 24,
    width: '80%',
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  modalInput: {
    backgroundColor: AppColors.surfaceLight,
    borderRadius: AppSizes.borderRadius,
    padding: 12,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24 },
  cancelText: { fontSize: 16, color: AppColors.textSecondary },
  createText: { fontSize: 16, color: AppColors.primary, fontWeight: '700' },
});
