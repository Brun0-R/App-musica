import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { AppColors } from '../constants/colors';
import { AppStrings } from '../constants/strings';
import { AppSizes } from '../constants/sizes';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PlaylistDetailScreen from '../screens/PlaylistDetailScreen';
import SplashScreen from '../screens/SplashScreen';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayerStore } from '../stores/playerStore';

export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
  Player: undefined;
  PlaylistDetail: { playlistId: number; playlistName: string };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const currentSong = usePlayerStore((s) => s.currentSong);

  return (
    <View style={styles.tabBarContainer}>
      {currentSong && <MiniPlayer />}
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const iconName = (() => {
            if (route.name === 'Home') return isFocused ? 'home' : 'home-outline';
            if (route.name === 'Search') return isFocused ? 'search' : 'search-outline';
            return isFocused ? 'library' : 'library-outline';
          })();

          const label =
            route.name === 'Home'
              ? AppStrings.home
              : route.name === 'Search'
              ? AppStrings.search
              : AppStrings.library;

          return (
            <View key={route.key} style={styles.tabItem}>
              <Ionicons
                name={iconName as any}
                size={24}
                color={isFocused ? AppColors.primary : AppColors.textSecondary}
                onPress={() => {
                  if (!isFocused) navigation.navigate(route.name);
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            presentation: 'modal',
            cardStyle: { backgroundColor: 'transparent' },
            cardOverlayEnabled: true,
          }}
        />
        <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.divider,
  },
  tabBar: {
    flexDirection: 'row',
    height: AppSizes.bottomNavHeight,
    backgroundColor: AppColors.surface,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
