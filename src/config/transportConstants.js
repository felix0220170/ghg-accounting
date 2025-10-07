// 陆上交通运输行业相关常量定义

// 车辆排放因子数据（mg/km）
export const EMISSION_FACTORS = {
  // 轿车 - 汽油
  'car-gasoline': {
    '国I': { n2o: 38, ch4: 45 },
    '国II': { n2o: 24, ch4: 94 },
    '国III': { n2o: 12, ch4: 83 },
    '国IV及以上': { n2o: 6, ch4: 57 }
  },
  // 轿车 - 柴油
  'car-diesel': {
    '国I': { n2o: 0, ch4: 18 },
    '国II': { n2o: 3, ch4: 6 },
    '国III': { n2o: 15, ch4: 7 },
    '国IV及以上': { n2o: 15, ch4: 0 }
  },
  // 轿车 - LPG
  'car-lpg': {
    '国I': { n2o: 38, ch4: 80 },
    '国II': { n2o: 23, ch4: 80 },
    '国III及以上': { n2o: 9, ch4: 80 }
  },
  // 其它轻型车 - 汽油
  'car-other-light-gasoline': {
    '国I': { n2o: 122, ch4: 45 },
    '国II': { n2o: 62, ch4: 94 },
    '国III': { n2o: 36, ch4: 83 },
    '国IV及以上': { n2o: 16, ch4: 57 }
  },
  // 其它轻型车 - 柴油
  'car-other-light-diesel': {
    '国I': { n2o: 0, ch4: 18 },
    '国II': { n2o: 3, ch4: 6 },
    '国III': { n2o: 15, ch4: 7 },
    '国IV及以上': { n2o: 15, ch4: 0 }
  },
  // 重型车 - 汽油
  'heavy-gasoline': {
    '所有': { n2o: 6, ch4: 140 },
  },
  // 重型车 - 柴油
  'heavy-diesel': {
    '所有': { n2o: 30, ch4: 175 },
  },
  // 重型车 - 天然气
  'heavy-gas-natural': {
    '国IV及以上': { ch4: 900 },
    '其他': { ch4: 5400 },
  }
};

// 类型标签映射
export const TYPE_LABEL_MAP = {
  'car': '轿车',
  'car-other-light': '其它轻型车',
  'heavy': '重型车',
  'gasoline': '汽油',
  'diesel': '柴油',
  'lpg': 'LPG',
  'gas-natural': '天然气'
};

// 全球变暖潜能值（GWP）
export const GWP_VALUES = {
  METHANE: 28,     // 甲烷的GWP值
  NITROUS_OXIDE: 273  // 氧化亚氮的GWP值
};

// 单位转换常量
export const UNIT_CONVERSION = {
  MG_TO_TON: 1e-9  // 毫克转换为吨的系数
};

// 排放类型标签
export const EMISSION_TYPE_LABELS = {
  METHANE: '甲烷',
  NITROUS_OXIDE: '氧化亚氮',
  CO2EQUIVALENT: '二氧化碳当量'
};