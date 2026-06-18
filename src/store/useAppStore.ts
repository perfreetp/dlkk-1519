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
  UNREAD_COUNT: 'gov_queue_unread_count',
  QUEUE_TIMELINE: 'gov_queue_queue_timeline'
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
  method: 'webSpeech' | 'tts' | 'none';
  reason?: string;
} => {
  try {
    const systemInfo = Taro.getSystemInfoSync();
    const platform = systemInfo.platform || 'unknown';

    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      return {
        supported: true,
        platform,
        method: 'webSpeech',
      };
    }

    if (Taro.createInnerAudioContext) {
      return {
        supported: true,
        platform: `${platform}-TTS`,
        method: 'tts',
      };
    }

    return {
      supported: false,
      platform,
      method: 'none',
      reason: '当前平台未提供语音合成或音频播放能力（既无Web Speech API也无InnerAudioContext）'
    };
  } catch (e) {
    return {
      supported: false,
      platform: 'unknown',
      method: 'none',
      reason: '无法获取平台信息，请检查小程序基础库版本'
    };
  }
};

let innerAudioContext: any = null;

const textToAudioUrl = (text: string): string | null => {
  try {
    const cleanText = text.replace(/[，。！？、；：""''（）《》]/g, ',').replace(/,+/g, ',').replace(/^,|,$/g, '');
    if (!cleanText.trim()) return null;
    const encoded = encodeURIComponent(cleanText);
    return `https://tts.youdao.com/fanyivoice?word=${encoded}&le=zh&keyfrom=speaker-target&type=2`;
  } catch (e) {
    console.error('TTS URL生成失败:', e);
    return null;
  }
};

export interface QueueTimelineEvent {
  id: string;
  queueId: string;
  type: 'queue' | 'wait' | 'calling' | 'processing' | 'missed' | 'requeued' | 'completed' | 'info';
  time: string;
  title: string;
  description?: string;
}

export interface HallRatingSummary {
  avgRating: number;
  totalCount: number;
  recentComments: Array<RatingRecord & { hallName: string; serviceName: string }>;
  avgWaitTime: number;
}

interface AppState {
  elderMode: boolean;
  voiceMode: boolean;
  currentQueue: QueueRecord | null;
  queueList: QueueRecord[];
  reminders: Reminder[];
  unreadCount: number;
  ratings: RatingRecord[];
  queueTimeline: QueueTimelineEvent[];
  voiceSupport: { supported: boolean; platform: string; method: 'webSpeech' | 'tts' | 'none'; reason?: string };
  toggleElderMode: () => void;
  toggleVoiceMode: () => { success: boolean; reason?: string };
  setCurrentQueue: (queue: QueueRecord | null) => void;
  addQueue: (queue: QueueRecord) => void;
  requeue: (queueId: string) => void;
  cancelCurrentQueue: () => void;
  markReminderRead: (id: string) => void;
  markAllRemindersRead: () => void;
  addReminder: (reminder: Reminder) => void;
  saveRating: (recordId: string, rating: number, comment: string, hallName?: string, serviceName?: string) => void;
  getRating: (recordId: string) => RatingRecord | undefined;
  getHallRatings: (hallName: string) => HallRatingSummary;
  getServiceRatings: (serviceName: string) => { avgRating: number; totalCount: number };
  addTimelineEvent: (queueId: string, event: Omit<QueueTimelineEvent, 'id' | 'queueId' | 'time'>) => void;
  getTimelineForQueue: (queueId: string) => QueueTimelineEvent[];
  speak: (text: string) => Promise<{ success: boolean; reason?: string }>;
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
  queueTimeline: safeGetStorageSync<QueueTimelineEvent[]>(STORAGE_KEYS.QUEUE_TIMELINE, []),
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
      queueTimeline: safeGetStorageSync<QueueTimelineEvent[]>(STORAGE_KEYS.QUEUE_TIMELINE, []),
      voiceSupport: checkVoiceSupport(),
    });
  },

  toggleElderMode: () => {
    const next = !get().elderMode;
    set({ elderMode: next });
    safeSetStorageSync(STORAGE_KEYS.ELDER_MODE, next);
    if (next && get().voiceMode) {
      get().speak('已开启大字模式').catch(() => {});
    }
  },

  toggleVoiceMode: async () => {
    const next = !get().voiceMode;
    const voiceSupport = get().voiceSupport;

    if (next && !voiceSupport.supported) {
      const methodText = voiceSupport.method === 'none' ? '无可用播放方式' : 'TTS服务不可用';
      Taro.showModal({
        title: '语音播报不可用',
        content: `【当前平台】${voiceSupport.platform}\n【播报方式】${methodText}\n【失败原因】${voiceSupport.reason || '未知原因'}\n\n建议：\n1. H5端请使用Chrome/Edge/Safari浏览器\n2. 小程序端请确保网络可访问tts.youdao.com\n3. 检查设备音量及静音开关\n\n您仍可开启该选项，在支持的平台会自动生效。`,
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
      try {
        const result = await get().speak('已开启语音播报，叫号时会提醒您');
        if (!result.success) {
          Taro.showModal({
            title: '语音测试失败',
            content: `已开启选项，但本次未能播放测试语音：${result.reason || '未知原因'}\n\n这可能是网络问题导致TTS服务不可达，在支持的平台下一次叫号时会重试。`,
            showCancel: false,
            confirmText: '我知道了'
          });
        }
      } catch (e: any) {
        Taro.showModal({
          title: '语音测试失败',
          content: `已开启选项，但本次播放异常：${e?.message || '未知错误'}\n\n您可以在进度页点击「立即播报」按钮重试。`,
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    } else {
      get().speak('已关闭语音播报').catch(() => {});
    }
    return { success: true };
  },

  setCurrentQueue: (queue) => {
    set({ currentQueue: queue });
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, queue);
  },

  addTimelineEvent: (queueId, event) => {
    const { queueTimeline } = get();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newEvent: QueueTimelineEvent = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queueId,
      time: timeStr,
      ...event
    };
    const newTimeline = [newEvent, ...queueTimeline];
    set({ queueTimeline: newTimeline });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_TIMELINE, newTimeline);
  },

  getTimelineForQueue: (queueId) => {
    return get().queueTimeline.filter(e => e.queueId === queueId).sort((a, b) => a.time.localeCompare(b.time));
  },

  addQueue: (queue) => {
    const { queueList, voiceMode, speak, addTimelineEvent } = get();
    const newList = [queue, ...queueList];
    set({
      queueList: newList,
      currentQueue: queue
    });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, newList);
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, queue);

    addTimelineEvent(queue.id, {
      type: 'queue',
      title: '取号成功',
      description: `号码${queue.queueNumber}，${queue.serviceName}，前方还有${queue.waitCount}人等待`
    });
    addTimelineEvent(queue.id, {
      type: 'info',
      title: '预计办理时间',
      description: `约${queue.estimatedWaitTime}分钟后开始办理，请留意叫号`
    });

    if (voiceMode) {
      speak(`取号成功，您的号码是${queue.queueNumber}，${queue.serviceName}，前方还有${queue.waitCount}人等待，预计等待${queue.estimatedWaitTime}分钟`).catch(() => {});
    }
  },

  requeue: (queueId) => {
    const { queueList, voiceMode, speak, addTimelineEvent } = get();
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

    addTimelineEvent(queueId, {
      type: 'requeued',
      title: '重新排队成功',
      description: '已为您优先安排，前方还有3人，请留意叫号'
    });

    if (voiceMode) {
      speak('已为您重新排号，前方还有3人，请留意叫号').catch(() => {});
    }
  },

  cancelCurrentQueue: () => {
    const { queueList, currentQueue, addTimelineEvent } = get();
    if (currentQueue) {
      addTimelineEvent(currentQueue.id, {
        type: 'info',
        title: '已取消取号',
        description: '号码已作废，如需办理请重新取号'
      });
    }
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
    const { reminders, voiceMode, speak, addTimelineEvent, currentQueue } = get();
    const newList = [reminder, ...reminders];
    const count = newList.filter(r => !r.read).length;
    set({
      reminders: newList,
      unreadCount: count
    });
    safeSetStorageSync(STORAGE_KEYS.REMINDERS, newList);
    safeSetStorageSync(STORAGE_KEYS.UNREAD_COUNT, count);

    if (reminder.type === 'call' && currentQueue) {
      addTimelineEvent(currentQueue.id, {
        type: 'calling',
        title: '即将叫号',
        description: reminder.content
      });
    }

    if (voiceMode && reminder.type === 'call') {
      speak(reminder.content).catch(() => {});
    }
  },

  saveRating: (recordId, rating, comment, hallName = '', serviceName = '') => {
    const { ratings, voiceMode, speak } = get();
    const existingIndex = ratings.findIndex(r => r.recordId === recordId);
    const newRating: RatingRecord & { hallName?: string; serviceName?: string } = {
      recordId,
      rating,
      comment,
      timestamp: new Date().toISOString(),
      hallName,
      serviceName
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
    if (voiceMode) {
      speak('评价提交成功，感谢您的反馈').catch(() => {});
    }
  },

  getRating: (recordId) => {
    return get().ratings.find(r => r.recordId === recordId);
  },

  getHallRatings: (hallName) => {
    const all = get().ratings.filter(r => {
      const rr = r as any;
      return rr.hallName === hallName;
    });
    if (all.length === 0) {
      return { avgRating: 0, totalCount: 0, recentComments: [], avgWaitTime: 0 };
    }
    const avgRating = all.reduce((s, r) => s + r.rating, 0) / all.length;
    const recent = [...all]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5)
      .map(r => ({
        ...r,
        hallName: (r as any).hallName || hallName,
        serviceName: (r as any).serviceName || ''
      }));
    return {
      avgRating: Math.round(avgRating * 10) / 10,
      totalCount: all.length,
      recentComments: recent,
      avgWaitTime: 15
    };
  },

  getServiceRatings: (serviceName) => {
    const all = get().ratings.filter(r => {
      const rr = r as any;
      return rr.serviceName === serviceName;
    });
    if (all.length === 0) return { avgRating: 0, totalCount: 0 };
    return {
      avgRating: Math.round(all.reduce((s, r) => s + r.rating, 0) / all.length * 10) / 10,
      totalCount: all.length
    };
  },

  speak: (text) => {
    const voiceSupport = get().voiceSupport;

    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      try {
        const synth = (window as any).speechSynthesis;
        synth.cancel();
        const utterance = new (window as any).SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = synth.getVoices();
        const zhVoice = voices.find((v: any) => v.lang && v.lang.toLowerCase().startsWith('zh'));
        if (zhVoice) {
          utterance.voice = zhVoice;
        }
        synth.speak(utterance);
        return Promise.resolve({ success: true });
      } catch (e) {
        console.error('Web Speech 播报失败，尝试TTS:', e);
      }
    }

    try {
      if (Taro.createInnerAudioContext) {
        const audioUrl = textToAudioUrl(text);
        if (audioUrl) {
          if (!innerAudioContext) {
            innerAudioContext = Taro.createInnerAudioContext();
          }
          let hasError = false;
          let errorMsg = '';
          innerAudioContext.onError((err: any) => {
            hasError = true;
            errorMsg = err?.errMsg || JSON.stringify(err);
            console.error('TTS音频播放错误:', err);
          });
          innerAudioContext.stop();
          innerAudioContext.src = audioUrl;
          innerAudioContext.autoplay = false;

          return new Promise<any>((resolve) => {
            const timer = setTimeout(() => {
              resolve({ success: false, reason: hasError ? `TTS播放失败：${errorMsg}` : 'TTS播放超时' });
            }, 8000);

            innerAudioContext.onCanplay(() => {
              clearTimeout(timer);
              try {
                innerAudioContext.play();
                resolve({ success: true });
              } catch (playErr: any) {
                resolve({ success: false, reason: `TTS启动失败：${playErr?.message || JSON.stringify(playErr)}` });
              }
            });
          });
        }
        return Promise.resolve({ success: false, reason: 'TTS URL生成失败' });
      }
    } catch (e: any) {
      console.error('小程序音频播报失败:', e);
      return Promise.resolve({ success: false, reason: e?.message || 'TTS服务异常' });
    }

    return Promise.resolve({
      success: false,
      reason: voiceSupport.reason || '所有语音播放方式均失败，请检查设备支持情况'
    });
  }
}));
