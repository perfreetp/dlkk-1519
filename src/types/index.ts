// 类型定义

export interface Hall {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  crowdLevel: 'low' | 'medium' | 'high';
  waitTime: number;
  waitCount: number;
  openWindows: number;
  totalWindows: number;
  isNearby: boolean;
  type: 'main' | 'sub';
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  onlineReview: boolean;
  requiredMaterials: string[];
  estimatedTime: number;
}

export interface QueueRecord {
  id: string;
  queueNumber: string;
  serviceName: string;
  hallId: string;
  hallName: string;
  windowNumber?: string;
  status: 'waiting' | 'calling' | 'processing' | 'completed' | 'missed' | 'requeued';
  waitCount: number;
  estimatedWaitTime: number;
  createTime: string;
  callTime?: string;
  completeTime?: string;
  isCurrent: boolean;
}

export interface Reminder {
  id: string;
  type: 'call' | 'material' | 'tide' | 'system';
  title: string;
  content: string;
  time: string;
  read: boolean;
  relatedQueueId?: string;
}

export interface TideWindow {
  id: string;
  windowNumber: string;
  serviceName: string;
  status: 'open' | 'closed';
  waitCount: number;
}

export interface ServiceRecord {
  id: string;
  serviceName: string;
  hallName: string;
  date: string;
  status: 'completed' | 'incomplete';
  queueNumber: string;
  rating?: number;
  comment?: string;
}

export type CrowdLevelType = 'low' | 'medium' | 'high';
