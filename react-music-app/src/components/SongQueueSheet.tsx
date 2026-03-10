import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';
import { usePlayerStore } from '../stores/playerStore';

const { height } = Dimensions.get('window');

interface SongQueueSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function SongQueueSheet({ visible, onClose }: SongQueueSheetProps) {
  const { queue, currentSong, playFromQueue, removeFromQueue } = usePlayerStore();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{AppStrings.queue}</Text>
            <Text style={styles.count}>{queue.length} {AppStrings.songs}</Text>
          </View>
          <FlashList
            data={queue}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            estimatedItemSize={64}
            renderItem={({ item, index }) => {
              const isCurrent = item.id === currentSong?.id;
              return (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => playFromQueue(index)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.thumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Text
                      style={[styles.itemTitle, isCurrent && styles.itemTitleActive]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.itemArtist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                  {isCurrent ? (
                    <Ionicons name="musical-notes" size={20} color={AppColors.primary} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => removeFromQueue(index)}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={20} color={AppColors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: height * 0.6,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.surfaceLight,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  count: { fontSize: 14, color: AppColors.textSecondary },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSizes.padding,
    paddingVertical: 10,
    gap: 12,
  },
  thumbnail: { width: 44, height: 44, borderRadius: 4 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '500', color: AppColors.textPrimary },
  itemTitleActive: { color: AppColors.primary },
  itemArtist: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
