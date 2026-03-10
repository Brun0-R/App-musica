/**
 * YouTubeService
 *
 * Uses YouTube's internal InnerTube API directly via fetch — no backend server required.
 *
 * Search uses the WEB client context which returns rich video metadata.
 * Stream extraction uses the ANDROID_MUSIC client, which returns audio URLs
 * without needing signature decryption (those URLs are pre-signed by YouTube).
 */

import { SearchResult } from '../models/SearchResult';

const INNERTUBE_KEY = 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w';
const BASE_URL = 'https://www.youtube.com/youtubei/v1';

const WEB_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240101.00.00',
    hl: 'en',
    gl: 'US',
  },
};

const ANDROID_MUSIC_CONTEXT = {
  client: {
    clientName: 'ANDROID_MUSIC',
    clientVersion: '7.11.50',
    androidSdkVersion: 30,
    hl: 'en',
    gl: 'US',
  },
};

function parseDuration(text: string | undefined): number {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

function bestThumbnail(
  thumbnails: Array<{ url: string; width?: number; height?: number }>
): string {
  if (!thumbnails || thumbnails.length === 0) return '';
  return [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url;
}

class YouTubeService {
  private static instance: YouTubeService;

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  async search(query: string, maxResults = 20): Promise<SearchResult[]> {
    try {
      const resp = await fetch(`${BASE_URL}/search?key=${INNERTUBE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: WEB_CONTEXT,
          query,
          params: 'EgIQAQ%3D%3D', // filter: videos only
        }),
      });

      if (!resp.ok) return [];
      const data = await resp.json();

      const contents =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents ?? [];

      const results: SearchResult[] = [];

      for (const section of contents) {
        const items = section?.itemSectionRenderer?.contents ?? [];
        for (const item of items) {
          const vr = item?.videoRenderer;
          if (!vr) continue;

          const videoId = vr.videoId as string | undefined;
          const title = vr.title?.runs?.[0]?.text as string | undefined;
          const author = vr.ownerText?.runs?.[0]?.text as string | undefined;
          const thumbs = vr.thumbnail?.thumbnails ?? [];
          const durationText = vr.lengthText?.simpleText as string | undefined;

          if (!videoId || !title) continue;

          results.push({
            videoId,
            title,
            author: author ?? 'Unknown Artist',
            thumbnailUrl: bestThumbnail(thumbs),
            durationSeconds: parseDuration(durationText),
          });

          if (results.length >= maxResults) break;
        }
        if (results.length >= maxResults) break;
      }

      return results;
    } catch (e) {
      console.error('YouTubeService.search error:', e);
      return [];
    }
  }

  async getAudioStreamUrl(videoId: string): Promise<string | null> {
    const info = await this.getAudioStreamInfo(videoId);
    return info?.url ?? null;
  }

  async getAudioStreamInfo(
    videoId: string
  ): Promise<{ url: string; contentLength?: number } | null> {
    try {
      const resp = await fetch(`${BASE_URL}/player?key=${INNERTUBE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: ANDROID_MUSIC_CONTEXT,
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });

      if (!resp.ok) return null;
      const data = await resp.json();

      const formats: Array<{
        mimeType?: string;
        audioBitrate?: number;
        url?: string;
        contentLength?: string;
      }> = data?.streamingData?.adaptiveFormats ?? [];

      const audioFormats = formats
        .filter((f) => f.mimeType?.startsWith('audio/') && f.url)
        .sort((a, b) => (b.audioBitrate ?? 0) - (a.audioBitrate ?? 0));

      const best = audioFormats[0];
      if (!best?.url) return null;

      return {
        url: best.url,
        contentLength: best.contentLength
          ? parseInt(best.contentLength, 10)
          : undefined,
      };
    } catch (e) {
      console.error('YouTubeService.getAudioStreamInfo error:', e);
      return null;
    }
  }

  /** @deprecated Use getAudioStreamInfo instead */
  async getStreamData(
    videoId: string
  ): Promise<{ url: string; contentLength?: number } | null> {
    return this.getAudioStreamInfo(videoId);
  }

  async getRelatedVideos(
    videoId: string,
    maxResults = 10
  ): Promise<SearchResult[]> {
    try {
      const resp = await fetch(`${BASE_URL}/next?key=${INNERTUBE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: WEB_CONTEXT,
          videoId,
        }),
      });

      if (!resp.ok) return [];
      const data = await resp.json();

      const results: SearchResult[] = [];
      const secondaryContents =
        data?.contents?.twoColumnWatchNextResults?.secondaryResults
          ?.secondaryResults?.results ?? [];

      for (const item of secondaryContents) {
        const cr = item?.compactVideoRenderer;
        if (!cr) continue;

        const vid = cr.videoId as string | undefined;
        const title =
          cr.title?.simpleText ?? cr.title?.runs?.[0]?.text;
        const author = cr.shortBylineText?.runs?.[0]?.text as
          | string
          | undefined;
        const thumbs = cr.thumbnail?.thumbnails ?? [];
        const durationText = cr.lengthText?.simpleText as
          | string
          | undefined;

        if (!vid || !title) continue;

        results.push({
          videoId: vid,
          title,
          author: author ?? 'Unknown Artist',
          thumbnailUrl: bestThumbnail(thumbs),
          durationSeconds: parseDuration(durationText),
        });

        if (results.length >= maxResults) break;
      }

      return results;
    } catch (e) {
      console.error('YouTubeService.getRelatedVideos error:', e);
      return [];
    }
  }
}

export default YouTubeService.getInstance();
