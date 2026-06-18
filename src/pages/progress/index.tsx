import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { serviceList } from '@/data/services';
import { getStatusText } from '@/utils';
import styles from './index.module.scss';

const ProgressPage: React.FC = () => {
  const { currentQueue, requeue, elderMode, voiceMode, toggleVoiceMode } = useAppStore();
  const [callReminder, setCallReminder] = useState(true);
  const [materialReminder, setMaterialReminder] = useState(true);

  const currentService = serviceList.find(s => s.name === currentQueue?.serviceName);

  const handleRequeue = () => {
    if (!currentQueue) return;
    Taro.showModal({
      title: '申请重排',
      content: '过号后可申请一次重新排队，是否确认申请？',
      confirmText: '确认申请',
      confirmColor: '#165dff',
      success: (res) => {
        if (res.confirm) {
          requeue(currentQueue.id);
          Taro.showToast({
            title: '重排成功',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleCancelQueue = () => {
    Taro.showModal({
      title: '取消取号',
      content: '确定要取消当前排队号码吗？',
      confirmText: '取消取号',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '已取消',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleGoQueue = () => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  if (!currentQueue) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎫</Text>
          <Text className={styles.emptyTitle}>暂无排队中</Text>
          <Text className={styles.emptyDesc}>取号后可在此查看排队进度</Text>
          <Button className={styles.emptyBtn} onClick={handleGoQueue}>
            立即取号
          </Button>
        </View>
      </ScrollView>
    );
  }

  const isMissed = currentQueue.status === 'missed';
  const isWaiting = currentQueue.status === 'waiting' || currentQueue.status === 'requeued';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.content}>
        <View className={styles.queueCard}>
          <View className={styles.queueHeader}>
            <Text className={styles.serviceName}>{currentQueue.serviceName}</Text>
            <Text className={classnames(styles.statusBadge, styles[currentQueue.status])}>
              {getStatusText(currentQueue.status)}
            </Text>
          </View>

          <View className={styles.queueNumber}>
            <Text className={styles.numberLabel}>您的排队号</Text>
            <View className={styles.numberValue}>{currentQueue.queueNumber}</View>
          </View>

          <View className={styles.queueStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{currentQueue.waitCount}</Text>
              <Text className={styles.statLabel}>前方等待</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{currentQueue.estimatedWaitTime}分</Text>
              <Text className={styles.statLabel}>预计等待</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{currentQueue.windowNumber || '--'}</Text>
              <Text className={styles.statLabel}>办理窗口</Text>
            </View>
          </View>

          <View className={styles.queueInfo}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>办理大厅</Text>
              <Text className={styles.infoValue}>{currentQueue.hallName}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>取号时间</Text>
              <Text className={styles.infoValue}>{currentQueue.createTime.split(' ')[1]}</Text>
            </View>
          </View>
        </View>

        {isMissed && (
          <View className={styles.tipBox}>
            <Text className={styles.tipIcon}>⚠️</Text>
            <Text className={styles.tipText}>
              您已过号，可申请一次重新排队。重排后号码将优先安排，请留意叫号提醒。
            </Text>
          </View>
        )}

        {currentService && (
          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📋</Text>
              <Text>所需材料</Text>
            </View>
            <View className={styles.materialList}>
              {currentService.requiredMaterials.map((material, index) => (
                <View key={index} className={styles.materialItem}>
                  <View className={styles.materialCheck}>✓</View>
                  <Text>{material}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🔔</Text>
            <Text>提醒设置</Text>
          </View>
          <View className={styles.reminderSettings}>
            <View>
              <Text className={styles.reminderText}>临近叫号提醒</Text>
              <Text className={styles.reminderDesc}>前方还有3人时提醒您</Text>
            </View>
            <View
              className={classnames(styles.switch, callReminder && styles.active)}
              onClick={() => setCallReminder(!callReminder)}
            />
          </View>
          <View className={styles.reminderSettings}>
            <View>
              <Text className={styles.reminderText}>语音播报</Text>
              <Text className={styles.reminderDesc}>叫号时语音播报号码</Text>
            </View>
            <View
              className={classnames(styles.switch, voiceMode && styles.active)}
              onClick={toggleVoiceMode}
            />
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        {isMissed ? (
          <>
            <Button className={classnames(styles.actionBtn, styles.btnSecondary)}>
              返回大厅
            </Button>
            <Button
              className={classnames(styles.actionBtn, styles.btnPrimary)}
              onClick={handleRequeue}
            >
              申请重排
            </Button>
          </>
        ) : isWaiting ? (
          <>
            <Button
              className={classnames(styles.actionBtn, styles.btnSecondary)}
              onClick={handleCancelQueue}
            >
              取消取号
            </Button>
            <Button className={classnames(styles.actionBtn, styles.btnPrimary)}>
              导航到大厅
            </Button>
          </>
        ) : (
          <Button
            className={classnames(styles.actionBtn, styles.btnPrimary)}
            onClick={handleGoQueue}
          >
            再次取号
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default ProgressPage;
