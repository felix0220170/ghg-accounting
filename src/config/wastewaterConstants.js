// 废水处理相关常量定义

// 甲烷最大生产力（千克 CH4/千克 COD）
export const METHANE_PRODUCTION_CAPACITY = 0.25;

// 甲烷修正因子(MCF)选项 - 用于其他行业
export const DEFAULT_MCF_OPTIONS = [
  { value: 0.1, label: '海洋、河流或湖泊排放 (0.1)', description: '高浓度有机污水进入河流可能产生厌氧反应' },
  { value: 0, label: '好氧处理设施 (0)', description: '必须管理完善' },
  { value: 0.3, label: '好氧处理设施 (0.3)', description: '管理不完善，过载' },
  { value: 0.8, label: '污泥厌氧消化池 (0.8)', description: '未考虑 CH4 回收' },
  { value: 0.8, label: '厌氧反应器 (0.8)', description: '未考虑 CH4 回收' },
  { value: 0.2, label: '浅厌氧塘 (0.2)', description: '深度不足2米' },
  { value: 0.8, label: '深厌氧塘 (0.8)', description: '深度超过2米' }
];

// 食品行业MCF选项
export const FOOD_INDUSTRY_MCF_OPTIONS = [
  { 
    value: 'food_manufacturing', 
    label: '食品制造业（包括酒业生产）', 
    recommendedValue: 0.7,
    range: '0.6 - 0.8',
    description: '适合大多数食品制造过程'
  },
  { 
    value: 'tobacco_manufacturing', 
    label: '烟草制造业', 
    recommendedValue: 0.3,
    range: '0.2 - 0.4',
    description: '适用于烟草加工废水处理'
  },
  { 
    value: 'beverage_tea_manufacturing', 
    label: '酒、饮料和精制茶制造业', 
    recommendedValue: 0.5,
    range: '0.4 - 0.6',
    description: '适用于饮料和茶叶加工废水处理'
  }
];

// 造纸行业MCF推荐值
export const PAPER_INDUSTRY_MCF_RECOMMENDED = 0.5;