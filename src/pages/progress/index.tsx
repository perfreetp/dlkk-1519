import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { serviceList } from '@/data/services';
import { hallList } from '@/data/halls';
import { getStatusText } from '@/utils';
import styles from './index.module.scss';

const ProgressPage: React.FC = () => {
  const {
    currentQueue,
    requeue,
    cancelCurrentQueue,
    voiceMode,
    toggleVoiceMode,
    elderMode,
    speak,
    voiceSupport
  } = useAppStore();
  const [callReminder, setCallReminder] = useState(true);

  const currentService = serviceList.find(s => s.name === currentQueue?.serviceName);
  const currentHall = hallList.find(h => h.id === currentQueue?.hallId);

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
      content: '确定要取消当前排队号码吗？取消后需要重新取号。',
      confirmText: '取消取号',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          cancelCurrentQueue();
          if (voiceMode) {
            speak('已取消取号');
          }
          Taro.showToast({
            title: '已取消取号',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleGoQueue = () => {
    Taro.switchTab({ url: '/pages/queue/index' });
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  const handleNavigate = () => {
    if (!currentHall) {
      Taro.showModal({
        title: '无法导航',
        content: '未找到当前大厅信息，可能取号数据已失效，请返回首页重新取号。',
        showCancel: false,
        confirmText: '返回首页',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({ url: '/pages/home/index' });
          }
        }
      });
      return;
    }
    const missingInfo = [];
    if (!currentHall.latitude && currentHall.latitude !== 0) missingInfo.push('纬度');
    if (!currentHall.longitude && currentHall.longitude !== 0) missingInfo.push('经度');
    if (!currentHall.name) missingInfo.push('大厅名称');
    if (!currentHall.address) missingInfo.push('详细地址');

    if (missingInfo.length > 0) {
      Taro.showModal({
        title: '导航信息不完整',
        content: `当前大厅缺少以下导航信息：${missingInfo.join('、')}。\n\n您可以尝试：\n1. 复制地址后在地图App中手动搜索\n2. 返回首页查看大厅列表重新选择`,
        confirmText: '复制地址',
        cancelText: '返回首页',
        success: (res) => {
          if (res.confirm) {
            Taro.setClipboardData({
              data: `${currentHall.name} ${currentHall.address}`,
              success: () => {
                Taro.showToast({ title: '地址已复制', icon: 'success' });
              }
            });
          } else if (res.cancel) {
            Taro.switchTab({ url: '/pages/home/index' });
          }
        }
      });
      return;
    }

    Taro.showActionSheet({
      itemList: [
        `打开地图导航到${currentHall.name}`,
        `查看${currentHall.name}详情`,
        '复制大厅地址'
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          if (voiceMode) {
            speak(`正在为您导航到${currentHall.name}`);
          }
          Taro.openLocation({
            latitude: currentHall.latitude,
            longitude: currentHall.longitude,
            name: currentHall.name,
            address: currentHall.address,
            scale: 18,
            success: () => {
              console.log('打开地图成功');
            },
            fail: (err) => {
              console.error('打开地图失败', err);
              Taro.showModal({
                title: '打开地图失败',
                content: `当前平台不支持直接打开地图，您可以手动复制以下信息到地图App中搜索：\n\n【大厅名称】${currentHall.name}\n【详细地址】${currentHall.address}\n【经度】${currentHall.longitude}\n【纬度】${currentHall.latitude}`,
                confirmText: '复制全部',
                cancelText: '知道了',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    Taro.setClipboardData({
                      data: `【${currentHall.name}】\n地址：${currentHall.address}\n经度：${currentHall.longitude}\n纬度：${currentHall.latitude}`,
                      success: () => {
                        Taro.showToast({ title: '信息已复制', icon: 'success' });
                      }
                    });
                  }
                }
              });
            }
          });
        } else if (res.tapIndex === 1) {
          Taro.switchTab({ url: '/pages/home/index' });
        } else if (res.tapIndex === 2) {
          Taro.setClipboardData({
            data: `${currentHall.name} ${currentHall.address}`,
            success: () => {
              Taro.showToast({ title: '地址已复制', icon: 'success' });
            }
          });
        }
      }
    });
  };

  const handleBroadcast = () => {
    if (currentQueue) {
      const result = speak(`您的号码${currentQueue.queueNumber}，前方还有${currentQueue.waitCount}人等待`);
      if (!result.success) {
        Taro.showModal({
          title: '语音播报失败',
          content: `当前平台（${voiceSupport.platform}）无法播放语音：${result.reason || '未知原因'}\n\n建议：\n1. H5端请使用Chrome、Edge等现代浏览器\n2. 小程序端需接入语音合成TTS服务\n3. 检查设备音量是否开启`,
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    }
  };

  if (!currentQueue) {
    return (
      <ScrollView
        className={classnames(styles.page, elderMode && styles.elderMode)}
        scrollY
      >
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
    <ScrollView
      className={classnames(styles.page, elderMode && styles.elderMode)}
      scrollY
    >
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
              onClick={() => {
                setCallReminder(!callReminder);
                if (voiceMode && !callReminder) {
                  speak('已开启叫号提醒');
                }
              }}
            />
          </View>
          <View className={styles.reminderSettings}>
            <View>
              <Text className={styles.reminderText}>语音播报</Text>
              <Text className={styles.reminderDesc}>
                叫号时语音播报号码
                {!voiceSupport.supported && (
                  <Text className={styles.voiceWarn}>
                    {' '}（当前平台不支持）
                  </Text>
                )}
              </Text>
            </View>
            <View
              className={classnames(styles.switch, voiceMode && styles.active, !voiceSupport.supported && styles.disabled)}
              onClick={() => {
                if (!voiceSupport.supported && !voiceMode) {
                  Taro.showModal({
                    title: '语音播报不可用',
                    content: `当前运行平台：${voiceSupport.platform}\n\n原因：${voiceSupport.reason || '未检测到语音合成能力'}\n\n您仍可以开启该选项，在支持的平台（如Chrome浏览器、微信小程序接入TTS后）会自动生效。`,
                    confirmText: '仍然开启',
                    cancelText: '取消'
                  });
                }
                toggleVoiceMode();
              }}
            />
          </View>
          <View className={styles.reminderSettings}>
            <View>
              <Text className={styles.reminderText}>立即播报</Text>
              <Text className={styles.reminderDesc}>点击立即播报当前排队状态</Text>
            </View>
            <Button className={styles.broadcastBtn} onClick={handleBroadcast}>
              🔊 播报
            </Button>
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        {isMissed ? (
          <>
            <Button
              className={classnames(styles.actionBtn, styles.btnSecondary)}
              onClick={handleGoHome}
            >
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
            <Button
              className={classnames(styles.actionBtn, styles.btnPrimary)}
              onClick={handleNavigate}
            >
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
