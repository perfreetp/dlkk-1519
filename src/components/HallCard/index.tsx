import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Hall } from '@/types';
import { getCrowdLevelText, getCrowdLevelColor, formatDistance } from '@/utils';
import styles from './index.module.scss';

interface HallCardProps {
  hall: Hall;
  showNearbyBadge?: boolean;
  elderMode?: boolean;
  onClick?: () => void;
}

const HallCard: React.FC<HallCardProps> = ({ hall, showNearbyBadge = false, elderMode, onClick }) => {
  const crowdColor = getCrowdLevelColor(hall.crowdLevel);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <View
      className={classnames(styles.hallCard, showNearbyBadge && hall.isNearby && styles.nearby, elderMode && styles.elderMode)}
      onClick={handleClick}
    >
      <View className={styles.hallHeader}>
        <Text className={styles.hallName}>{hall.name}</Text>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          {hall.type === 'sub' && <Text className={styles.hallType}>分中心</Text>}
          {showNearbyBadge && hall.isNearby && (
            <Text className={styles.nearbyBadge}>最近</Text>
          )}
        </View>
      </View>

      <View className={styles.hallAddress}>
        <Text className={styles.addressIcon}>📍</Text>
        <Text style={{ flex: 1 }}>{hall.address}</Text>
        <Text className={styles.distance}>{formatDistance(hall.distance)}</Text>
      </View>

      <View className={styles.hallInfo}>
        <View className={styles.crowdInfo}>
          <View className={styles.crowdItem}>
            <Text className={styles.crowdLabel}>拥挤度</Text>
            <Text
              className={classnames(styles.crowdValue, styles[hall.crowdLevel])}
              style={{ color: crowdColor }}
            >
              {getCrowdLevelText(hall.crowdLevel)}
            </Text>
          </View>
          <View className={styles.crowdItem}>
            <Text className={styles.crowdLabel}>等待</Text>
            <Text className={styles.crowdValue} style={{ color: crowdColor }}>
              {hall.waitCount}人
            </Text>
          </View>
          <View className={styles.crowdItem}>
            <Text className={styles.crowdLabel}>预计</Text>
            <Text className={styles.crowdValue} style={{ color: crowdColor }}>
              {hall.waitTime}分
            </Text>
          </View>
        </View>
        <View className={styles.windowInfo}>
          <Text>开放窗口 </Text>
          <Text className={styles.windowCount}>{hall.openWindows}</Text>
          <Text>/{hall.totalWindows}</Text>
        </View>
      </View>
    </View>
  );
};

export default HallCard;
