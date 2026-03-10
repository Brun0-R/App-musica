import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useProgress, usePlaybackState, useActiveTrack } from 'react-native-track-player';
import TrackPlayer, { State } from 'react-native-track-player';

import { setupTrackPlayer } from './src/services/AudioPlayerService';
import DatabaseService from './src/services/DatabaseService';
import { usePlayerStore } from './src/stores/playerStore';
import { AppColors } from './src/constants/colors';
import AppNavigator from './src/navigation/AppNavigator';

function TrackPlayerSync() {
  const progress = useProgress();
  const playbackState = usePlaybackState();
  const activeTrack = useActiveTrack();
  const { setPosition, setDuration, setIsPlaying, setCurrentSong, queue } = usePlayerStore();

  useEffect(() => {
    setPosition(progress.position);
    setDuration(progress.duration);
  }, [progress.position, progress.duration]);

  useEffect(() => {
    setIsPlaying(playbackState.state === State.Playing);
  }, [playbackState.state]);

  useEffect(() => {
    if (activeTrack?.id) {
      const song = queue.find((s) => s.id === activeTrack.id);
      if (song) setCurrentSong(song);
    }
  }, [activeTrack?.id]);

  return null;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await DatabaseService.init();
        await setupTrackPlayer();
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setReady(true);
      }
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={AppColors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <TrackPlayerSync />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
  loading: { flex: 1, backgroundColor: AppColors.background },
});
