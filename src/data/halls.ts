import { Hall, TideWindow } from '@/types';

export const hallList: Hall[] = [
  {
    id: 'hall-1',
    name: '市政务服务中心',
    address: '市民大道1288号',
    distance: 1.2,
    crowdLevel: 'medium',
    waitTime: 25,
    waitCount: 48,
    openWindows: 12,
    totalWindows: 20,
    isNearby: true,
    type: 'main'
  },
  {
    id: 'hall-2',
    name: '东城区分中心',
    address: '东府街56号',
    distance: 3.5,
    crowdLevel: 'low',
    waitTime: 8,
    waitCount: 12,
    openWindows: 6,
    totalWindows: 10,
    isNearby: false,
    type: 'sub'
  },
  {
    id: 'hall-3',
    name: '西城区分中心',
    address: '西华路230号',
    distance: 4.8,
    crowdLevel: 'high',
    waitTime: 45,
    waitCount: 86,
    openWindows: 8,
    totalWindows: 15,
    isNearby: false,
    type: 'sub'
  },
  {
    id: 'hall-4',
    name: '高新区分中心',
    address: '科技路88号',
    distance: 6.2,
    crowdLevel: 'medium',
    waitTime: 20,
    waitCount: 35,
    openWindows: 10,
    totalWindows: 16,
    isNearby: false,
    type: 'sub'
  },
  {
    id: 'hall-5',
    name: '南区分中心',
    address: '南苑路168号',
    distance: 8.5,
    crowdLevel: 'low',
    waitTime: 10,
    waitCount: 15,
    openWindows: 5,
    totalWindows: 8,
    isNearby: false,
    type: 'sub'
  }
];

export const tideWindows: TideWindow[] = [
  {
    id: 'tide-1',
    windowNumber: '潮汐1号窗',
    serviceName: '社保卡办理',
    status: 'open',
    waitCount: 5
  },
  {
    id: 'tide-2',
    windowNumber: '潮汐2号窗',
    serviceName: '医保报销',
    status: 'open',
    waitCount: 8
  },
  {
    id: 'tide-3',
    windowNumber: '潮汐3号窗',
    serviceName: '不动产登记',
    status: 'closed',
    waitCount: 0
  }
];

export const getNearbyHall = (): Hall | undefined => {
  return hallList.find(h => h.isNearby);
};
