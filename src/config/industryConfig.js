// 行业类型常量 - 通用常量
export const INDUSTRY_TYPES = {
  CEMENT: '水泥行业',
  IRON_AND_STEEL: '钢铁生产行业',
  ALUMINUM_SMELTING: '铝冶炼行业',
  POWER_PLANT: '发电设施',
  ELECTRIC_GRID_COMPANY: '电网企业（待确认）',
  COKING: '独立焦化企业（待确认）',
  PAPER: '造纸及纸制品业',
  FOOD: '食品、烟草及酒、饮料和精制茶行业',
  NON_FERROUS_METALS: '其他有色金属冶炼和压延加工业',
  LAND_TRANSPORTATION: '陆上交通运输行业',
  MINING: '矿山企业',
  MACHINERY_MANUFACTURING: '机械设备制造企业',
  PUBLIC_BUILDING: '公共建筑运营单位（企业）',
  FLUORINE_CHEMICAL: '氟化工企业',
  OTHER: '其他行业',
};

// 在INDUSTRY_TYPES中确保氟化工企业存在
// 已经存在：FLUORINE_CHEMICAL: '氟化工企业'

// 更新氟化工企业的配置
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
  },
  // 在机械设备制造企业的emissionItems中添加新的排放项
  'MachineryManufacturingIndustry': {
    name: '机械设备制造企业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'electricalRefrigeration', label: '电气与制冷设备生产的过程排放', unit: '吨' },
      { key: 'weldingCO2', label: 'CO2作为保护气的焊接过程排放', unit: '吨' }, // 新增排放项
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },

  // 新增公共建筑运营单位（企业）的行业配置
  '公共建筑运营单位（企业）': {
    name: '公共建筑运营单位（企业）',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },

  // 在机械设备制造企业的emissionItems中添加新的排放项
  'MachineryManufacturingIndustry': {
    name: '机械设备制造企业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'electricalRefrigeration', label: '电气与制冷设备生产的过程排放', unit: '吨' },
      { key: 'weldingCO2', label: 'CO2作为保护气的焊接过程排放', unit: '吨' }, // 新增排放项
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  // 新增氟化工企业的行业配置
  '氟化工企业': {
    name: '氟化工企业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'hcfc22Production', label: 'HCFC-22 生产过程 HFC-23 排放', unit: '吨' }, // 新增排放项
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  // 新增水泥行业的配置
  '水泥行业': {
    name: '水泥行业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'clinkerProduction', label: '熟料生产过程 CO2 排放', unit: '吨' },
      { key: 'powerPlantOther', label: '发电设施及其他非水泥熟料生产设施排放量', unit: '吨' },
      { key: 'netElectricityHeat', label: '购入净电和净热 CO2 排放', unit: '吨' }
    ]
  },
  // 新增发电设施的配置
  '发电设施': {
    name: '发电设施',
    emissionItems: [
      { key: 'powerPlantFuel', label: '发电设施化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'powerPlantElectricity', label: '发电设施购入使用电力排放', unit: '吨' }
    ]
  },
  // 新增独立焦化企业的配置
  '独立焦化企业': {
    name: '独立焦化企业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'cokeProduction', label: '炼焦生产过程 CO2 排放', unit: '吨' },
      { key: 'methaneN2O', label: 'CH4和N2O排放', unit: '吨' },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' }
    ]
  },
  // 新增电网企业的配置
  '电网企业': {
    name: '电网企业',
    emissionItems: [
      { key: 'fossilFuel', label: '化石燃料燃烧 CO2 排放', unit: '吨' },
      { key: 'electricityHeat', label: '净购入电力和热力隐含的 CO2 排放', unit: '吨' },
      { key: 'sulfurHexafluorideEmission', label: '使用六氟化硫设备修理与退役过程产生的排放', unit: '吨' }
    ]
  }
};
