# Musica - App de Música con YouTube

App de reproducción de música que usa YouTube como fuente de audio. Construida con Flutter, interfaz estilo Spotify con tema oscuro.

## Comandos

```bash
# Ejecutar la app en modo debug
flutter run

# Compilar APK de release
flutter build apk --release

# Analizar código
flutter analyze

# Ejecutar tests
flutter test

# Obtener dependencias
flutter pub get

# Limpiar build
flutter clean && flutter pub get
```

## Arquitectura

### Patrón: Provider + Singleton Services

La app usa **Provider** (`ChangeNotifier`) para gestión de estado en la UI y **Singletons** para los servicios de negocio. No usa Riverpod ni BLoC.

### Estructura de carpetas

```
lib/
├── main.dart                    # Entry point, inicializa providers y AudioService
├── models/                      # Modelos de datos puros (no dependen de Flutter)
│   ├── song.dart                # Canción (id=YouTube videoId, con serialización a Map)
│   ├── playlist.dart            # Playlist (id autoincremental SQLite)
│   └── search_result.dart       # Resultado de búsqueda YouTube (temporal, no persiste)
├── services/                    # Lógica de negocio (singletons, sin dependencia de UI)
│   ├── youtube_service.dart     # Búsqueda y extracción de streams via youtube_explode_dart
│   ├── audio_player_service.dart # Reproducción con just_audio + audio_service (background)
│   ├── database_service.dart    # SQLite via sqflite (songs, playlists, favorites, history)
│   ├── download_service.dart    # Descarga de audio a almacenamiento local
│   └── recommendation_service.dart # Recomendaciones basadas en historial
├── providers/                   # Estado reactivo (ChangeNotifier, conectan services con UI)
│   ├── player_provider.dart     # Estado del reproductor (song actual, posición, cola, repeat/shuffle)
│   ├── search_provider.dart     # Estado de búsqueda YouTube
│   ├── playlist_provider.dart   # CRUD de playlists
│   ├── favorites_provider.dart  # Gestión de favoritos
│   ├── history_provider.dart    # Historial + recomendaciones
│   └── download_provider.dart   # Estado de descargas (progreso, lista)
├── screens/                     # Pantallas completas
│   ├── splash_screen.dart       # Splash animado → navega a MainScreen
│   ├── main_screen.dart         # Scaffold con BottomNavigationBar + MiniPlayer
│   ├── home_screen.dart         # Inicio: historial reciente, recomendaciones, playlists
│   ├── search_screen.dart       # Búsqueda YouTube con debounce
│   ├── library_screen.dart      # Biblioteca: tabs Playlists/Favoritos/Descargas
│   ├── player_screen.dart       # Reproductor a pantalla completa
│   └── playlist_detail_screen.dart # Detalle de playlist con gradient header
├── widgets/                     # Widgets reutilizables
│   ├── song_tile.dart           # Tile de canción con long-press → opciones (fav, cola, playlist, download)
│   ├── mini_player.dart         # Mini reproductor persistente sobre el bottom nav
│   ├── playlist_card.dart       # Card de playlist (para grid/lista horizontal) + PlaylistListTile
│   └── song_queue_sheet.dart    # BottomSheet con la cola de reproducción
├── theme/
│   └── app_theme.dart           # ThemeData oscuro (usa Google Fonts Montserrat)
└── utils/
    ├── constants.dart           # AppColors, AppSizes, AppStrings (todo en español)
    └── formatters.dart          # Formateo de duración, timeAgo, saludo, conteo de canciones
```

### Flujo de datos

```
YouTube API (youtube_explode_dart)
    ↓
YouTubeService (búsqueda, stream URLs, videos relacionados)
    ↓
SearchProvider / RecommendationService
    ↓
Usuario selecciona canción → PlayerProvider.playSong()
    ↓
AudioPlayerService (just_audio + audio_service para background/notificaciones)
    ↓
DatabaseService.addToHistory() (persiste en SQLite)
```

### Base de datos (SQLite)

5 tablas: `songs`, `playlists`, `playlist_songs` (M:N con posición), `favorites`, `history`.
Definidas en `DatabaseService._onCreate()`. Song.id = YouTube video ID (TEXT PK).

## Dependencias clave

| Paquete | Uso |
|---------|-----|
| `youtube_explode_dart` | Búsqueda YouTube + extracción de audio streams (sin API key) |
| `just_audio` | Reproductor de audio |
| `audio_service` | Background playback + controles en notificación/lock screen |
| `rxdart` | BehaviorSubject en AudioPlayerService para streams reactivos |
| `sqflite` + `path` | Base de datos local SQLite |
| `provider` | Gestión de estado (ChangeNotifier) |
| `cached_network_image` | Cache de thumbnails |
| `google_fonts` | Fuente Montserrat |
| `path_provider` | Directorio de descargas |
| `permission_handler` | Permisos de almacenamiento |
| `shimmer` | Efectos de carga |

## Convenciones de código

- **Idioma de la UI**: Español (todos los strings en `AppStrings`)
- **Idioma del código**: Inglés (nombres de clases, variables, métodos)
- **Colores**: Definidos en `AppColors` (constants.dart), no usar colores hardcodeados en widgets
- **Tamaños**: Definidos en `AppSizes` (constants.dart)
- **Strings**: Definidos en `AppStrings` (constants.dart) para facilitar localización futura
- **Servicios**: Patrón Singleton con factory constructor (`_instance` + `_internal()`)
- **Providers**: Extienden `ChangeNotifier`, creados en `main.dart` con `MultiProvider`
- **Modelos**: Tienen `toMap()` / `fromMap()` / `copyWith()` para serialización SQLite
- **Navegación**: Imperativa con `Navigator.push/pop`, sin named routes
- **Estado del reproductor**: Fluye `AudioPlayerService` → streams → `PlayerProvider` → UI
- **`withValues(alpha:)`**: Usar en vez del deprecado `withOpacity()` para transparencias
- **Análisis**: `flutter_lints` con `avoid_print: false` y `prefer_const_constructors: false`

## Configuración Android

- `minSdkVersion`: implícito por dependencias (~21)
- Package: `com.musicapp.musica`
- Permisos: INTERNET, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, WAKE_LOCK, READ/WRITE_EXTERNAL_STORAGE, READ_MEDIA_AUDIO
- AudioService declarado como foreground service con `mediaPlayback` type
- MediaButtonReceiver para controles de headset

## Notas importantes

- Los stream URLs de YouTube son **temporales** (expiran en horas). Para reproducción offline se debe descargar el archivo completo
- `AudioPlayerService.init()` debe llamarse **antes** de `runApp()` (se hace en `main()` via `PlayerProvider.init()`)
- `RepeatMode` es un enum custom en `audio_player_service.dart` (off, all, one), no el de just_audio
- `AnimatedBuilder` en `splash_screen.dart` es un wrapper custom sobre `AnimatedWidget`, no el Flutter SDK `AnimatedBuilder`
- Las descargas se guardan como `.m4a` en `getApplicationDocumentsDirectory()/music/`
- `SongTile` long-press abre un sheet de opciones (favorito, cola, playlist, descarga)
