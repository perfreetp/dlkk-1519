import { create } from 'zustand';
import { QueueRecord, Reminder, ServiceRecord } from '@/types';

export interface RatingRecord {
  recordId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

interface AppState {
  elderMode: boolean;
  voiceMode: boolean;
  currentQueue: QueueRecord | null;
  queueList: QueueRecord[];
  reminders: Reminder[];
  unreadCount: number;
  ratings: RatingRecord[];
  toggleElderMode: () => void;
  toggleVoiceMode: () => void;
  setCurrentQueue: (queue: QueueRecord | null) => void;
  addQueue: (queue: QueueRecord) => void;
  requeue: (queueId: string) => void;
  cancelCurrentQueue: () => void;
  markReminderRead: (id: string) => void;
  markAllRemindersRead: () => void;
  addReminder: (reminder: Reminder) => void;
  saveRating: (recordId: string, rating: number, comment: string) => void;
  getRating: (recordId: string) => RatingRecord | undefined;
  speak: (text: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  elderMode: false,
  voiceMode: false,
  currentQueue: null,
  queueList: [],
  reminders: [],
  unreadCount: 0,
  ratings: [],

  toggleElderMode: () => {
    const next = !get().elderMode;
    set({ elderMode: next });
    if (next && get().voiceMode) {
      get().speak('已开启大字模式');
    }
  },

  toggleVoiceMode: () => {
    const next = !get().voiceMode;
    set({ voiceMode: next });
    if (next) {
      get().speak('已开启语音播报');
    }
  },

  setCurrentQueue: (queue) => {
    set({ currentQueue: queue });
  },

  addQueue: (queue) => {
    const { queueList } = get();
    const newList = [queue, ...queueList];
    set({
      queueList: newList,
      currentQueue: queue
    });
    if (get().voiceMode) {
      get().speak(`取号成功，您的号码是${queue.queueNumber}`);
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
    const current = updated.find(q => q.isCurrent);
    if (current) {
      set({ currentQueue: current });
    }
    if (get().voiceMode) {
      get().speak('已为您重新排号');
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
  },

  markReminderRead: (id) => {
    const { reminders } = get();
    const updated = reminders.map(r =>
      r.id === id ? { ...r, read: true } : r
    );
    set({
      reminders: updated,
      unreadCount: updated.filter(r => !r.read).length
    });
  },

  markAllRemindersRead: () => {
    const { reminders } = get();
    const updated = reminders.map(r => ({ ...r, read: true }));
    set({
      reminders: updated,
      unreadCount: 0
    });
  },

  addReminder: (reminder) => {
    const { reminders, voiceMode } = get();
    const newList = [reminder, ...reminders];
    set({
      reminders: newList,
      unreadCount: newList.filter(r => !r.read).length
    });
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
  },

  getRating: (recordId: string) => {
    return get().ratings.find(r => r.recordId === recordId);
  },

  speak: (text: string) => {
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      try {
        (window as any).speechSynthesis.cancel();
        const utterance = new (window as any).SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1;
        utterance.pitch = 1;
        (window as any).speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('语音播报失败:', e);
      }
    }
  }
}));
