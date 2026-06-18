import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { reminderList as mockReminders } from '@/data/reminders';
import ReminderItem from '@/components/ReminderItem';
import { Reminder } from '@/types';
import styles from './index.module.scss';

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'call', label: '叫号' },
  { key: 'material', label: '材料' },
  { key: 'tide', label: '潮汐' },
  { key: 'system', label: '系统' }
];

const ReminderPage: React.FC = () => {
  const { reminders, addReminder, markReminderRead, markAllRemindersRead, unreadCount, elderMode } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (reminders.length === 0) {
      mockReminders.forEach(r => {
        addReminder(r);
      });
    }
  }, []);

  const filteredReminders = activeFilter === 'all'
    ? reminders
    : reminders.filter(r => r.type === activeFilter);

  const handleMarkAll = () => {
    Taro.showModal({
      title: '标记全部已读',
      content: '确认将所有消息标记为已读吗？',
      confirmText: '全部已读',
      confirmColor: '#165dff',
      success: (res) => {
        if (res.confirm) {
          markAllRemindersRead();
          Taro.showToast({
            title: '已全部标为已读',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleReminderClick = (reminder: Reminder) => {
    if (!reminder.read) {
      markReminderRead(reminder.id);
    }
    if (reminder.type === 'call' && reminder.relatedQueueId) {
      Taro.switchTab({ url: '/pages/progress/index' });
    } else if (reminder.type === 'material' && reminder.relatedQueueId) {
      Taro.switchTab({ url: '/pages/progress/index' });
    } else if (reminder.type === 'tide') {
      Taro.switchTab({ url: '/pages/home/index' });
    }
  };

  const highlightReminder = filteredReminders.find(r => r.type === 'call' && !r.read);

  return (
    <ScrollView className={classnames(styles.page, elderMode && styles.elderMode)} scrollY>
      <View className={styles.header}>
        <View className={styles.headerBar}>
          <Text className={styles.title}>消息提醒</Text>
          <Text className={styles.markAll} onClick={handleMarkAll}>全部已读</Text>
        </View>
        <ScrollView className={styles.filterTabs} scrollX>
          {filterOptions.map(opt => (
            <View
              key={opt.key}
              className={classnames(styles.filterTab, activeFilter === opt.key && styles.active)}
              onClick={() => setActiveFilter(opt.key)}
            >
              {opt.label}
              {opt.key === 'all' && unreadCount > 0 && (
                <Text style={{ marginLeft: 8, color: '#f53f3f' }}>({unreadCount})</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.content}>
        {highlightReminder && (
          <View className={styles.highlightCard} onClick={() => handleReminderClick(highlightReminder)}>
            <View className={styles.highlightTitle}>
              <Text className={styles.highlightIcon}>🔔</Text>
              <Text>{highlightReminder.title}</Text>
            </View>
            <Text className={styles.highlightContent}>{highlightReminder.content}</Text>
            <Text className={styles.highlightTime}>{highlightReminder.time}</Text>
          </View>
        )}

        <View className={styles.reminderList}>
          {filteredReminders
            .filter(r => !(r.type === 'call' && !r.read && r.id === highlightReminder?.id))
            .map(reminder => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                elderMode={elderMode}
                onClick={() => handleReminderClick(reminder)}
              />
            ))}
        </View>

        {filteredReminders.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无相关提醒</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ReminderPage;
