// 温室气体全球变暖潜能值(GWP)常量
export const GREENHOUSE_GAS_GWP = {
  // HFCs系列
  'HFC-23': 11700,  // HCFC-22生产过程副产物
  'HFC-32': 650,    // 从677更新为650
  'HFC-125': 2800,  // 从3500更新为2800
  'HFC-134a': 1300, // 从1430更新为1300
  'HFC-143a': 3800, // 从4820更新为3800
  'HFC-152a': 140,  // 从124更新为140
  'HFC-227ea': 2900, // 从3220更新为2900
  'HFC-236fa': 6300, // 从9810更新为6300
  'HFC-245fa': 1030, // 保持不变
  // 其他温室气体
  'SF6': 23900,     // 从23500更新为23900
  'CO2': 1,
  'CH4': 21,
  'N2O': 310,
  'CF4': 6630,
  'C2F6': 11100
};

// 分子量常量 - 补充所有气体的分子量
export const MOLECULAR_WEIGHT = {
  'HFC-23': 70,     // CHF3
  'HFC-32': 52,     // CH2F2
  'HFC-125': 120,   // CHF2CF3
  'HFC-134a': 102,  // CH2FCF3
  'HFC-143a': 84,   // CH3CF3
  'HFC-152a': 66,   // CH3CHF2
  'HFC-227ea': 170, // CF3CHFCF3
  'HFC-236fa': 152, // CF3CH2CF3
  'HFC-245fa': 134, // CHF2CH2CF3
  'SF6': 146,       // SF6
  'CO2': 44
};

// 温室气体分组
export const GAS_CATEGORIES = {
  HFCs: ['HFC-23', 'HFC-32', 'HFC-125', 'HFC-134a', 'HFC-143a', 'HFC-152a', 'HFC-227ea', 'HFC-236fa', 'HFC-245fa'],
  PFCs: [], // 可以在这里添加PFCs类型的气体
  SF6: ['SF6'],
  Other: ['CO2', 'CH4', 'N2O']
};