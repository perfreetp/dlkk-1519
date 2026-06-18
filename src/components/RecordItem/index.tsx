import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import { ServiceRecord } from '@/types';
import styles from './index.module.scss';

interface RecordItemProps {
  record: ServiceRecord;
  onRate?: () => void;
  onClick?: () => void;
}

const RecordItem: React.FC<RecordItemProps> = ({ record, onRate, onClick }) => {
  const statusText = record.status === 'completed' ? '已办结' : '未办结';
  const statusClass = record.status === 'completed' ? 'completed' : 'incomplete';

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Text key={i} className={styles.star}>
          {i < rating ? '★' : '☆'}
        </Text>
      );
    }
    return <View className={styles.rating}>{stars}</View>;
  };

  return (
    <View className={styles.recordItem} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.serviceName}>{record.serviceName}</Text>
        <Text className={classnames(styles.statusTag, styles[statusClass])}>
          {statusText}
        </Text>
      </View>
      <View className={styles.info}>
        <Text className={styles.hall}>📍 {record.hallName}</Text>
        <Text className={styles.queueNum}>号：{record.queueNumber}</Text>
      </View>
      <View className={styles.footer}>
        <Text className={styles.date}>{record.date}</Text>
        {record.rating ? (
          renderStars(record.rating)
        ) : (
          record.status === 'completed' && (
            <Button className={styles.actionBtn} onClick={(e) => {
              e.stopPropagation();
              onRate?.();
            }}>
              去评价
            </Button>
          )
        )}
      </View>
    </View>
  );
};

export default RecordItem;
