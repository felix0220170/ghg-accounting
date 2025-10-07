// 电力排放因子数据（按省份）
export const electricityEmissionFactors = [
  { province: '山东', factor2021: 0.6838, factor2022: 0.641 },
  { province: '新疆', factor2021: 0.6577, factor2022: 0.6231 },
  { province: '宁夏', factor2021: 0.6546, factor2022: 0.6423 },
  { province: '青海', factor2021: 0.1326, factor2022: 0.1567 },
  { province: '甘肃', factor2021: 0.4955, factor2022: 0.4772 },
  { province: '陕西', factor2021: 0.6336, factor2022: 0.6558 },
  { province: '云南', factor2021: 0.1235, factor2022: 0.1073 },
  { province: '贵州', factor2021: 0.5182, factor2022: 0.4989 },
  { province: '四川', factor2021: 0.1255, factor2022: 0.1404 },
  { province: '重庆', factor2021: 0.4743, factor2022: 0.5227 },
  { province: '海南', factor2021: 0.4524, factor2022: 0.4184 },
  { province: '广西', factor2021: 0.5154, factor2022: 0.4044 },
  { province: '广东', factor2021: 0.4715, factor2022: 0.4403 },
  { province: '湖南', factor2021: 0.5138, factor2022: 0.49 },
  { province: '湖北', factor2021: 0.3672, factor2022: 0.4364 },
  { province: '河南', factor2021: 0.6369, factor2022: 0.6058 },
  { province: '江西', factor2021: 0.5835, factor2022: 0.5752 },
  { province: '福建', factor2021: 0.4711, factor2022: 0.4092 },
  { province: '安徽', factor2021: 0.7075, factor2022: 0.6782 },
  { province: '浙江', factor2021: 0.5422, factor2022: 0.5153 },
  { province: '江苏', factor2021: 0.6451, factor2022: 0.5978 },
  { province: '上海', factor2021: 0.5834, factor2022: 0.5849 },
  { province: '黑龙江', factor2021: 0.6342, factor2022: 0.5368 },
  { province: '吉林', factor2021: 0.5629, factor2022: 0.4932 },
  { province: '辽宁', factor2021: 0.5876, factor2022: 0.5626 },
  { province: '内蒙古', factor2021: 0.7025, factor2022: 0.6849 },
  { province: '山西', factor2021: 0.7222, factor2022: 0.7096 },
  { province: '河北', factor2021: 0.7901, factor2022: 0.7252 },
  { province: '天津', factor2021: 0.7355, factor2022: 0.7041 },
  { province: '北京', factor2021: 0.5688, factor2022: 0.558 }
];

// 区域电力排放因子数据
export const regionEmissionFactors = [
  { region: '华北', factor2021: 0.0007120, factor2022: 0.0006776 },
  { region: '东北', factor2021: 0.0006012, factor2022: 0.0005564 },
  { region: '华东', factor2021: 0.0005992, factor2022: 0.0005617 },
  { region: '华中', factor2021: 0.0005354, factor2022: 0.0005395 },
  { region: '西北', factor2021: 0.0005951, factor2022: 0.0005857 },
  { region: '南方', factor2021: 0.0004326, factor2022: 0.0003869 },
  { region: '西南', factor2021: 0.0002113, factor2022: 0.0002268 }
];

// 默认热力排放因子（吨 CO2/GJ）
export const DEFAULT_HEAT_EMISSION_FACTOR = 0.11;

// 电力排放相关默认值
export const DEFAULT_ELECTRICITY_YEAR = '2022';
export const DEFAULT_PROVINCE = '北京';
export const DEFAULT_REGION = '华北';

// 排放计算相关的单位
export const EMISSION_UNIT = {
  ELECTRICITY: '吨CO2/MWh',
  HEAT: '吨CO2/GJ',
  TOTAL: '吨'
};

// 区域列表
export const REGIONS = regionEmissionFactors.map(item => item.region);

// 省份列表
export const PROVINCES = electricityEmissionFactors.map(item => item.province);