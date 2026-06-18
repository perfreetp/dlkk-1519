import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { hallList, getNearbyHall } from '@/data/halls';
import { serviceCategories, serviceList } from '@/data/services';
import { ServiceItem as ServiceItemType, QueueRecord, Hall } from '@/types';
import { generateQueueNumber, generateId, getCrowdLevelText } from '@/utils';
import styles from './index.module.scss';

interface TravelAdvice {
  departTime: string;
  arriveTime: string;
  handleTime: string;
  finishTime: string;
  totalMinutes: number;
  shouldChangeHall: boolean;
  suggestHall?: Hall;
  reason: string;
  transportTips: string[];
}

const QueuePage: React.FC = () => {
  const { addQueue, elderMode, getHallRatings: getHallRatingFn } = useAppStore();
  const [selectedHall, setSelectedHall] = useState<Hall>(getNearbyHall() || hallList[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItemType | null>(null);
  const [showHallPicker, setShowHallPicker] = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);

  const filteredServices = useMemo(() => {
    let list = serviceList;
    if (selectedCategory) {
      list = list.filter(s => s.categoryId === selectedCategory);
    }
    if (searchText) {
      list = list.filter(s =>
        s.name.includes(searchText) || s.category.includes(searchText)
      );
    }
    return list;
  }, [selectedCategory, searchText]);

  const travelAdvice = useMemo<TravelAdvice | null>(() => {
    if (!selectedService) return null;
    const now = new Date();
    const travelMinutes = Math.max(5, Math.round(selectedHall.distance * 8));
    const waitMinutes = selectedHall.waitTime;
    const handleMinutes = selectedService.estimatedTime;
    const totalMinutes = travelMinutes + waitMinutes + handleMinutes;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const addMinutes = (date: Date, mins: number) => {
      const d = new Date(date.getTime() + mins * 60000);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    let shouldChangeHall = false;
    let suggestHall: Hall | undefined;
    let reason = '';

    if (selectedHall.crowdLevel === 'high') {
      const altHall = hallList
        .filter(h => h.id !== selectedHall.id && h.crowdLevel !== 'high')
        .sort((a, b) => a.distance - b.distance)[0];
      if (altHall && altHall.waitTime < selectedHall.waitTime - 10) {
        shouldChangeHall = true;
        suggestHall = altHall;
        reason = `${selectedHall.name}当前拥挤度${getCrowdLevelText(selectedHall.crowdLevel)}，需等待${selectedHall.waitTime}分钟。${altHall.name}仅需${altHall.waitTime}分钟，节省约${selectedHall.waitTime - altHall.waitTime}分钟。`;
      }
    }

    if (waitMinutes > 30 && !shouldChangeHall) {
      reason = `当前等待时间较长（${waitMinutes}分钟），建议准备好材料后再出发，利用等候时间查看材料清单。`;
    }

    if (!reason) {
      reason = `当前${selectedHall.name}拥挤度${getCrowdLevelText(selectedHall.crowdLevel)}，等待时间适中，建议按预估时间出发。`;
    }

    const transportTips = [
      `🚶 步行约 ${Math.round(selectedHall.distance * 12)} 分钟`,
      `🚗 驾车约 ${travelMinutes} 分钟（不堵车）`,
      `🚌 公交约 ${Math.round(travelMinutes * 1.3)} 分钟`
    ];

    return {
      departTime: addMinutes(now, 0),
      arriveTime: addMinutes(now, travelMinutes),
      handleTime: addMinutes(now, travelMinutes + waitMinutes),
      finishTime: addMinutes(now, totalMinutes),
      totalMinutes,
      shouldChangeHall,
      suggestHall,
      reason,
      transportTips
    };
  }, [selectedHall, selectedService]);

  const hallRating = useMemo(() => {
    return getHallRatingFn(selectedHall.name);
  }, [selectedHall, getHallRatingFn]);

  const handleServiceClick = (service: ServiceItemType) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleShowAdvice = () => {
    if (!selectedService) return;
    setShowAdviceModal(true);
  };

  const handleGetNumber = async () => {
    if (!selectedService) return;
    if (travelAdvice?.shouldChangeHall) {
      Taro.showModal({
        title: '出行建议',
        content: travelAdvice.reason + `\n\n是否仍要在${selectedHall.name}取号？`,
        confirmText: '仍要取号',
        cancelText: '换分中心',
        success: (res) => {
          if (res.cancel && travelAdvice.suggestHall) {
            setSelectedHall(travelAdvice.suggestHall);
            Taro.showToast({ title: '已切换分中心', icon: 'success' });
            return;
          }
          doGetNumber();
        }
      });
      return;
    }
    doGetNumber();
  };

  const doGetNumber = () => {
    if (!selectedService) return;

    const waitCount = Math.max(3, Math.floor(selectedHall.waitCount / 3));
    const newQueue: QueueRecord = {
      id: generateId(),
      queueNumber: generateQueueNumber('A'),
      serviceName: selectedService.name,
      hallId: selectedHall.id,
      hallName: selectedHall.name,
      status: 'waiting',
      waitCount,
      estimatedWaitTime: selectedHall.waitTime,
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      isCurrent: true
    };

    addQueue(newQueue);
    setShowModal(false);
    setShowAdviceModal(false);

    Taro.showToast({
      title: '取号成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      Taro.switchTab({ url: '/pages/progress/index' });
    }, 1500);
  };

  const handleHallSelect = (hall: Hall) => {
    setSelectedHall(hall);
    setShowHallPicker(false);
  };

  const handleSwitchSuggestHall = () => {
    if (travelAdvice?.suggestHall) {
      setSelectedHall(travelAdvice.suggestHall);
      Taro.showToast({ title: '已切换分中心', icon: 'success' });
    }
  };

  const getServiceIcon = (categoryId: string) => {
    const iconMap: Record<string, string> = {
      social: '💳',
      house: '🏠',
      id: '🪪',
      tax: '💰',
      civil: '💒',
      medical: '🏥',
      traffic: '🚗',
      education: '🎓'
    };
    return iconMap[categoryId] || '📋';
  };

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 4.5) return '#00b42a';
    if (rating >= 3.5) return '#165dff';
    if (rating >= 2.5) return '#ff7d00';
    return '#f53f3f';
  };

  return (
    <ScrollView className={classnames(styles.page, elderMode && styles.elderMode)} scrollY>
      <View className={styles.hallSelector} onClick={() => setShowHallPicker(true)}>
        <Text className={styles.hallLabel}>办理大厅：</Text>
        <Text className={styles.hallName}>{selectedHall.name}</Text>
        <Text className={styles.hallArrow}>▼</Text>
      </View>

      {selectedHall && (
        <View className={styles.hallAdviceBar}>
          <View className={styles.hallAdviceRow}>
            <Text className={styles.hallAdviceLabel}>📍 {selectedHall.address}</Text>
            <Text className={styles.hallAdviceLabel}>距离 {selectedHall.distance}km</Text>
          </View>
          <View className={styles.hallAdviceRow}>
            <View className={styles.adviceCrowd}>
              <Text className={styles.adviceCrowdLabel}>拥挤度</Text>
              <Text
                className={classnames(styles.adviceCrowdValue, styles[selectedHall.crowdLevel])}
              >
                {getCrowdLevelText(selectedHall.crowdLevel)}
              </Text>
            </View>
            <View className={styles.adviceCrowd}>
              <Text className={styles.adviceCrowdLabel}>预计等</Text>
              <Text className={styles.adviceCrowdValue}>{selectedHall.waitTime}分</Text>
            </View>
            {hallRating.totalCount > 0 ? (
              <View className={styles.adviceCrowd}>
                <Text className={styles.adviceCrowdLabel}>满意度</Text>
                <Text
                  className={styles.adviceCrowdValue}
                  style={{ color: getSatisfactionColor(hallRating.avgRating) }}
                >
                  ⭐ {hallRating.avgRating}
                </Text>
              </View>
            ) : (
              <View className={styles.adviceCrowd}>
                <Text className={styles.adviceCrowdLabel}>满意度</Text>
                <Text className={styles.adviceCrowdValue} style={{ color: '#86909c' }}>
                  暂无评价
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View className={styles.searchBar}>
        <View className={styles.searchInputWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索办事事项"
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            confirmType="search"
          />
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.categoryTabs}>
          <View
            className={classnames(styles.categoryTab, !selectedCategory && styles.active)}
            onClick={() => setSelectedCategory(null)}
          >
            全部
          </View>
          {serviceCategories.map(cat => (
            <View
              key={cat.id}
              className={classnames(styles.categoryTab, selectedCategory === cat.id && styles.active)}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </View>
          ))}
        </View>

        <View className={styles.serviceList}>
          {filteredServices.map(service => (
            <View
              key={service.id}
              className={styles.serviceItem}
              onClick={() => handleServiceClick(service)}
            >
              <View className={styles.serviceIcon}>
                {getServiceIcon(service.categoryId)}
              </View>
              <View className={styles.serviceInfo}>
                <Text className={styles.serviceName}>{service.name}</Text>
                <View className={styles.serviceDesc}>
                  {service.onlineReview && (
                    <Text className={styles.onlineBadge}>支持线上预审</Text>
                  )}
                  <Text className={styles.timeText}>约{service.estimatedTime}分钟</Text>
                </View>
              </View>
              <Text className={styles.serviceArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>

      {showModal && selectedService && (
        <View className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>{selectedService.name}</Text>

            <View className={styles.modalSection}>
              <Text className={styles.modalSectionTitle}>到厅预估</Text>
              <View className={styles.adviceTimeline}>
                <View className={styles.adviceTimelineItem}>
                  <Text className={styles.adviceTimelineIcon}>🚶</Text>
                  <View className={styles.adviceTimelineBody}>
                    <Text className={styles.adviceTimelineLabel}>现在出发</Text>
                    <Text className={styles.adviceTimelineTime}>{travelAdvice?.departTime}</Text>
                  </View>
                </View>
                <View className={styles.adviceTimelineItem}>
                  <Text className={styles.adviceTimelineIcon}>📍</Text>
                  <View className={styles.adviceTimelineBody}>
                    <Text className={styles.adviceTimelineLabel}>到达{selectedHall.name}</Text>
                    <Text className={styles.adviceTimelineTime}>{travelAdvice?.arriveTime}</Text>
                  </View>
                </View>
                <View className={styles.adviceTimelineItem}>
                  <Text className={styles.adviceTimelineIcon}>🔔</Text>
                  <View className={styles.adviceTimelineBody}>
                    <Text className={styles.adviceTimelineLabel}>预计叫号开始办理</Text>
                    <Text className={styles.adviceTimelineTime}>{travelAdvice?.handleTime}</Text>
                  </View>
                </View>
                <View className={styles.adviceTimelineItem}>
                  <Text className={styles.adviceTimelineIcon}>✅</Text>
                  <View className={styles.adviceTimelineBody}>
                    <Text className={styles.adviceTimelineLabel}>办结离开</Text>
                    <Text className={styles.adviceTimelineTime}>{travelAdvice?.finishTime}</Text>
                  </View>
                </View>
              </View>

              <View className={classnames(
                styles.adviceBanner,
                travelAdvice?.shouldChangeHall ? styles.adviceWarn : styles.adviceInfo
              )}>
                <Text className={styles.adviceBannerText}>{travelAdvice?.reason}</Text>
              </View>

              <Text
                className={styles.viewMoreAdvice}
                onClick={handleShowAdvice}
              >
                查看完整出行建议 →
              </Text>
            </View>

            <View className={styles.modalSection}>
              <Text className={styles.modalSectionTitle}>办理信息</Text>
              <View className={styles.modalInfoRow}>
                <Text className={styles.infoLabel}>办理大厅</Text>
                <Text className={styles.infoValue}>{selectedHall.name}</Text>
              </View>
              <View className={styles.modalInfoRow}>
                <Text className={styles.infoLabel}>预计时长</Text>
                <Text className={styles.infoValue}>{selectedService.estimatedTime}分钟</Text>
              </View>
              <View className={styles.modalInfoRow}>
                <Text className={styles.infoLabel}>线上预审</Text>
                <Text className={styles.infoValue} style={{ color: selectedService.onlineReview ? '#00b42a' : '#86909c' }}>
                  {selectedService.onlineReview ? '支持' : '不支持'}
                </Text>
              </View>
              <View className={styles.modalInfoRow}>
                <Text className={styles.infoLabel}>总需时间</Text>
                <Text className={styles.infoValue} style={{ color: '#165dff' }}>
                  约{travelAdvice?.totalMinutes}分钟（出行+等候+办理）
                </Text>
              </View>
            </View>

            <View className={styles.modalSection}>
              <Text className={styles.modalSectionTitle}>所需材料</Text>
              <View className={styles.materialList}>
                {selectedService.requiredMaterials.map((material, index) => (
                  <View key={index} className={styles.materialItem}>
                    <Text className={styles.materialIcon}>✓</Text>
                    <Text>{material}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modalActions}>
              <Button
                className={classnames(styles.modalBtn, styles.btnCancel)}
                onClick={() => setShowModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.btnConfirm)}
                onClick={handleGetNumber}
              >
                立即取号
              </Button>
            </View>
          </View>
        </View>
      )}

      {showAdviceModal && travelAdvice && selectedService && (
        <View className={styles.modalOverlay} onClick={() => setShowAdviceModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>出行建议</Text>

            <View className={styles.modalSection}>
              <Text className={styles.modalSectionTitle}>时间规划</Text>
              <View className={styles.adviceSummaryCard}>
                <View className={styles.adviceSummaryMain}>
                  <Text className={styles.adviceSummaryValue}>{travelAdvice.totalMinutes}</Text>
                  <Text className={styles.adviceSummaryUnit}>分钟</Text>
                </View>
                <Text className={styles.adviceSummaryLabel}>总预计耗时（出行+等候+办理）</Text>
              </View>
              <View className={styles.adviceDetailGrid}>
                <View className={styles.adviceDetailItem}>
                  <Text className={styles.adviceDetailValue}>{selectedHall.distance}km</Text>
                  <Text className={styles.adviceDetailLabel}>路程距离</Text>
                </View>
                <View className={styles.adviceDetailItem}>
                  <Text className={styles.adviceDetailValue}>{selectedHall.waitTime}分</Text>
                  <Text className={styles.adviceDetailLabel}>预计等候</Text>
                </View>
                <View className={styles.adviceDetailItem}>
                  <Text className={styles.adviceDetailValue}>{selectedService.estimatedTime}分</Text>
                  <Text className={styles.adviceDetailLabel}>办理时长</Text>
                </View>
              </View>
            </View>

            <View className={styles.modalSection}>
              <Text className={styles.modalSectionTitle}>交通方式</Text>
              {travelAdvice.transportTips.map((tip, idx) => (
                <Text key={idx} className={styles.transportTip}>{tip}</Text>
              ))}
            </View>

            {travelAdvice.shouldChangeHall && travelAdvice.suggestHall && (
              <View className={styles.modalSection}>
                <View className={styles.suggestHallCard}>
                  <Text className={styles.suggestHallTitle}>💡 推荐换至</Text>
                  <Text className={styles.suggestHallName}>{travelAdvice.suggestHall.name}</Text>
                  <Text className={styles.suggestHallInfo}>
                    距离{travelAdvice.suggestHall.distance}km · 仅需等待{travelAdvice.suggestHall.waitTime}分钟
                  </Text>
                  <Button
                    className={styles.switchHallBtn}
                    onClick={handleSwitchSuggestHall}
                  >
                    一键切换到此大厅
                  </Button>
                </View>
              </View>
            )}

            <View className={styles.modalSection}>
              <Text className={styles.modalSectionTitle}>温馨提示</Text>
              <Text className={styles.tipText}>1. 建议按预估出发时间提前10分钟出门，预留缓冲</Text>
              <Text className={styles.tipText}>2. 临近叫号前3位会收到提醒，请留意消息</Text>
              <Text className={styles.tipText}>3. 带齐所需材料可节省办理时间</Text>
              {selectedService.onlineReview && (
                <Text className={styles.tipText}>4. 本事项支持线上预审，可提前上传材料</Text>
              )}
            </View>

            <View className={styles.modalActions}>
              <Button
                className={classnames(styles.modalBtn, styles.btnCancel)}
                onClick={() => setShowAdviceModal(false)}
              >
                返回
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.btnConfirm)}
                onClick={handleGetNumber}
              >
                立即取号
              </Button>
            </View>
          </View>
        </View>
      )}

      {showHallPicker && (
        <View className={styles.modalOverlay} onClick={() => setShowHallPicker(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>选择办理大厅</Text>
            {hallList.map(hall => (
              <View
                key={hall.id}
                className={styles.hallPickerItem}
                onClick={() => handleHallSelect(hall)}
              >
                <View className={styles.hallPickerMain}>
                  <Text className={styles.hallPickerName}>{hall.name}</Text>
                  <Text className={styles.hallPickerAddr}>{hall.address}</Text>
                  <View className={styles.hallPickerStats}>
                    <Text
                      className={classnames(
                        styles.hallPickerCrowd,
                        styles[hall.crowdLevel]
                      )}
                    >
                      {getCrowdLevelText(hall.crowdLevel)}
                    </Text>
                    <Text className={styles.hallPickerWait}>等{hall.waitTime}分</Text>
                    <Text className={styles.hallPickerDist}>距{hall.distance}km</Text>
                  </View>
                </View>
                {selectedHall.id === hall.id && (
                  <Text style={{ color: '#165dff', fontWeight: 600, fontSize: 40 }}>✓</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default QueuePage;
