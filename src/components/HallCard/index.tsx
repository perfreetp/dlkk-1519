import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Hall } from '@/types';
import { useAppStore } from '@/store/useAppStore';
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
  const { getHallRatings } = useAppStore();

  const ratingSummary = useMemo(() => {
    return getHallRatings(hall.name);
  }, [hall.name, getHallRatings]);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <>
        {'★'.repeat(full)}
        {half && '⯨'}
        {'☆'.repeat(empty)}
      </>
    );
  };

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

      <View className={styles.ratingBar}>
        <View className={styles.ratingStars}>
          <Text className={styles.starsText} style={{ color: '#FF9500' }}>
            {ratingSummary.totalCount > 0 ? renderStars(ratingSummary.avgRating) : '☆☆☆☆☆'}
          </Text>
          <Text className={styles.ratingScore}>
            {ratingSummary.totalCount > 0 ? ratingSummary.avgRating.toFixed(1) : '暂无'}
          </Text>
        </View>
        <Text className={styles.ratingMeta}>
          {ratingSummary.totalCount > 0
            ? `${ratingSummary.totalCount}条评价 · 平均等待${ratingSummary.avgWaitTime}分钟`
            : '尚未有评价，点我查看详情'}
        </Text>
        <Text className={styles.ratingArrow}>›</Text>
      </View>
    </View>
  );
};

export default HallCard;
