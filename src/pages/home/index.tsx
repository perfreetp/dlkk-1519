import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { hallList, tideWindows, getNearbyHall } from '@/data/halls';
import { serviceCategories } from '@/data/services';
import { currentQueueMock } from '@/data/queue';
import HallCard from '@/components/HallCard';
import QueueStatus from '@/components/QueueStatus';
import { generateQueueNumber, generateId } from '@/utils';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { currentQueue, setCurrentQueue, addQueue, elderMode } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const nearbyHall = getNearbyHall();

  useEffect(() => {
    if (!currentQueue) {
      setCurrentQueue(currentQueueMock);
    }
  }, []);

  const handlePullDownRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const handleQuickGetNumber = () => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const handleHallClick = (hallId: string) => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const handleServiceClick = (categoryId: string) => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const handleSearch = () => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const handleViewQueueDetail = () => {
    Taro.switchTab({ url: '/pages/progress/index' });
  };

  const quickActions = [
    { icon: '🎫', name: '快速取号', action: handleQuickGetNumber },
    { icon: '🏢', name: '大厅查询', action: () => Taro.switchTab({ url: '/pages/queue/index' }) },
    { icon: '📋', name: '办事指南', action: () => Taro.switchTab({ url: '/pages/reminder/index' }) },
    { icon: '⭐', name: '我的收藏', action: () => Taro.switchTab({ url: '/pages/record/index' }) }
  ];

  return (
    <ScrollView
      className={classnames(styles.page, elderMode && styles.elderMode)}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handlePullDownRefresh}
    >
      <View className={styles.header}>
        <View className={styles.locationBar}>
          <View className={styles.location}>
            <Text className={styles.locationIcon}>📍</Text>
            <Text className={styles.locationText}>
              {nearbyHall ? nearbyHall.name : '定位中...'}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '24rpx' }}>切换</Text>
        </View>

        <View className={styles.searchBar} onClick={handleSearch}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchPlaceholder}>搜索办事事项、大厅名称</Text>
        </View>
      </View>

      <View className={styles.content}>
        {currentQueue ? (
          <View className={styles.queueCardWrapper}>
            <QueueStatus
              queue={currentQueue}
              showActions
              elderMode={elderMode}
              onViewDetail={handleViewQueueDetail}
            />
          </View>
        ) : (
          <View className={styles.emptyQueue}>
            <Text className={styles.emptyIcon}>🎫</Text>
            <Text className={styles.emptyText}>暂无排队中，点击下方快速取号</Text>
            <Button className={styles.emptyBtn} onClick={handleQuickGetNumber}>
              立即取号
            </Button>
          </View>
        )}

        <View className={styles.quickActions}>
          {quickActions.map((action, index) => (
            <View
              key={index}
              className={styles.actionItem}
              onClick={action.action}
            >
              <View className={styles.actionIcon}>{action.icon}</View>
              <Text className={styles.actionText}>{action.name}</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleText}>附近大厅</Text>
            <Text className={styles.moreText}>查看全部</Text>
          </View>
          {hallList.slice(0, 3).map(hall => (
            <HallCard
              key={hall.id}
              hall={hall}
              showNearbyBadge
              elderMode={elderMode}
              onClick={() => handleHallClick(hall.id)}
            />
          ))}
        </View>

        <View className={styles.tideSection}>
          <View className={styles.tideTitle}>
            <Text className={styles.tideIcon}>🌊</Text>
            <Text>潮汐窗口</Text>
          </View>
          <View className={styles.tideList}>
            {tideWindows.map(tide => (
              <View key={tide.id} className={styles.tideItem}>
                <View className={styles.tideLeft}>
                  <Text className={styles.tideWindow}>{tide.windowNumber}</Text>
                  <Text className={styles.tideService}>{tide.serviceName}</Text>
                </View>
                <Text className={`${styles.tideStatus} ${tide.status === 'open' ? styles.open : styles.closed}`}>
                  {tide.status === 'open' ? '开放中' : '未开放'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleText}>常用事项</Text>
          </View>
          <View className={styles.quickActions}>
            {serviceCategories.slice(0, 8).map(cat => (
              <View
                key={cat.id}
                className={styles.actionItem}
                onClick={() => handleServiceClick(cat.id)}
              >
                <View className={styles.actionIcon}>
                  {cat.id === 'social' && '💳'}
                  {cat.id === 'house' && '🏠'}
                  {cat.id === 'id' && '🪪'}
                  {cat.id === 'tax' && '💰'}
                  {cat.id === 'civil' && '💒'}
                  {cat.id === 'medical' && '🏥'}
                  {cat.id === 'traffic' && '🚗'}
                  {cat.id === 'education' && '🎓'}
                </View>
                <Text className={styles.actionText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
