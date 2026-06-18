import { CrowdLevelType } from '@/types';

export const getCrowdLevelText = (level: CrowdLevelType): string => {
  const map = {
    low: '舒适',
    medium: '一般',
    high: '拥挤'
  };
  return map[level];
};

export const getCrowdLevelColor = (level: CrowdLevelType): string => {
  const map = {
    low: '#00b42a',
    medium: '#ff7d00',
    high: '#f53f3f'
  };
  return map[level];
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    waiting: '排队中',
    calling: '叫号中',
    processing: '办理中',
    completed: '已完成',
    missed: '已过号',
    requeued: '已重排'
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    waiting: '#165dff',
    calling: '#ff7d00',
    processing: '#00b42a',
    completed: '#86909c',
    missed: '#f53f3f',
    requeued: '#165dff'
  };
  return map[status] || '#86909c';
};

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}米`;
  }
  return `${km.toFixed(1)}公里`;
};

export const generateQueueNumber = (prefix = 'A'): string => {
  const num = Math.floor(Math.random() * 100).toString().padStart(3, '0');
  return `${prefix}${num}`;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
