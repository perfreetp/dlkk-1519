import { create } from 'zustand';
import Taro from '@tarojs/taro';
import {
  QueueRecord,
  Reminder,
  RatingRecord,
  QueueTimelineEvent,
  HallRatingSummary,
  VoiceSupportInfo
} from '@/types';

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

const formatDateTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatTimeShort = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (isYesterday) return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
};

export const checkVoiceSupport = (): VoiceSupportInfo => {
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

    if (typeof Taro.createInnerAudioContext === 'function') {
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

interface AppState {
  elderMode: boolean;
  voiceMode: boolean;
  currentQueue: QueueRecord | null;
  queueList: QueueRecord[];
  reminders: Reminder[];
  unreadCount: number;
  ratings: RatingRecord[];
  queueTimeline: QueueTimelineEvent[];
  voiceSupport: VoiceSupportInfo;
  toggleElderMode: () => void;
  toggleVoiceMode: () => Promise<{ success: boolean; reason?: string }>;
  setCurrentQueue: (queue: QueueRecord | null) => void;
  addQueue: (queue: QueueRecord) => void;
  requeue: (queueId: string) => void;
  cancelCurrentQueue: () => void;
  markReminderRead: (id: string) => void;
  markAllRemindersRead: () => void;
  addReminder: (reminder: Reminder) => void;
  saveRating: (recordId: string, rating: number, comment: string, hallName?: string, serviceName?: string, waitMinutes?: number) => void;
  getRating: (recordId: string) => RatingRecord | undefined;
  getHallRatings: (hallName: string) => HallRatingSummary;
  getServiceRatings: (serviceName: string) => { avgRating: number; totalCount: number };
  addTimelineEvent: (queueId: string, event: Omit<QueueTimelineEvent, 'id' | 'queueId' | 'time'>) => void;
  getTimelineForQueue: (queueId: string) => QueueTimelineEvent[];
  simulateWaitProgress: () => void;
  simulateCallNumber: () => void;
  simulateMissed: () => void;
  simulateProcessing: () => void;
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
      get().speak('已开启大字模式').catch(() => { });
    }
  },

  toggleVoiceMode: async () => {
    const currentVoiceMode = get().voiceMode;
    const next = !currentVoiceMode;
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

    if (!next) {
      set({ voiceMode: false });
      safeSetStorageSync(STORAGE_KEYS.VOICE_MODE, false);
      get().speak('已关闭语音播报').catch(() => { });
      return { success: true };
    }

    try {
      const testResult = await get().speak('语音播报测试成功，叫号时会提醒您');
      if (testResult.success) {
        set({ voiceMode: true });
        safeSetStorageSync(STORAGE_KEYS.VOICE_MODE, true);
        return { success: true };
      } else {
        Taro.showModal({
          title: '语音播报开启失败',
          content: `试播未能成功播放，已保持关闭状态。\n\n【平台】${voiceSupport.platform}\n【方式】${voiceSupport.method}\n【原因】${testResult.reason || '未知'}\n\n建议检查：\n1. 设备是否静音或音量过低\n2. 网络是否正常（TTS需联网）\n3. 小程序权限是否允许音频播放\n\n如确认无问题，可再次尝试开启。`,
          showCancel: false,
          confirmText: '我知道了'
        });
        return { success: false, reason: testResult.reason };
      }
    } catch (e: any) {
      Taro.showModal({
        title: '语音播报开启失败',
        content: `试播时发生异常：${e?.message || '未知错误'}\n\n已保持关闭状态，请检查设备支持情况后重试。`,
        showCancel: false,
        confirmText: '我知道了'
      });
      return { success: false, reason: e?.message || '未知错误' };
    }
  },

  setCurrentQueue: (queue) => {
    set({ currentQueue: queue });
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, queue);
  },

  addTimelineEvent: (queueId, event) => {
    const { queueTimeline } = get();
    const now = new Date();
    const newEvent: QueueTimelineEvent = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queueId,
      time: formatDateTime(now),
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
      speak(`取号成功，您的号码是${queue.queueNumber}，${queue.serviceName}，前方还有${queue.waitCount}人等待，预计等待${queue.estimatedWaitTime}分钟`).catch(() => { });
    }
  },

  simulateWaitProgress: () => {
    const { currentQueue, addTimelineEvent, voiceMode, speak } = get();
    if (!currentQueue || currentQueue.status !== 'waiting') return;
    if (currentQueue.waitCount <= 0) return;

    const newWaitCount = Math.max(0, currentQueue.waitCount - 1);
    const updatedQueue = { ...currentQueue, waitCount: newWaitCount };

    set({ currentQueue: updatedQueue });
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, updatedQueue);

    const queueList = get().queueList.map(q =>
      q.id === currentQueue.id ? { ...q, waitCount: newWaitCount } : q
    );
    set({ queueList });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, queueList);

    addTimelineEvent(currentQueue.id, {
      type: 'wait',
      title: '前方人数减少',
      description: `前方还有${newWaitCount}人等待，距离叫号更近了一步`
    });

    if (newWaitCount <= 3 && newWaitCount > 0 && voiceMode) {
      speak(`前方还有${newWaitCount}人，快要轮到您了，请做好准备`).catch(() => { });
    }
  },

  simulateCallNumber: () => {
    const { currentQueue, addTimelineEvent, addReminder, voiceMode, speak } = get();
    if (!currentQueue || currentQueue.status !== 'waiting') return;

    const updatedQueue = {
      ...currentQueue,
      status: 'calling' as const,
      windowNumber: String(Math.floor(Math.random() * 15) + 1).padStart(2, '0') + '号窗',
      callTime: formatDateTime(new Date())
    };

    set({ currentQueue: updatedQueue });
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, updatedQueue);

    const queueList = get().queueList.map(q =>
      q.id === currentQueue.id ? updatedQueue : q
    );
    set({ queueList });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, queueList);

    addTimelineEvent(currentQueue.id, {
      type: 'calling',
      title: '即将叫号',
      description: `请前往${updatedQueue.windowNumber}办理，您的号码${currentQueue.queueNumber}`
    });

    addReminder({
      id: `rem-${Date.now()}`,
      type: 'call',
      title: '叫号提醒',
      content: `请前往${updatedQueue.windowNumber}办理，您的号码${currentQueue.queueNumber}`,
      time: formatDateTime(new Date()),
      read: false,
      relatedQueueId: currentQueue.id
    });

    if (voiceMode) {
      speak(`叫号提醒，${currentQueue.queueNumber}号，请前往${updatedQueue.windowNumber}办理业务`).catch(() => { });
    }
  },

  simulateMissed: () => {
    const { currentQueue, addTimelineEvent, voiceMode, speak } = get();
    if (!currentQueue || (currentQueue.status !== 'calling' && currentQueue.status !== 'waiting')) return;

    const updatedQueue = {
      ...currentQueue,
      status: 'missed' as const
    };

    set({ currentQueue: updatedQueue });
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, updatedQueue);

    const queueList = get().queueList.map(q =>
      q.id === currentQueue.id ? updatedQueue : q
    );
    set({ queueList });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, queueList);

    addTimelineEvent(currentQueue.id, {
      type: 'missed',
      title: '已过号',
      description: '您错过了本次叫号，可在服务台申请重新排队'
    });

    if (voiceMode) {
      speak('您已过号，请到服务台申请重新排队').catch(() => { });
    }
  },

  simulateProcessing: () => {
    const { currentQueue, addTimelineEvent, voiceMode, speak } = get();
    if (!currentQueue || currentQueue.status !== 'calling') return;

    const updatedQueue = {
      ...currentQueue,
      status: 'processing' as const
    };

    set({ currentQueue: updatedQueue });
    safeSetStorageSync(STORAGE_KEYS.CURRENT_QUEUE, updatedQueue);

    const queueList = get().queueList.map(q =>
      q.id === currentQueue.id ? updatedQueue : q
    );
    set({ queueList });
    safeSetStorageSync(STORAGE_KEYS.QUEUE_LIST, queueList);

    addTimelineEvent(currentQueue.id, {
      type: 'processing',
      title: '办理中',
      description: '您已到窗口，正在办理业务，请耐心等待'
    });

    if (voiceMode) {
      speak('正在为您办理业务，请稍候').catch(() => { });
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
      speak('已为您重新排号，前方还有3人，请留意叫号').catch(() => { });
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
      speak(reminder.content).catch(() => { });
    }
  },

  saveRating: (recordId, rating, comment, hallName = '', serviceName = '', waitMinutes) => {
    const { ratings, voiceMode, speak } = get();
    const existingIndex = ratings.findIndex(r => r.recordId === recordId);
    const newRating: RatingRecord = {
      recordId,
      rating,
      comment,
      timestamp: new Date().toISOString(),
      hallName,
      serviceName,
      waitMinutes: waitMinutes ?? undefined
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
      speak('评价提交成功，感谢您的反馈').catch(() => { });
    }
  },

  getRating: (recordId) => {
    return get().ratings.find(r => r.recordId === recordId);
  },

  getHallRatings: (hallName) => {
    const all = get().ratings.filter(r => r.hallName === hallName);
    if (all.length === 0) {
      return { avgRating: 0, totalCount: 0, recentComments: [], avgWaitTime: 0 };
    }
    const avgRating = all.reduce((s, r) => s + r.rating, 0) / all.length;
    const waitTimes = all.filter(r => typeof r.waitMinutes === 'number').map(r => r.waitMinutes as number);
    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((s, w) => s + w, 0) / waitTimes.length)
      : 0;
    const recent = [...all]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5);
    return {
      avgRating: Math.round(avgRating * 10) / 10,
      totalCount: all.length,
      recentComments: recent,
      avgWaitTime
    };
  },

  getServiceRatings: (serviceName) => {
    const all = get().ratings.filter(r => r.serviceName === serviceName);
    if (all.length === 0) return { avgRating: 0, totalCount: 0 };
    return {
      avgRating: Math.round(all.reduce((s, r) => s + r.rating, 0) / all.length * 10) / 10,
      totalCount: all.length
    };
  },

  speak: (text) => {
    const voiceSupport = get().voiceSupport;

    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      return new Promise((resolve) => {
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

          let finished = false;
          const finish = (success: boolean, reason?: string) => {
            if (finished) return;
            finished = true;
            resolve({ success, reason });
          };

          utterance.onend = () => finish(true);
          utterance.onerror = (e: any) => finish(false, `Web Speech错误：${e?.error || e?.message || '未知'}`);

          setTimeout(() => {
            if (!finished) finish(false, 'Web Speech播放超时');
          }, 10000);

          synth.speak(utterance);
        } catch (e: any) {
          resolve({ success: false, reason: `Web Speech初始化失败：${e?.message || '未知'}` });
        }
      });
    }

    try {
      if (Taro.createInnerAudioContext) {
        const audioUrl = textToAudioUrl(text);
        if (!audioUrl) {
          return Promise.resolve({ success: false, reason: 'TTS URL生成失败' });
        }

        if (!innerAudioContext) {
          innerAudioContext = Taro.createInnerAudioContext();
        }

        return new Promise((resolve) => {
          let resolved = false;
          let hasError = false;
          let errorMsg = '';

          const finish = (success: boolean, reason?: string) => {
            if (resolved) return;
            resolved = true;
            resolve({ success, reason });
          };

          innerAudioContext.onError((err: any) => {
            hasError = true;
            errorMsg = err?.errMsg || JSON.stringify(err);
            console.error('TTS音频播放错误:', err);
            finish(false, `TTS播放失败：${errorMsg}`);
          });

          innerAudioContext.onEnded(() => {
            finish(true);
          });

          try {
            innerAudioContext.stop();
            innerAudioContext.src = audioUrl;
            innerAudioContext.autoplay = false;
          } catch (e: any) {
            finish(false, `TTS设置失败：${e?.message || JSON.stringify(e)}`);
            return;
          }

          const timer = setTimeout(() => {
            if (!resolved) {
              finish(false, hasError ? `TTS播放失败：${errorMsg}` : 'TTS播放超时（8秒）');
            }
          }, 8000);

          innerAudioContext.onCanplay(() => {
            if (resolved) return;
            clearTimeout(timer);
            try {
              innerAudioContext.play();
            } catch (playErr: any) {
              finish(false, `TTS启动播放失败：${playErr?.message || JSON.stringify(playErr)}`);
            }
          });
        });
      }
    } catch (e: any) {
      console.error('小程序音频播报失败:', e);
      return Promise.resolve({ success: false, reason: `TTS服务异常：${e?.message || '未知'}` });
    }

    return Promise.resolve({
      success: false,
      reason: voiceSupport.reason || '所有语音播放方式均失败，请检查设备支持情况'
    });
  }
}));

export { formatTimeShort, formatDate };
