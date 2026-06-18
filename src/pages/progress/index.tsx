import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore, formatDate } from '@/store/useAppStore';
import { QueueTimelineEvent } from '@/types';
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
    voiceSupport,
    getTimelineForQueue,
    simulateWaitProgress,
    simulateCallNumber,
    simulateMissed,
    simulateProcessing
  } = useAppStore();
  const [callReminder, setCallReminder] = useState(true);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  const currentService = serviceList.find(s => s.name === currentQueue?.serviceName);
  const currentHall = hallList.find(h => h.id === currentQueue?.hallId);

  const timeline = useMemo<QueueTimelineEvent[]>(() => {
    if (!currentQueue) return [];
    return getTimelineForQueue(currentQueue.id);
  }, [currentQueue, getTimelineForQueue]);

  const handleSimulateWait = () => {
    simulateWaitProgress();
    setShowSimulateMenu(false);
    Taro.showToast({ title: '前方-1人', icon: 'none' });
  };

  const handleSimulateCall = () => {
    simulateCallNumber();
    setShowSimulateMenu(false);
    Taro.showToast({ title: '即将叫号', icon: 'none' });
  };

  const handleSimulateMissed = () => {
    Taro.showModal({
      title: '模拟过号',
      content: '确定要模拟过号场景吗？过号后可申请重新排队。',
      success: (res) => {
        if (res.confirm) {
          simulateMissed();
          setShowSimulateMenu(false);
        }
      }
    });
  };

  const handleSimulateProcessing = () => {
    simulateProcessing();
    setShowSimulateMenu(false);
    Taro.showToast({ title: '开始办理', icon: 'none' });
  };

  const timelineIcon = (type: QueueTimelineEvent['type']) => {
    const iconMap = {
      queue: '🎫',
      wait: '⏳',
      calling: '🔔',
      processing: '💼',
      missed: '⚠️',
      requeued: '🔄',
      completed: '✅',
      info: 'ℹ️'
    };
    return iconMap[type];
  };

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
            speak('已取消取号').catch(() => {});
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
    const missingInfo: string[] = [];
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
            speak(`正在为您导航到${currentHall.name}`).catch(() => {});
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

  const handleBroadcast = async () => {
    if (currentQueue) {
      try {
        const result = await speak(`您的号码${currentQueue.queueNumber}，前方还有${currentQueue.waitCount}人等待`);
        if (!result.success) {
          Taro.showModal({
            title: '语音播报失败',
            content: `【当前平台】${voiceSupport.platform}\n【播报方式】${voiceSupport.method === 'webSpeech' ? '浏览器原生' : voiceSupport.method === 'tts' ? 'TTS云服务' : '无'}\n【失败原因】${result.reason || '未知原因'}\n\n排查建议：\n1. H5端请使用Chrome/Edge/Safari现代浏览器\n2. 小程序端请确保可访问tts.youdao.com\n3. 检查设备音量开关，解除静音模式\n4. 重启小程序/页面后重试`,
            showCancel: false,
            confirmText: '我知道了'
          });
        }
      } catch (e: any) {
        Taro.showModal({
          title: '语音播报异常',
          content: `播报过程中发生错误：${e?.message || JSON.stringify(e)}\n\n请稍后重试。`,
          showCancel: false,
          confirmText: '好的'
        });
      }
    }
  };

  const handleToggleVoice = async () => {
    const result = await toggleVoiceMode();
    if (!result.success && !voiceMode) {
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

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📊</Text>
              <Text>叫号进度</Text>
            </View>
            <Text className={styles.simulateBtn} onClick={() => setShowSimulateMenu(!showSimulateMenu)}>
              模拟变化 {showSimulateMenu ? '▲' : '▼'}
            </Text>
          </View>

          {showSimulateMenu && (
            <View className={styles.simulateMenu}>
              <View className={styles.simulateItem} onClick={handleSimulateWait}>
                <Text className={styles.simulateIcon}>⏳</Text>
                <View>
                  <Text className={styles.simulateTitle}>前方减少1人</Text>
                  <Text className={styles.simulateDesc}>模拟叫号推进</Text>
                </View>
              </View>
              <View className={styles.simulateItem} onClick={handleSimulateCall}>
                <Text className={styles.simulateIcon}>🔔</Text>
                <View>
                  <Text className={styles.simulateTitle}>即将叫号</Text>
                  <Text className={styles.simulateDesc}>触发叫号提醒</Text>
                </View>
              </View>
              <View className={styles.simulateItem} onClick={handleSimulateMissed}>
                <Text className={styles.simulateIcon}>⚠️</Text>
                <View>
                  <Text className={styles.simulateTitle}>过号</Text>
                  <Text className={styles.simulateDesc}>模拟错过叫号</Text>
                </View>
              </View>
              <View className={styles.simulateItem} onClick={handleSimulateProcessing}>
                <Text className={styles.simulateIcon}>💼</Text>
                <View>
                  <Text className={styles.simulateTitle}>开始办理</Text>
                  <Text className={styles.simulateDesc}>进入办理中状态</Text>
                </View>
              </View>
            </View>
          )}

          {timeline.length === 0 ? (
            <View className={styles.emptyTimeline}>
              <Text className={styles.emptyTimelineIcon}>🕰️</Text>
              <Text className={styles.emptyTimelineText}>暂无叫号变化记录</Text>
              <Text className={styles.emptyTimelineHint}>取号后每次叫号变化都会记录在这里</Text>
            </View>
          ) : (
            <View className={styles.timeline}>
              {timeline.map((event, idx) => (
                <View
                  key={event.id}
                  className={classnames(
                    styles.timelineItem,
                    idx === timeline.length - 1 && styles.timelineLast
                  )}
                >
                  <View className={styles.timelineDot}>
                    <Text className={styles.timelineIcon}>{timelineIcon(event.type)}</Text>
                  </View>
                  {idx < timeline.length - 1 && <View className={styles.timelineLine} />}
                  <View className={styles.timelineContent}>
                    <View className={styles.timelineHead}>
                      <Text className={styles.timelineTitle}>{event.title}</Text>
                      <Text className={styles.timelineTime}>
                        {formatDate(event.time)}
                      </Text>
                    </View>
                    {event.description && (
                      <Text className={styles.timelineDesc}>{event.description}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

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
                  speak('已开启叫号提醒').catch(() => {});
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
              onClick={handleToggleVoice}
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
