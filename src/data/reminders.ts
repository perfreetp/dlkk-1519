import { Reminder } from '@/types';

export const reminderList: Reminder[] = [
  {
    id: 'rem-1',
    type: 'call',
    title: '叫号提醒',
    content: '您的号码 A023 前方还有3人，预计10分钟后叫号，请做好准备',
    time: '10分钟前',
    read: false,
    relatedQueueId: 'queue-001'
  },
  {
    id: 'rem-2',
    type: 'material',
    title: '材料提醒',
    content: '办理社保卡申领请携带：身份证原件、一寸白底照片、户口本',
    time: '30分钟前',
    read: false,
    relatedQueueId: 'queue-001'
  },
  {
    id: 'rem-3',
    type: 'tide',
    title: '潮汐窗口通知',
    content: '市政务服务中心新增2个潮汐窗口已开放，可办理社保卡、医保业务',
    time: '1小时前',
    read: true
  },
  {
    id: 'rem-4',
    type: 'system',
    title: '系统通知',
    content: '本周六政务服务中心延时服务时间调整为9:00-16:00',
    time: '昨天',
    read: true
  },
  {
    id: 'rem-5',
    type: 'call',
    title: '叫号提醒',
    content: '您的号码 B056 即将叫号，请前往5号窗口办理',
    time: '5天前',
    read: true,
    relatedQueueId: 'queue-h-1'
  }
];
