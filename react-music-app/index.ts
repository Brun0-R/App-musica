import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/services/AudioPlayerService';

import App from './App';

// Register background playback service for react-native-track-player
TrackPlayer.registerPlaybackService(() => PlaybackService);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
