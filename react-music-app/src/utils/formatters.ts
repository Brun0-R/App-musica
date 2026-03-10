import { AppStrings } from '../constants/strings';

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  const diffM = Math.floor(diffD / 30);
  const diffY = Math.floor(diffD / 365);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 30) return `${diffD}d ago`;
  if (diffM < 12) return `${diffM}mo ago`;
  return `${diffY}y ago`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return AppStrings.goodMorning;
  if (hour < 18) return AppStrings.goodAfternoon;
  return AppStrings.goodEvening;
}

export function songCountLabel(count: number): string {
  return `${count} ${count === 1 ? AppStrings.song : AppStrings.songs}`;
}
