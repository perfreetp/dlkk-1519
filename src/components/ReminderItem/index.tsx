import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Reminder } from '@/types';
import styles from './index.module.scss';

interface ReminderItemProps {
  reminder: Reminder;
  onClick?: () => void;
}

const iconMap: Record<string, string> = {
  call: '🔔',
  material: '📋',
  tide: '🌊',
  system: '📢'
};

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onClick }) => {
  return (
    <View className={styles.reminderItem} onClick={onClick}>
      <View className={classnames(styles.iconWrapper, styles[reminder.type])}>
        <Text>{iconMap[reminder.type] || '📢'}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{reminder.title}</Text>
          <Text className={styles.time}>{reminder.time}</Text>
        </View>
        <Text className={styles.desc}>{reminder.content}</Text>
      </View>
      {!reminder.read && <View className={styles.unreadDot} />}
    </View>
  );
};

export default ReminderItem;
