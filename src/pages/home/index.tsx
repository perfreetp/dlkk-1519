import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { hallList, tideWindows, getNearbyHall } from '@/data/halls';
import { serviceCategories } from '@/data/services';
import { currentQueueMock } from '@/data/queue';
import HallCard from '@/components/HallCard';
import QueueStatus from '@/components/QueueStatus';
import { generateQueueNumber, generateId, getCrowdLevelText, getCrowdLevelColor } from '@/utils';
import { Hall } from '@/types';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { currentQueue, setCurrentQueue, addQueue, elderMode, getHallRatings } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const nearbyHall = getNearbyHall();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);

  useEffect(() => {
    if (!currentQueue) {
      setCurrentQueue(currentQueueMock);
    }
  }, []);

  const hallRatingSummary = useMemo(() => {
    if (!selectedHall) return null;
    return getHallRatings(selectedHall.name);
  }, [selectedHall, getHallRatings]);

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

  const handleHallClick = (hall: Hall) => {
    setSelectedHall(hall);
    setShowDetailModal(true);
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

  const handleGoToQueue = () => {
    setShowDetailModal(false);
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <Text style={{ color: '#FF9500' }}>
        {'★'.repeat(full)}
        {half && '⯨'}
        {'☆'.repeat(empty)}
      </Text>
    );
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
              onClick={() => handleHallClick(hall)}
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

      {showDetailModal && selectedHall && (
        <View className={styles.modalMask} onClick={() => setShowDetailModal(false)}>
          <View className={styles.detailModal} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>{selectedHall.name}</Text>
              <Text className={styles.modalClose} onClick={() => setShowDetailModal(false)}>×</Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.modalAddressRow}>
                <Text>📍 {selectedHall.address}</Text>
              </View>

              <View className={styles.statsGrid}>
                <View className={styles.statItem}>
                  <Text className={styles.statLabel}>拥挤度</Text>
                  <Text className={styles.statValue} style={{ color: getCrowdLevelColor(selectedHall.crowdLevel) }}>
                    {getCrowdLevelText(selectedHall.crowdLevel)}
                  </Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statLabel}>等待人数</Text>
                  <Text className={styles.statValue}>{selectedHall.waitCount}人</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statLabel}>预计等待</Text>
                  <Text className={styles.statValue}>{selectedHall.waitTime}分钟</Text>
                </View>
                <View className={styles.statItem}>
                  <Text className={styles.statLabel}>开放窗口</Text>
                  <Text className={styles.statValue}>{selectedHall.openWindows}/{selectedHall.totalWindows}</Text>
                </View>
              </View>

              <View className={styles.ratingsSection}>
                <View className={styles.ratingsHeader}>
                  <Text className={styles.ratingsTitle}>群众评价</Text>
                  {hallRatingSummary && hallRatingSummary.totalCount > 0 && (
                    <View className={styles.ratingsSummary}>
                      <View style={{ display: 'flex', alignItems: 'center' }}>
                        {renderStars(hallRatingSummary.avgRating)}
                        <Text className={styles.ratingBigScore}>{hallRatingSummary.avgRating.toFixed(1)}</Text>
                      </View>
                      <Text className={styles.ratingCountText}>共 {hallRatingSummary.totalCount} 条评价</Text>
                      <Text className={styles.ratingWaitText}>平均等待 {hallRatingSummary.avgWaitTime} 分钟</Text>
                    </View>
                  )}
                </View>

                {!hallRatingSummary || hallRatingSummary.totalCount === 0 ? (
                  <View className={styles.emptyRatings}>
                    <Text className={styles.emptyRatingIcon}>💬</Text>
                    <Text className={styles.emptyRatingText}>暂无评价，去办理后成为第一个评价的人吧~</Text>
                  </View>
                ) : (
                  <View className={styles.commentList}>
                    {hallRatingSummary.recentComments.map((comment, idx) => (
                      <View key={idx} className={styles.commentItem}>
                        <View className={styles.commentHeader}>
                          <View className={styles.commentAvatar}>
                            {comment.hallName ? comment.hallName.charAt(0) : '群'}
                          </View>
                          <View className={styles.commentInfo}>
                            <Text className={styles.commentService}>{comment.serviceName || '综合事项'}</Text>
                            <View style={{ display: 'flex', alignItems: 'center' }}>
                              {renderStars(comment.rating)}
                              <Text className={styles.commentTime}>· {comment.date}</Text>
                            </View>
                          </View>
                        </View>
                        {comment.comment && (
                          <Text className={styles.commentContent}>{comment.comment}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View className={styles.tipsSection}>
                <Text className={styles.tipsTitle}>💡 温馨提示</Text>
                <Text className={styles.tipsItem}>• 建议提前15分钟到达大厅，带齐相关材料</Text>
                <Text className={styles.tipsItem}>• 高峰时段（9:00-11:00，14:00-16:00）等待时间较长</Text>
                <Text className={styles.tipsItem}>• 过号后请在服务台重新排队，可优先安排</Text>
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button className={styles.modalBtnSecondary} onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              <Button className={styles.modalBtnPrimary} onClick={handleGoToQueue}>
                去该大厅取号
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default HomePage;
