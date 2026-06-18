import { create } from 'zustand';
import { QueueRecord, Reminder } from '@/types';

interface AppState {
  elderMode: boolean;
  voiceMode: boolean;
  currentQueue: QueueRecord | null;
  queueList: QueueRecord[];
  reminders: Reminder[];
  unreadCount: number;
  toggleElderMode: () => void;
  toggleVoiceMode: () => void;
  setCurrentQueue: (queue: QueueRecord | null) => void;
  addQueue: (queue: QueueRecord) => void;
  requeue: (queueId: string) => void;
  markReminderRead: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  elderMode: false,
  voiceMode: false,
  currentQueue: null,
  queueList: [],
  reminders: [],
  unreadCount: 0,

  toggleElderMode: () => {
    set({ elderMode: !get().elderMode });
  },

  toggleVoiceMode: () => {
    set({ voiceMode: !get().voiceMode });
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

  addReminder: (reminder) => {
    const { reminders } = get();
    const newList = [reminder, ...reminders];
    set({
      reminders: newList,
      unreadCount: newList.filter(r => !r.read).length
    });
  }
}));
