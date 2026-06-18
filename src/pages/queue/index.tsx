import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { hallList, getNearbyHall } from '@/data/halls';
import { serviceCategories, serviceList } from '@/data/services';
import { ServiceItem as ServiceItemType, QueueRecord } from '@/types';
import { generateQueueNumber, generateId } from '@/utils';
import styles from './index.module.scss';

const QueuePage: React.FC = () => {
  const { addQueue, elderMode } = useAppStore();
  const [selectedHall, setSelectedHall] = useState(getNearbyHall() || hallList[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItemType | null>(null);
  const [showHallPicker, setShowHallPicker] = useState(false);

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

  const handleServiceClick = (service: ServiceItemType) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleGetNumber = () => {
    if (!selectedService) return;

    const newQueue: QueueRecord = {
      id: generateId(),
      queueNumber: generateQueueNumber('A'),
      serviceName: selectedService.name,
      hallId: selectedHall.id,
      hallName: selectedHall.name,
      status: 'waiting',
      waitCount: Math.floor(Math.random() * 15) + 3,
      estimatedWaitTime: Math.floor(Math.random() * 30) + 10,
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      isCurrent: true
    };

    addQueue(newQueue);
    setShowModal(false);

    Taro.showToast({
      title: '取号成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      Taro.switchTab({ url: '/pages/progress/index' });
    }, 1500);
  };

  const handleHallSelect = (hall: typeof hallList[0]) => {
    setSelectedHall(hall);
    setShowHallPicker(false);
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

  return (
    <ScrollView className={classnames(styles.page, elderMode && styles.elderMode)} scrollY>
      <View className={styles.hallSelector} onClick={() => setShowHallPicker(true)}>
        <Text className={styles.hallLabel}>办理大厅：</Text>
        <Text className={styles.hallName}>{selectedHall.name}</Text>
        <Text className={styles.hallArrow}>▼</Text>
      </View>

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

      {showHallPicker && (
        <View className={styles.modalOverlay} onClick={() => setShowHallPicker(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>选择办理大厅</Text>
            {hallList.map(hall => (
              <View
                key={hall.id}
                className={styles.serviceItem}
                onClick={() => handleHallSelect(hall)}
              >
                <View className={styles.serviceInfo}>
                  <Text className={styles.serviceName}>{hall.name}</Text>
                  <View className={styles.serviceDesc}>
                    <Text className={styles.timeText}>{hall.address}</Text>
                  </View>
                </View>
                {selectedHall.id === hall.id && (
                  <Text style={{ color: '#165dff', fontWeight: 600 }}>✓</Text>
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
