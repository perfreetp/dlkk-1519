import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { QueueRecord, Reminder, ServiceRecord } from '@/types';

export interface RatingRecord {
  recordId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

const STORAGE_KEYS = {
  ELDER_MODE: 'gov_queue_elder_mode',
  VOICE_MODE: 'gov_queue_voice_mode',
  RATINGS: 'gov_queue_ratings',
  CURRENT_QUEUE: 'gov_queue_current_queue',
  QUEUE_LIST: 'gov_queue_queue_list',
  REMINDERS: 'gov_queue_reminders',
  UNREAD_COUNT: 'gov_queue_unread_count'
} as const;

const safeGetStorageSync = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data === '' || data === null || data === undefined) {
      return defaultValue;
    }
    return data as T;
  } catch (e) {
    console.warn(`读取本地存储失败 [${key}]:`, e);
    return defaultValue;
  }
};

const safeSetStorageSync = (key: string, value: any): void => {
  try {
    Taro.setStorageSync(key, value);
  } catch (e) {
    console.warn(`写入本地存储失败 [${key}]:`, e);
  }
};

export const checkVoiceSupport = (): {
  supported: boolean;
  platform: string;
  reason?: string;
} => {
  try {
    const systemInfo = Taro.getSystemInfoSync();
    const platform = systemInfo.platform || 'unknown';

    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      return {
        supported: true,
        platform,
      };
    }

    if (Taro.createInnerAudioContext) {
      return {
        supported: true,
        platform: `${platform}-innerAudio`,
      };
    }

    return {
      supported: false,
      platform,
      reason: '当前平台未提供语音合成或音频播放能力'
    };
  } catch (e) {
    return {
      supported: false,
      platform: 'unknown',
      reason: '无法获取平台信息'
    };
  }
};

let innerAudioContext: any = null;

const textToAudioUrl = (text: string): string | null => {
  const encoded = encodeURIComponent(text);
  return null;
};

interface AppState {
  elderMode: boolean;
  voiceMode: boolean;
  currentQueue: QueueRecord | null;
  queueList: QueueRecord[];
  reminders: Reminder[];
  unreadCount: number;
  ratings: RatingRecord[];
  voiceSupport: { supported: boolean; platform: string; reason?: string };
  toggleElderMode: () => void;
  toggleVoiceMode: () => { success: boolean; reason?: string };
  setCurrentQueue: (queue: QueueRecord | null) => void;
  addQueue: (queue: QueueRecord) => void;
  requeue: (queueId: string) => void;
  cancelCurrentQueue: () => void;
  markReminderRead: (id: string) => void;
  markAllRemindersRead: () => void;
  addReminder: (reminder: Reminder) => void;
  saveRating: (recordId: string, rating: number, comment: string) => void;
  getRating: (recordId: string) => RatingRecord | undefined;
  speak: (text: string) => { success: boolean; reason?: string };
  initFromStorage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  elderMode: safeGetStorageSync<boolean>(STORAGE_KEYS.ELDER_MODE, false),
  voiceMode: safeGetStorageSync<boolean>(STORAGE_KEYS.VOICE_MODE, false),
  currentQueue: safeGetStorageSync<QueueRecord | null>(STORAGE_KEYS.CURRENT_QUEUE, null),
  queueList: safeGetStorageSync<QueueRecord[]>(STORAGE_KEYS.QUEUE_LIST, []),
  reminders: safeGetStorageSync<Reminder[]>(STORAGE_KEYS.REMINDERS, []),
  unreadCount: safeGetStorageSync<number>(STORAGE_KEYS.UNREAD_COUNT, 0),
  ratings: safeGetStorageSync<RatingRecord[]>(STORAGE_KEYS.RATINGS, []),
  voiceSupport: checkVoiceSupport(),

  initFromStorage: () => {
    set({
      elderMode: safeGetStorageSync<boolean>(STORAGE_KEYS.ELDER_MODE, false),
      voiceMode: safeGetStorageSync<boolean>(STORAGE_KEYS.VOICE_MODE, false),
      currentQueue: safeGetStorageSync<QueueRecord | null>(STORAGE_KEYS.CURRENT_QUEUE, null),
      queueList: safeGetStorageSync<QueueRecord[]>(STORAGE_KEYS.QUEUE_LIST, []),
      reminders: safeGetStorageSync<Reminder[]>(STORAGE_KEYS.REMINDERS, []),
      unreadCount: safeGetStorageSync<number>(STORAGE_KEYS.UNREAD_COUNT, 0),
      ratings: safeGetStorageSync<RatingRecord[]>(STORAGE_KEYS.RATINGS, []),
      voiceSupport: checkVoiceSupport(),
    });
  },

  toggleElderMode: () => {
    const next = !get().elderMode;
    set({ elderMode: next });
    safeSetStorageSync(STORAGE_KEYS.ELDER_MODE, next);
    if (next && get().voiceMode) {
      get().speak('已开启大字模式');
    }
  },

  toggleVoiceMode: () => {
    const next = !get().voiceMode;
    const voiceSupport = get().voiceSupport;

    if (next && !voiceSupport.supported) {
      Taro.showModal({
        title: '语音播报不可用',
        content: `当前平台（${voiceSupport.platform}）不支持语音播报功能：${voiceSupport.reason || '未知原因'}。\n\n您仍可开启该选项，在支持的平台上会自动生效。`,
        confirmText: '仍然开启',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            set({ voiceMode: true });
            safeSetStorageSync(STORAGE_KEYS.VOICE_MODE, true);
          }
        }
      });
      return { success: false, reason: voiceSupport.reason };
    }

    set({ voiceMode: next });
    safeSetStorageSync(STORAGE_KEYS.VOICE_MODE, next);

    if (next) {
      const result = get().speak('已开启语音播报');
      if (!result.success) {
        Taro.showToast({
          title: '语音播放失败',
          icon: 'none',
          duration: 2000
        });
      }
    }
    return { success: true };
  },

  setCurrentQueue: (queue) => {
    set({ currentQueue: queue });
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, queue);
  },

  addQueue: (queue) => {
    const { queueList } = get();
    const newList = [queue, ...queueList];
    set({
      queueList: newList,
      currentQueue: queue
    });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, newList);
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, queue);
    if (get().voiceMode) {
      get().speak(`取号成功，您的号码是${queue.queueNumber}，前方还有${queue.waitCount}人等待`);
    }
  },

  requeue: (queueId) => {
    const { queueList } = get();
    const updated = queueList.map(q => {
      if (q.id === queueId && q.status === 'missed') {
        return {
          ...q,
          status: 'requeued' as const,
          queueNumber: q.queueNumber + 'R',
          waitCount: 3
        };
      }
      return q;
    });
    set({ queueList: updated });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, updated);
    const current = updated.find(q => q.isCurrent);
    if (current) {
      set({ currentQueue: current });
      safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, current);
    }
    if (get().voiceMode) {
      get().speak('已为您重新排号，前方还有3人，请留意叫号');
    }
  },

  cancelCurrentQueue: () => {
    const { queueList, currentQueue } = get();
    const updated = queueList.map(q => {
      if (q.isCurrent) {
        return { ...q, isCurrent: false };
      }
      return q;
    });
    set({
      queueList: updated,
      currentQueue: null
    });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, updated);
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, null);
  },

  markReminderRead: (id) => {
    const { reminders } = get();
    const updated = reminders.map(r =>
      r.id === id ? { ...r, read: true } : r
    );
    const count = updated.filter(r => !r.read).length;
    set({
      reminders: updated,
      unreadCount: count
    });
    safeSetStorageSync(STORAGE_KEYS.REMINDERS, updated);
    safeSetStorageSync(STORAGE_KEYS.UNREAD_COUNT, count);
  },

  markAllRemindersRead: () => {
    const { reminders } = get();
    const updated = reminders.map(r => ({ ...r, read: true }));
    set({
      reminders: updated,
      unreadCount: 0
    });
    safeSetStorageSync(STORAGE_KEYS.REMINDERS, updated);
    safeSetStorageSync(STORAGE_KEYS.UNREAD_COUNT, 0);
  },

  addReminder: (reminder) => {
    const { reminders, voiceMode } = get();
    const newList = [reminder, ...reminders];
    const count = newList.filter(r => !r.read).length;
    set({
      reminders: newList,
      unreadCount: count
    });
    safeSetStorageSync(STORAGE_KEYS.REMINDERS, newList);
    safeSetStorageSync(STORAGE_KEYS.UNREAD_COUNT, count);
    if (voiceMode && reminder.type === 'call') {
      get().speak(reminder.content);
    }
  },

  saveRating: (recordId: string, rating: number, comment: string) => {
    const { ratings } = get();
    const existingIndex = ratings.findIndex(r => r.recordId === recordId);
    const newRating: RatingRecord = {
      recordId,
      rating,
      comment,
      timestamp: new Date().toISOString()
    };
    let newRatings;
    if (existingIndex >= 0) {
      newRatings = [...ratings];
      newRatings[existingIndex] = newRating;
    } else {
      newRatings = [newRating, ...ratings];
    }
    set({ ratings: newRatings });
    safeSetStorageSync(STORAGE_KEYS.RATINGS, newRatings);
    if (get().voiceMode) {
      get().speak('评价提交成功，感谢您的反馈');
    }
  },

  getRating: (recordId: string) => {
    return get().ratings.find(r => r.recordId === recordId);
  },

  speak: (text: string) => {
    const voiceSupport = get().voiceSupport;

    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      try {
        (window as any).speechSynthesis.cancel();
        const utterance = new (window as any).SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        (window as any).speechSynthesis.speak(utterance);
        return { success: true };
      } catch (e) {
        console.error('Web Speech 播报失败:', e);
      }
    }

    try {
      if (Taro.createInnerAudioContext) {
        if (!innerAudioContext) {
          innerAudioContext = Taro.createInnerAudioContext();
          innerAudioContext.onError((err: any) => {
            console.error('音频播放错误:', err);
          });
        }
        const audioUrl = textToAudioUrl(text);
        if (audioUrl) {
          innerAudioContext.stop();
          innerAudioContext.src = audioUrl;
          innerAudioContext.play();
          return { success: true };
        }
      }
    } catch (e) {
      console.error('小程序音频播报失败:', e);
    }

    return {
      success: false,
      reason: voiceSupport.reason || '所有语音播放方式均失败'
    };
  }
}));
