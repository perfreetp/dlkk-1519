import { ServiceItem } from '@/types';

export const serviceCategories = [
  { id: 'social', name: '社会保障', icon: 'social' },
  { id: 'house', name: '住房公积金', icon: 'house' },
  { id: 'id', name: '证件办理', icon: 'id' },
  { id: 'tax', name: '税务服务', icon: 'tax' },
  { id: 'civil', name: '民政服务', icon: 'civil' },
  { id: 'medical', name: '医疗健康', icon: 'medical' },
  { id: 'traffic', name: '交通出行', icon: 'traffic' },
  { id: 'education', name: '教育服务', icon: 'education' }
];

export const serviceList: ServiceItem[] = [
  {
    id: 'svc-1',
    name: '社保卡申领',
    category: '社会保障',
    categoryId: 'social',
    onlineReview: true,
    requiredMaterials: ['身份证原件', '一寸白底照片', '户口本'],
    estimatedTime: 15
  },
  {
    id: 'svc-2',
    name: '医保报销',
    category: '社会保障',
    categoryId: 'social',
    onlineReview: true,
    requiredMaterials: ['身份证', '医疗费用发票', '病历本', '银行卡'],
    estimatedTime: 20
  },
  {
    id: 'svc-3',
    name: '养老金资格认证',
    category: '社会保障',
    categoryId: 'social',
    onlineReview: false,
    requiredMaterials: ['身份证', '社保卡'],
    estimatedTime: 10
  },
  {
    id: 'svc-4',
    name: '公积金提取',
    category: '住房公积金',
    categoryId: 'house',
    onlineReview: true,
    requiredMaterials: ['身份证', '公积金卡', '购房合同/租房合同', '银行卡'],
    estimatedTime: 25
  },
  {
    id: 'svc-5',
    name: '公积金贷款查询',
    category: '住房公积金',
    categoryId: 'house',
    onlineReview: false,
    requiredMaterials: ['身份证', '公积金卡'],
    estimatedTime: 8
  },
  {
    id: 'svc-6',
    name: '身份证补办',
    category: '证件办理',
    categoryId: 'id',
    onlineReview: false,
    requiredMaterials: ['户口本', '一寸照片'],
    estimatedTime: 30
  },
  {
    id: 'svc-7',
    name: '护照办理',
    category: '证件办理',
    categoryId: 'id',
    onlineReview: true,
    requiredMaterials: ['身份证', '户口本', '二寸白底照片', '申请表'],
    estimatedTime: 40
  },
  {
    id: 'svc-8',
    name: '驾驶证换证',
    category: '交通出行',
    categoryId: 'traffic',
    onlineReview: true,
    requiredMaterials: ['身份证', '旧驾驶证', '体检证明', '一寸照片'],
    estimatedTime: 15
  },
  {
    id: 'svc-9',
    name: '不动产登记',
    category: '住房公积金',
    categoryId: 'house',
    onlineReview: true,
    requiredMaterials: ['身份证', '购房合同', '完税证明', '户口本'],
    estimatedTime: 45
  },
  {
    id: 'svc-10',
    name: '结婚登记',
    category: '民政服务',
    categoryId: 'civil',
    onlineReview: false,
    requiredMaterials: ['双方身份证', '双方户口本', '合照三张'],
    estimatedTime: 20
  },
  {
    id: 'svc-11',
    name: '税务登记变更',
    category: '税务服务',
    categoryId: 'tax',
    onlineReview: true,
    requiredMaterials: ['营业执照', '法人身份证', '公章', '变更申请表'],
    estimatedTime: 30
  },
  {
    id: 'svc-12',
    name: '少儿医保参保',
    category: '医疗健康',
    categoryId: 'medical',
    onlineReview: true,
    requiredMaterials: ['户口本', '出生证明', '监护人身份证', '银行卡'],
    estimatedTime: 20
  }
];

export const getServicesByCategory = (categoryId: string): ServiceItem[] => {
  return serviceList.filter(s => s.categoryId === categoryId);
};
