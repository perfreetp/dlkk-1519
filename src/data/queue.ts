import { QueueRecord } from '@/types';

export const currentQueueMock: QueueRecord = {
  id: 'queue-001',
  queueNumber: 'A023',
  serviceName: '社保卡申领',
  hallId: 'hall-1',
  hallName: '市政务服务中心',
  windowNumber: undefined,
  status: 'waiting',
  waitCount: 8,
  estimatedWaitTime: 25,
  createTime: '2024-01-15 09:30:00',
  isCurrent: true
};

export const queueHistoryMock: QueueRecord[] = [
  {
    id: 'queue-h-1',
    queueNumber: 'B056',
    serviceName: '公积金提取',
    hallId: 'hall-1',
    hallName: '市政务服务中心',
    windowNumber: '5号窗',
    status: 'completed',
    waitCount: 0,
    estimatedWaitTime: 0,
    createTime: '2024-01-10 14:20:00',
    callTime: '2024-01-10 15:05:00',
    completeTime: '2024-01-10 15:35:00',
    isCurrent: false
  },
  {
    id: 'queue-h-2',
    queueNumber: 'C012',
    serviceName: '身份证补办',
    hallId: 'hall-2',
    hallName: '东城区分中心',
    windowNumber: '3号窗',
    status: 'completed',
    waitCount: 0,
    estimatedWaitTime: 0,
    createTime: '2024-01-08 10:00:00',
    callTime: '2024-01-08 10:15:00',
    completeTime: '2024-01-08 10:45:00',
    isCurrent: false
  },
  {
    id: 'queue-h-3',
    queueNumber: 'A089',
    serviceName: '医保报销',
    hallId: 'hall-1',
    hallName: '市政务服务中心',
    windowNumber: '7号窗',
    status: 'missed',
    waitCount: 0,
    estimatedWaitTime: 0,
    createTime: '2024-01-05 09:10:00',
    callTime: '2024-01-05 09:40:00',
    isCurrent: false
  },
  {
    id: 'queue-h-4',
    queueNumber: 'D034',
    serviceName: '驾驶证换证',
    hallId: 'hall-3',
    hallName: '西城区分中心',
    windowNumber: '2号窗',
    status: 'completed',
    waitCount: 0,
    estimatedWaitTime: 0,
    createTime: '2023-12-28 16:00:00',
    callTime: '2023-12-28 16:20:00',
    completeTime: '2023-12-28 16:40:00',
    isCurrent: false
  }
];
