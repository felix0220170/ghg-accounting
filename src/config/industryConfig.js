// 行业类型常量 - 通用常量
export const INDUSTRY_TYPES = {
  OTHER: '其他行业',
  PAPER: '造纸及纸制品业',
  FOOD: '食品、烟草及酒、饮料和精制茶行业',
  NON_FERROUS_METALS: '其他有色金属冶炼和压延加工业',
  LAND_TRANSPORTATION: '陆上交通运输行业',
  MINING: '矿山企业' // 添加矿山企业行业
};

export const industryConfigs = {
  '造纸及纸制品业': {
    name: '造纸及纸制品业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'carbonate', label: '碳酸盐使用过程 CO2 排放', unit: '吨' },
      { key: 'wastewater', label: '废水厌氧处理 CH4 排放', unit: '吨', conversionFactor: 21 },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  '其他': {
    name: '其他',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'carbonate', label: '碳酸盐使用过程 CO2 排放', unit: '吨' },
      { key: 'wastewater', label: '废水厌氧处理 CH4 排放', unit: '吨', conversionFactor: 21 },
      { key: 'methaneRecovery', label: 'CH4 回收与销毁量', unit: '吨', conversionFactor: 21, isSubtraction: true },
      { key: 'co2Recycling', label: 'CO2 回收利用量', unit: '吨', isSubtraction: true },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  '食品、烟草及酒、饮料和精制茶行业': {
    name: '食品、烟草及酒、饮料和精制茶行业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'carbonate', label: '碳酸盐使用过程 CO2 排放', unit: '吨' },
      { key: 'purchasedCO2', label: '外购工业生产的二氧化碳', unit: '吨' },
      { key: 'wastewater', label: '废水厌氧处理 CH4 排放', unit: '吨', conversionFactor: 21 },
      { key: 'methaneRecovery', label: 'CH4 回收与销毁量', unit: '吨', conversionFactor: 21, isSubtraction: true },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  '其他有色金属冶炼和压延加工业': {
    name: '其他有色金属冶炼和压延加工业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'energyRawMaterial', label: '能源的原材料用途', unit: '吨' },
      { key: 'carbonate', label: '碳酸盐使用过程 CO2 排放', unit: '吨' },
      { key: 'oxalateProcess', label: '工业生产过程中的草酸的CO2排放', unit: '吨' },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  '陆上交通运输行业': {
    name: '陆上交通运输行业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  // 添加矿山企业的行业配置
  '矿山企业': {
    name: '矿山企业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'carbonate', label: '碳酸盐使用过程 CO2 排放', unit: '吨' },
      { key: 'carbonationAbsorption', label: '碳化工艺吸收的 CO2 量', unit: '吨', isSubtraction: true },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  }
};
