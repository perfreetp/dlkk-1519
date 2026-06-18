import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { QueueRecord } from '@/types';
import { getStatusText, getStatusColor } from '@/utils';
import styles from './index.module.scss';

interface QueueStatusProps {
  queue: QueueRecord;
  showActions?: boolean;
  onRequeue?: () => void;
  onViewDetail?: () => void;
}

const QueueStatus: React.FC<QueueStatusProps> = ({
  queue,
  showActions = false,
  onRequeue,
  onViewDetail
}) => {
  const isWaiting = queue.status === 'waiting' || queue.status === 'requeued';
  const isMissed = queue.status === 'missed';

  return (
    <View className={styles.queueCard}>
      <View className={styles.queueHeader}>
        <Text className={styles.queueService}>{queue.serviceName}</Text>
        <Text className={styles.statusBadge}>{getStatusText(queue.status)}</Text>
      </View>

      <View className={styles.queueNumber}>
        <Text className={styles.numberLabel}>您的排队号</Text>
        <View className={styles.numberValue}>{queue.queueNumber}</View>
      </View>

      <View className={styles.queueStats}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{queue.waitCount}</Text>
          <Text className={styles.statLabel}>前方等待</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{queue.estimatedWaitTime}分</Text>
          <Text className={styles.statLabel}>预计等待</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{queue.windowNumber || '--'}</Text>
          <Text className={styles.statLabel}>办理窗口</Text>
        </View>
      </View>

      <View className={styles.queueFooter}>
        <Text className={styles.hallInfo}>📍 {queue.hallName}</Text>
        <Text className={styles.timeInfo}>取号 {queue.createTime.split(' ')[1]?.slice(0, 5)}</Text>
      </View>

      {showActions && (
        <View className={styles.actionBtns}>
          {isMissed && (
            <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={onRequeue}>
              申请重排
            </Button>
          )}
          {isWaiting && (
            <>
              <Button className={classnames(styles.btn, styles.btnOutline)}>
                取消取号
              </Button>
              <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={onViewDetail}>
                查看详情
              </Button>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default QueueStatus;
