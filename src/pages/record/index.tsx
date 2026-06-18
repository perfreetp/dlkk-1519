import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { queueHistoryMock } from '@/data/queue';
import { ServiceRecord } from '@/types';
import RecordItem from '@/components/RecordItem';
import styles from './index.module.scss';

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'completed', label: '已办结' },
  { key: 'incomplete', label: '办理中' }
];

const RecordPage: React.FC = () => {
  const {
    elderMode,
    toggleElderMode,
    voiceMode,
    toggleVoiceMode,
    saveRating,
    getRating,
    speak,
    voiceSupport
  } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRecord, setRatingRecord] = useState<ServiceRecord | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const records: ServiceRecord[] = useMemo(() => {
    return queueHistoryMock.map(q => {
      const savedRating = getRating(q.id);
      return {
        id: q.id,
        serviceName: q.serviceName,
        hallName: q.hallName,
        date: q.createTime.split(' ')[0],
        status: q.status === 'completed' ? 'completed' : 'incomplete',
        queueNumber: q.queueNumber,
        rating: savedRating?.rating,
        comment: savedRating?.comment
      };
    });
  }, [getRating]);

  const filteredRecords = activeFilter === 'all'
    ? records
    : records.filter(r => r.status === activeFilter);

  const handleRate = (record: ServiceRecord) => {
    setRatingRecord(record);
    const existing = getRating(record.id);
    setRating(existing?.rating || 0);
    setComment(existing?.comment || '');
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      Taro.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      return;
    }
    if (!ratingRecord) return;

    saveRating(ratingRecord.id, rating, comment);
    if (voiceMode) {
      speak('评价提交成功');
    }
    Taro.showToast({
      title: '评价成功',
      icon: 'success'
    });
    setShowRatingModal(false);
  };

  const handleToggleElder = () => {
    toggleElderMode();
  };

  const handleToggleVoice = () => {
    if (!voiceSupport.supported && !voiceMode) {
      Taro.showModal({
        title: '语音播报不可用',
        content: `当前运行平台：${voiceSupport.platform}\n\n原因：${voiceSupport.reason || '未检测到语音合成能力'}\n\n您仍可以开启该选项，在支持的平台（如Chrome浏览器、微信小程序接入TTS后）会自动生效。`,
        confirmText: '仍然开启',
        cancelText: '取消'
      });
    }
    toggleVoiceMode();
  };

  const stats = {
    total: records.length,
    completed: records.filter(r => r.status === 'completed').length,
    avgWait: '15分'
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <View style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Text
            key={i}
            style={{
              fontSize: elderMode ? 32 : 28,
              color: i <= rating ? '#ff7d00' : '#c9cdd4'
            }}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      className={classnames(styles.page, elderMode && styles.elderMode)}
      scrollY
    >
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userText}>
            <Text className={styles.userName}>市民您好</Text>
            <Text className={styles.userId}>已实名验证</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>累计办件</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已办结</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.avgWait}</Text>
            <Text className={styles.statLabel}>平均等候</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>便捷设置</Text>
          <View className={styles.settingList}>
            <View className={styles.settingItem}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>🔍</Text>
                <View>
                  <Text className={styles.settingText}>大字模式</Text>
                  <Text className={styles.settingDesc}>适老化字体放大，界面更清晰</Text>
                </View>
              </View>
              <View
                className={classnames(styles.switch, elderMode && styles.active)}
                onClick={handleToggleElder}
              />
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>🔊</Text>
                <View>
                  <Text className={styles.settingText}>语音播报</Text>
                  <Text className={styles.settingDesc}>
                    叫号提醒、操作反馈语音播报
                    {!voiceSupport.supported && (
                      <Text className={styles.voiceWarn}>
                        {' '}（当前平台不支持）
                      </Text>
                    )}
                  </Text>
                </View>
              </View>
              <View
                className={classnames(styles.switch, voiceMode && styles.active, !voiceSupport.supported && styles.switchDisabled)}
                onClick={handleToggleVoice}
              />
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>📍</Text>
                <View>
                  <Text className={styles.settingText}>常用大厅</Text>
                  <Text className={styles.settingDesc}>设置常去的办事大厅</Text>
                </View>
              </View>
              <View className={styles.settingRight}>
                <Text className={styles.settingHint}>市政务服务中心</Text>
                <Text className={styles.settingArrow}>›</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>办事记录</Text>
          <View className={styles.filterTabs}>
            {filterOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.filterTab, activeFilter === opt.key && styles.active)}
                onClick={() => setActiveFilter(opt.key)}
              >
                {opt.label}
              </View>
            ))}
          </View>

          <View className={styles.recordList}>
            {filteredRecords.map(record => {
              const savedRating = getRating(record.id);
              return (
                <View key={record.id} className={styles.recordCard}>
                  <View className={styles.recordHeader}>
                    <Text className={styles.recordService}>{record.serviceName}</Text>
                    <Text
                      className={classnames(
                        styles.recordStatus,
                        record.status === 'completed' ? styles.statusCompleted : styles.statusIncomplete
                      )}
                    >
                      {record.status === 'completed' ? '已办结' : '未办结'}
                    </Text>
                  </View>
                  <View className={styles.recordInfo}>
                    <Text className={styles.recordHall}>📍 {record.hallName}</Text>
                    <Text className={styles.recordQueue}>号：{record.queueNumber}</Text>
                  </View>
                  {savedRating && (
                    <View className={styles.recordRating}>
                      {renderStars(savedRating.rating)}
                      {savedRating.comment && (
                        <Text className={styles.recordComment}>{savedRating.comment}</Text>
                      )}
                    </View>
                  )}
                  <View className={styles.recordFooter}>
                    <Text className={styles.recordDate}>{record.date}</Text>
                    {record.status === 'completed' && !savedRating && (
                      <Button className={styles.rateBtn} onClick={() => handleRate(record)}>
                        去评价
                      </Button>
                    )}
                    {record.status === 'completed' && savedRating && (
                      <Button className={styles.rateBtn} onClick={() => handleRate(record)}>
                        修改评价
                      </Button>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {filteredRecords.length === 0 && (
            <View className={styles.emptyText}>暂无相关记录</View>
          )}

          {filteredRecords.length > 0 && (
            <View className={styles.moreLink}>查看更多记录 ›</View>
          )}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>更多服务</Text>
          <View className={styles.settingList}>
            <View className={styles.settingItem}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>📞</Text>
                <Text className={styles.settingText}>联系客服</Text>
              </View>
              <Text className={styles.settingArrow}>›</Text>
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>❓</Text>
                <Text className={styles.settingText}>常见问题</Text>
              </View>
              <Text className={styles.settingArrow}>›</Text>
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>ℹ️</Text>
                <Text className={styles.settingText}>关于我们</Text>
              </View>
              <Text className={styles.settingArrow}>›</Text>
            </View>
          </View>
        </View>
      </View>

      {showRatingModal && ratingRecord && (
        <View className={styles.ratingModal} onClick={() => setShowRatingModal(false)}>
          <View
            className={classnames(styles.ratingContent, elderMode && styles.elderContent)}
            onClick={(e) => e.stopPropagation()}
          >
            <Text className={styles.ratingTitle}>服务评价</Text>

            <Text className={styles.ratingService}>
              {ratingRecord.serviceName}
            </Text>

            <View className={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Text
                  key={star}
                  className={classnames(styles.star, rating >= star && styles.starActive)}
                  onClick={() => setRating(star)}
                >
                  ★
                </Text>
              ))}
            </View>

            <View className={styles.ratingLabels}>
              <Text className={styles.ratingLabelText}>
                {rating === 1 && '非常不满意'}
                {rating === 2 && '不满意'}
                {rating === 3 && '一般'}
                {rating === 4 && '满意'}
                {rating === 5 && '非常满意'}
                {rating === 0 && '请点击星星评分'}
              </Text>
            </View>

            <Textarea
              className={styles.ratingTextarea}
              placeholder="请输入您的评价和建议（选填）"
              value={comment}
              onInput={(e) => setComment(e.detail.value)}
              maxlength={200}
            />

            <View className={styles.ratingActions}>
              <Button
                className={classnames(styles.ratingBtn, styles.btnCancel)}
                onClick={() => setShowRatingModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.ratingBtn, styles.btnSubmit)}
                onClick={handleSubmitRating}
              >
                提交评价
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RecordPage;
