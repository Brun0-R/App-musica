import * as FileSystem from 'expo-file-system';
import DatabaseService from './DatabaseService';
import YouTubeService from './YouTubeService';
import { Song } from '../models/Song';

const MUSIC_DIR = `${FileSystem.documentDirectory}music/`;

class DownloadService {
  private static instance: DownloadService;
  private _progress: Map<string, number> = new Map();
  private _activeDownloads: Set<string> = new Set();

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  async ensureMusicDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(MUSIC_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true });
    }
  }

  getLocalPath(songId: string): string {
    return `${MUSIC_DIR}${songId}.m4a`;
  }

  async isDownloaded(songId: string): Promise<boolean> {
    const path = this.getLocalPath(songId);
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  }

  getProgress(songId: string): number {
    return this._progress.get(songId) ?? 0;
  }

  isDownloading(songId: string): boolean {
    return this._activeDownloads.has(songId);
  }

  async downloadSong(
    song: Song,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    if (this._activeDownloads.has(song.id)) return false;

    try {
      await this.ensureMusicDir();
      this._activeDownloads.add(song.id);
      this._progress.set(song.id, 0);

      const streamData = await YouTubeService.getStreamData(song.id);
      if (!streamData?.url) throw new Error('No stream URL');

      const destPath = this.getLocalPath(song.id);
      const downloadResumable = FileSystem.createDownloadResumable(
        streamData.url,
        destPath,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            (downloadProgress.totalBytesExpectedToWrite || 1);
          this._progress.set(song.id, progress);
          onProgress?.(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) throw new Error('Download failed');

      await DatabaseService.updateSongDownload(song.id, true, destPath);
      this._progress.set(song.id, 1);
      onProgress?.(1);
      return true;
    } catch (err) {
      console.error('DownloadService.downloadSong error:', err);
      this._progress.delete(song.id);
      return false;
    } finally {
      this._activeDownloads.delete(song.id);
    }
  }

  async deleteSong(songId: string): Promise<boolean> {
    try {
      const path = this.getLocalPath(songId);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path);
      }
      await DatabaseService.updateSongDownload(songId, false, undefined);
      return true;
    } catch (err) {
      console.error('DownloadService.deleteSong error:', err);
      return false;
    }
  }
}

export default DownloadService.getInstance();
