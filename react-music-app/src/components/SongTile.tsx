import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActionSheetIOS,
  Platform,
  Alert,
  Modal,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../models/Song';
import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { formatDuration } from '../utils/formatters';
import { usePlayerStore } from '../stores/playerStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { useDownloadStore } from '../stores/downloadStore';
import { usePlaylistStore } from '../stores/playlistStore';

interface SongTileProps {
  song: Song;
  onTap?: () => void;
  showDuration?: boolean;
  showOptions?: boolean;
  trailing?: React.ReactNode;
}

export default function SongTile({
  song,
  onTap,
  showDuration = true,
  showOptions = true,
  trailing,
}: SongTileProps) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { isDownloaded, isDownloading, downloadSong, deleteSong } = useDownloadStore();
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylistStore();

  const [playlistSheetVisible, setPlaylistSheetVisible] = React.useState(false);
  const [createPlaylistVisible, setCreatePlaylistVisible] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState('');

  const isCurrent = currentSong?.id === song.id;
  const favorite = isFavorite(song.id);
  const downloaded = isDownloaded(song.id);
  const downloading = isDownloading(song.id);

  const showOptions_ = () => {
    const options = [
      favorite ? AppStrings.removeFromFavorites : AppStrings.addToFavorites,
      AppStrings.addToQueue,
      AppStrings.addToPlaylist,
      downloaded ? AppStrings.deleteDownload : AppStrings.download,
      AppStrings.cancel,
    ];

    Alert.alert(song.title, song.artist, [
      {
        text: favorite ? AppStrings.removeFromFavorites : AppStrings.addToFavorites,
        onPress: () => toggleFavorite(song),
      },
      {
        text: AppStrings.addToQueue,
        onPress: () => addToQueue(song),
      },
      {
        text: AppStrings.addToPlaylist,
        onPress: () => setPlaylistSheetVisible(true),
      },
      {
        text: downloaded ? AppStrings.deleteDownload : AppStrings.download,
        onPress: () => {
          if (downloaded) deleteSong(song.id);
          else if (!downloading) downloadSong(song);
        },
      },
      { text: AppStrings.cancel, style: 'cancel' },
    ]);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const id = await createPlaylist(newPlaylistName.trim());
    await addSongToPlaylist(id, song);
    setNewPlaylistName('');
    setCreatePlaylistVisible(false);
    setPlaylistSheetVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={onTap}
        onLongPress={showOptions ? showOptions_ : undefined}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: song.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text
            style={[styles.title, isCurrent && styles.titleActive]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
            {showDuration ? `  ·  ${formatDuration(song.duration)}` : ''}
          </Text>
        </View>
        {downloaded && !trailing && (
          <Ionicons name="checkmark-circle" size={16} color={AppColors.primary} style={{ marginRight: 4 }} />
        )}
        {trailing ?? (
          showOptions && (
            <TouchableOpacity onPress={showOptions_} hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={20} color={AppColors.textSecondary} />
            </TouchableOpacity>
          )
        )}
      </TouchableOpacity>

      {/* Add to Playlist Modal */}
      <Modal visible={playlistSheetVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setPlaylistSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{AppStrings.addToPlaylist}</Text>
            <TouchableOpacity
              style={styles.createPlaylistRow}
              onPress={() => setCreatePlaylistVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color={AppColors.primary} />
              <Text style={styles.createPlaylistText}>{AppStrings.createPlaylist}</Text>
            </TouchableOpacity>
            <FlatList
              data={playlists}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistRow}
                  onPress={async () => {
                    await addSongToPlaylist(item.id, song);
                    setPlaylistSheetVisible(false);
                  }}
                >
                  <Ionicons name="musical-notes" size={20} color={AppColors.textSecondary} />
                  <Text style={styles.playlistName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Playlist inline Modal */}
      <Modal visible={createPlaylistVisible} transparent animationType="fade">
        <Pressable style={styles.overlayCenter} onPress={() => setCreatePlaylistVisible(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>{AppStrings.newPlaylist}</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder={AppStrings.playlistName}
              placeholderTextColor={AppColors.textTertiary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setCreatePlaylistVisible(false)}>
                <Text style={styles.cancelText}>{AppStrings.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreatePlaylist}>
                <Text style={styles.createText}>{AppStrings.create}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 8,
    gap: 12,
  },
  thumbnail: {
    width: AppSizes.thumbnailSize,
    height: AppSizes.thumbnailSize,
    borderRadius: AppSizes.borderRadius,
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', color: AppColors.textPrimary, marginBottom: 2 },
  titleActive: { color: AppColors.primary },
  artist: { fontSize: 13, color: AppColors.textSecondary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.surfaceLight,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginHorizontal: AppSizes.padding,
    marginBottom: 12,
  },
  createPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  createPlaylistText: { fontSize: 16, color: AppColors.primary },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 14,
    gap: 12,
  },
  playlistName: { fontSize: 16, color: AppColors.textPrimary },
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: AppColors.surface,
    borderRadius: AppSizes.borderRadiusLarge,
    padding: 24,
    width: '80%',
    gap: 16,
  },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  dialogInput: {
    backgroundColor: AppColors.surfaceLight,
    borderRadius: AppSizes.borderRadius,
    padding: 12,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24 },
  cancelText: { fontSize: 16, color: AppColors.textSecondary },
  createText: { fontSize: 16, color: AppColors.primary, fontWeight: '700' },
});
