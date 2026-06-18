import React, { useState } from 'react';
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
  const { elderMode, toggleElderMode, voiceMode, toggleVoiceMode } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRecord, setRatingRecord] = useState<ServiceRecord | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const records: ServiceRecord[] = queueHistoryMock.map(q => ({
    id: q.id,
    serviceName: q.serviceName,
    hallName: q.hallName,
    date: q.createTime.split(' ')[0],
    status: q.status === 'completed' ? 'completed' : 'incomplete',
    queueNumber: q.queueNumber,
    rating: q.status === 'completed' && q.id !== 'queue-h-2' ? Math.floor(Math.random() * 3) + 3 : undefined
  }));

  const filteredRecords = activeFilter === 'all'
    ? records
    : records.filter(r => r.status === activeFilter);

  const handleRate = (record: ServiceRecord) => {
    setRatingRecord(record);
    setRating(0);
    setComment('');
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
    Taro.showToast({
      title: '评价成功',
      icon: 'success'
    });
    setShowRatingModal(false);
  };

  const stats = {
    total: records.length,
    completed: records.filter(r => r.status === 'completed').length,
    avgWait: '15分'
  };

  return (
    <ScrollView className={styles.page} scrollY>
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
                  <Text className={styles.settingDesc}>适老化字体放大</Text>
                </View>
              </View>
              <View
                className={classnames(styles.switch, elderMode && styles.active)}
                onClick={toggleElderMode}
              />
            </View>
            <View className={styles.settingItem}>
              <View className={styles.settingLeft}>
                <Text className={styles.settingIcon}>🔊</Text>
                <View>
                  <Text className={styles.settingText}>语音播报</Text>
                  <Text className={styles.settingDesc}>叫号语音提醒</Text>
                </View>
              </View>
              <View
                className={classnames(styles.switch, voiceMode && styles.active)}
                onClick={toggleVoiceMode}
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
                <Text style={{ color: '#86909c', fontSize: 24 }}>市政务服务中心</Text>
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
            {filteredRecords.map(record => (
              <RecordItem
                key={record.id}
                record={record}
                onRate={() => handleRate(record)}
              />
            ))}
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

      {showRatingModal && (
        <View className={styles.ratingModal} onClick={() => setShowRatingModal(false)}>
          <View className={styles.ratingContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.ratingTitle}>服务评价</Text>

            <Text style={{ textAlign: 'center', marginBottom: 24, color: '#4e5969' }}>
              {ratingRecord?.serviceName}
            </Text>

            <View className={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Text
                  key={star}
                  className={classnames(styles.star, rating >= star && styles.active)}
                  onClick={() => setRating(star)}
                >
                  ★
                </Text>
              ))}
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
