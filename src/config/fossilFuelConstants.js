// 化石燃料相关常量

// 默认燃料类型数据
export const DEFAULT_FUEL_TYPES = [
  { id: 1, name: '无烟煤', default低位发热量: 24.515, default单位热值含碳量: 0.02749, default碳氧化率: 94 },
  { id: 2, name: '烟煤', default低位发热量: 23.204, default单位热值含碳量: 0.02618, default碳氧化率: 93 },
  { id: 3, name: '褐煤', default低位发热量: 14.449, default单位热值含碳量: 0.02800, default碳氧化率: 96 },
  { id: 4, name: '洗精煤', default低位发热量: 26.344, default单位热值含碳量: 0.02540, default碳氧化率: 93 },
  { id: 5, name: '其它洗煤', default低位发热量: 15.373, default单位热值含碳量: 0.02540, default碳氧化率: 90 },
  { id: 6, name: '型煤', default低位发热量: 17.46, default单位热值含碳量: 0.03360, default碳氧化率: 90 },
  { id: 7, name: '焦炭', default低位发热量: 28.446, default单位热值含碳量: 0.02940, default碳氧化率: 93 },
  { id: 8, name: '原油', default低位发热量: 42.62, default单位热值含碳量: 0.02010, default碳氧化率: 98 },
  { id: 9, name: '燃料油', default低位发热量: 40.19, default单位热值含碳量: 0.02110, default碳氧化率: 98 },
  { id: 10, name: '汽油', default低位发热量: 44.80, default单位热值含碳量: 0.01890, default碳氧化率: 98 },
  { id: 11, name: '柴油', default低位发热量: 43.33, default单位热值含碳量: 0.02020, default碳氧化率: 98 },
  { id: 12, name: '一般煤油', default低位发热量: 44.75, default单位热值含碳量: 0.01960, default碳氧化率: 98 },
  { id: 13, name: '喷气煤油', default低位发热量: 44.750, default单位热值含碳量: 0.0196, default碳氧化率: 98 },
  { id: 14, name: '石脑油', default低位发热量: 41.031, default单位热值含碳量: 0.0200, default碳氧化率: 98 },
  { id: 15, name: '石油焦', default低位发热量: 31.00, default单位热值含碳量: 0.02750, default碳氧化率: 98 },
  { id: 16, name: '其它石油制品', default低位发热量: 40.19, default单位热值含碳量: 0.02000, default碳氧化率: 98 },
  { id: 17, name: '焦油', default低位发热量: 33.453, default单位热值含碳量: 0.02200, default碳氧化率: 98 },
  { id: 18, name: '粗苯', default低位发热量: 41.816, default单位热值含碳量: 0.02270, default碳氧化率: 98 },
  { id: 19, name: '炼厂干气', default低位发热量: 46.05, default单位热值含碳量: 0.01820, default碳氧化率: 99 },
  { id: 20, name: '液化石油气', default低位发热量: 47.31, default单位热值含碳量: 0.01720, default碳氧化率: 99 },
  { id: 21, name: '液化天然气', default低位发热量: 41.868, default单位热值含碳量: 0.01530, default碳氧化率: 99 },
  { id: 22, name: '天然气', default低位发热量: 389.31, default单位热值含碳量: 0.01530, default碳氧化率: 99 },
  { id: 23, name: '焦炉煤气', default低位发热量: 173.854, default单位热值含碳量: 0.01360, default碳氧化率: 99 },
  { id: 24, name: '高炉煤气', default低位发热量: 37.69, default单位热值含碳量: 0.07080, default碳氧化率: 99 },
  { id: 25, name: '转炉煤气', default低位发热量: 79.54, default单位热值含碳量: 0.04960, default碳氧化率: 99 },
  { id: 26, name: '密闭电石炉炉气', default低位发热量: 111.19, default单位热值含碳量: 0.03951, default碳氧化率: 99 },
  { id: 27, name: '其它煤气', default低位发热量: 52.34, default单位热值含碳量: 0.01220, default碳氧化率: 99 },
];

// 其他行业需要的燃料列表
export const OTHER_INDUSTRY_REQUIRED_FUELS = [
  '无烟煤', '烟煤', '褐煤', '洗精煤', '其它洗煤', 
  '型煤', '焦炭', '原油', '燃料油', '汽油', 
  '柴油', '喷气煤油', '一般煤油', '石脑油', '石油焦', 
  '液化天然气', '液化石油气', '其它石油制品', '焦炉煤气', 
  '高炉煤气', '转炉煤气', '其它煤气', '天然气', '炼厂干气'
];

// 陆上交通运输行业需要的燃料列表
export const LAND_TRANSPORTATION_REQUIRED_FUELS = [
  '汽油', '柴油', '液化天然气', '天然气', '液化石油气', '无烟煤', '烟煤'
];

// 造纸及纸制品业需要的燃料列表
export const PAPER_MANUFACTURING_REQUIRED_FUELS = [
  '无烟煤', '烟煤', '褐煤', '洗精煤', '其它洗煤', '其它煤制品', 
  '石油焦', '焦炭', '原油', '燃料油', '汽油', '柴油', '煤油', 
  '液化天然气', '液化石油气', '焦油', '焦炉煤气', '高炉煤气', 
  '转炉煤气', '其它煤气', '天然气', '炼厂干气'
];

// 食品、烟草及酒、饮料和精制茶行业需要的燃料列表
export const FOOD_BEVERAGE_REQUIRED_FUELS = [
  '无烟煤', '烟煤', '褐煤', '洗精煤', '其它洗煤', '其它煤制品', 
  '焦炭', '原油', '燃料油', '汽油', '柴油', '一般煤油', 
  '液化天然气', '液化石油气', '焦油', '粗苯', '焦炉煤气', 
  '高炉煤气', '转炉煤气', '其它煤气', '天然气', '炼厂干气'
];

// 其他有色金属冶炼和压延加工业需要的燃料列表
export const NON_FERROUS_METALS_REQUIRED_FUELS = [
  '无烟煤', '烟煤', '褐煤', '洗精煤', '其它洗煤', '其它煤制品', 
  '石油焦', '焦炭', '原油', '燃料油', '汽油', '柴油', '煤油', 
  '液化天然气', '液化石油气', '焦油', '焦炉煤气', '高炉煤气', 
  '转炉煤气', '其它煤气', '天然气', '炼厂干气'
];

// CO2计算相关常量
export const CO2_CALCULATION_CONSTANTS = {
  // CO2与C的分子量比例
  CARBON_TO_CO2_RATIO: 44 / 12,
};

// 添加公共建筑行业需要的燃料列表
export const PUBLIC_BUILDING_REQUIRED_FUELS = [
  '无烟煤', '烟煤', '褐煤', '洗精煤', '其它洗煤', '其它煤制品', 
  '焦炭', '原油', '燃料油', '汽油', '柴油', '一般煤油', 
  '液化天然气', '液化石油气', '天然气', '炼厂干气', '城市煤气'
];

// 添加氟化工企业需要的燃料列表
export const FLUORINE_CHEMICAL_REQUIRED_FUELS = [
  '无烟煤', '烟煤', '褐煤', '洗精煤', '其它洗煤', '其它煤制品', 
  '焦炭', '原油', '燃料油', '汽油', '柴油', '一般煤油', 
  '液化天然气', '液化石油气', '天然气', '炼厂干气', '氢气'
];