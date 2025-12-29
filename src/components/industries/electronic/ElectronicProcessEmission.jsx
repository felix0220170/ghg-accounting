import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 电子设备制造业原料气排放计算指标
const INDICATORS = [
  {
    key: 'gasUsage',
    name: '原料气使用量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 3
  },
  {
    key: 'utilizationRate',
    name: '原料气利用率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'gasResidualRatio',
    name: '容器气体残余比例',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 10
  },
  {
    key: 'collectionEfficiency',
    name: '收集效率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'removalEfficiency',
    name: '去除效率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'gwp',
    name: '全球变暖潜势',
    unit: '',
    isCalculated: false,
    decimalPlaces: 0,
    readOnly: true
  },
  {
    key: 'leakageEmission',
    name: '原料气体泄漏排放',
    unit: 'tCO₂e',
    isCalculated: true,
    decimalPlaces: 3,
    getValue: (data) => {
      const { gasUsage, gasResidualRatio, utilizationRate, collectionEfficiency, removalEfficiency, gwp } = data;
      if (!gasUsage || !gwp) return 0;
      const residual = (gasResidualRatio || 10) / 100;
      const utilization = (utilizationRate || 0) / 100;
      const collection = (collectionEfficiency || 0) / 100;
      const removal = (removalEfficiency || 0) / 100;
      return (1 - residual) * gasUsage * (1 - utilization) * (1 - collection * removal) * gwp;
    }
  }
];

// 副产品指标
const BYPRODUCT_INDICATORS = [
  {
    key: 'conversionFactor',
    name: '转化因子',
    unit: 't副产品/t原料气',
    isCalculated: false,
    decimalPlaces: 3
  },
  {
    key: 'byproductCollectionEfficiency',
    name: '收集效率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'byproductRemovalEfficiency',
    name: '去除效率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'byproductGwp',
    name: '全球变暖潜势',
    unit: '',
    isCalculated: false,
    decimalPlaces: 0,
    readOnly: true
  },
  {
    key: 'byproductEmission',
    name: '副产品排放',
    unit: 'tCO₂e',
    isCalculated: true,
    decimalPlaces: 3,
    getValue: (data) => {
      // 这个函数不再使用，因为实际的计算在 updateCalculatedValues 函数中进行
      return 0;
    }
  }
];

// 电子设备制造业原料气选项
const MATERIAL_GASES = [
  { value: 'NF3', label: 'NF₃', gwp: 17200 },
  { value: 'SF6', label: 'SF₆', gwp: 23500 },
  { value: 'CF4', label: 'CF₄', gwp: 7390 },
  { value: 'C2F6', label: 'C₂F₆', gwp: 12200 },
  { value: 'C3F8', label: 'C₃F₈', gwp: 8900 },
  { value: 'C4F6', label: 'C₄F₆', gwp: 12200 },
  { value: 'c-C4F8', label: 'c-C₄F₈', gwp: 10300 },
  { value: 'c-C4F8O', label: 'c-C₄F₈O', gwp: 10300 },
  { value: 'C5F8', label: 'C₅F₈', gwp: 12000 },
  { value: 'CHF3', label: 'CHF₃', gwp: 12400 },
  { value: 'CH2F2', label: 'CH₂F₂', gwp: 675 },
  { value: 'CH3F', label: 'CH₃F', gwp: 92 }
];

// 默认参数数据
const DEFAULT_EMISSION_FACTORS = {
  "NF3": {
    "utilizationRate": 80,
    "collectionEfficiency": 90,
    "removalEfficiency": 95,
    "conversionFactors": {
      "CF4": 0.09
    }
  },
  "SF6": {
    "utilizationRate": 80,
    "collectionEfficiency": 90,
    "removalEfficiency": 90,
    "conversionFactors": {}
  },
  "CF4": {
    "utilizationRate": 10,
    "collectionEfficiency": 90,
    "removalEfficiency": 90,
    "conversionFactors": {}
  },
  "C2F6": {
    "utilizationRate": 40,
    "collectionEfficiency": 90,
    "removalEfficiency": 90,
    "conversionFactors": {
      "CF4": 0.2
    }
  },
  "C3F8": {
    "utilizationRate": 60,
    "collectionEfficiency": 90,
    "removalEfficiency": 90,
    "conversionFactors": {
      "CF4": 0.1
    }
  },
  "C4F6": {
    "utilizationRate": null,
    "collectionEfficiency": null,
    "removalEfficiency": null,
    "conversionFactors": {
      "C2F6": 0.2
    }
  },
  "c-C4F8": {
    "utilizationRate": 90,
    "collectionEfficiency": 90,
    "removalEfficiency": 90,
    "conversionFactors": {
      "CF4": 0.1,
      "C2F6": 0.1
    }
  },
  "c-C4F8O": {
    "utilizationRate": null,
    "collectionEfficiency": null,
    "removalEfficiency": null,
    "conversionFactors": {
      "C3F8": 0.04
    }
  },
  "C5F8": {
    "utilizationRate": null,
    "collectionEfficiency": null,
    "removalEfficiency": null,
    "conversionFactors": {
      "C2F6": 0.04
    }
  },
  "CHF3": {
    "utilizationRate": 60,
    "collectionEfficiency": 90,
    "removalEfficiency": 90,
    "conversionFactors": {
      "CF4": 0.07
    }
  },
  "CH2F2": {
    "utilizationRate": null,
    "collectionEfficiency": null,
    "removalEfficiency": null,
    "conversionFactors": {
      "CF4": 0.08
    }
  },
  "CH3F": {
    "utilizationRate": null,
    "collectionEfficiency": null,
    "removalEfficiency": null,
    "conversionFactors": {}
  }
};

// 副产品类型
const BYPRODUCT_TYPES = [
  { value: 'CF4', label: 'CF₄', gwp: 7390 },
  { value: 'C2F6', label: 'C₂F₆', gwp: 12200 },
  { value: 'C3F8', label: 'C₃F₈', gwp: 8900 }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = (indicators) => {
  // 为每个指标创建包含12个月数据的对象
  return indicators.reduce((acc, indicator) => {
    acc[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: indicator.defaultValue || (indicator.isCalculated ? 0 : ''),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 为自定义电子原料气初始化数据（纵向布局）
const initializeCustomElectronicMaterialData = (gasName, gwpValue) => {
  const initialData = createInitialIndicatorData(INDICATORS);
  
  // 为所有指标初始化额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      value: item.value,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  // 设置默认值（自定义气体使用通用默认值）
  initialData.gasResidualRatio = initialData.gasResidualRatio.map(item => ({ ...item, value: 10 })); // 默认10%
  initialData.utilizationRate = initialData.utilizationRate.map(item => ({ ...item, value: '' })); // 空值，用户需输入
  initialData.collectionEfficiency = initialData.collectionEfficiency.map(item => ({ ...item, value: '' })); // 空值，用户需输入
  initialData.removalEfficiency = initialData.removalEfficiency.map(item => ({ ...item, value: '' })); // 空值，用户需输入
  // 自定义气体需要用户输入GWP值
  initialData.gwp = initialData.gwp.map(item => ({ ...item, value: gwpValue })); // 使用用户输入的GWP值
  
  return {
    id: `custom-electronic-material-${Date.now()}`,
    gasType: `custom-${gasName}`,
    gasLabel: gasName,
    data: initialData,
    byproducts: [], // 副产品列表
    files: {}
  };
};

// 为电子原料气初始化数据（纵向布局）
const initializeElectronicMaterialData = (gasType) => {
  const materialGas = MATERIAL_GASES.find(g => g.value === gasType);
  const defaultFactors = DEFAULT_EMISSION_FACTORS[gasType] || {};
  
  const initialData = createInitialIndicatorData(INDICATORS);
  
  // 为所有指标初始化额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      value: item.value,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  // 设置默认值
  const gwp = materialGas?.gwp || 0;
  initialData.gasResidualRatio = initialData.gasResidualRatio.map(item => ({ ...item, value: 10 })); // 默认10%
  initialData.utilizationRate = initialData.utilizationRate.map(item => ({ 
    ...item, 
    value: defaultFactors.utilizationRate || '' 
  }));
  initialData.collectionEfficiency = initialData.collectionEfficiency.map(item => ({ 
    ...item, 
    value: defaultFactors.collectionEfficiency || '' 
  }));
  initialData.removalEfficiency = initialData.removalEfficiency.map(item => ({ 
    ...item, 
    value: defaultFactors.removalEfficiency || '' 
  }));
  initialData.gwp = initialData.gwp.map(item => ({ ...item, value: gwp }));
  
  return {
    id: `electronic-material-${Date.now()}`,
    gasType: gasType,
    gasLabel: materialGas?.label || gasType,
    data: initialData,
    byproducts: [], // 副产品列表
    files: {}
  };
};

// 为副产品初始化数据
const initializeByproductData = (byproductType, parentGasType, customByproductName = null, customByproductGwp = null) => {
  // 如果是自定义副产品，使用自定义名称，否则从预设列表中查找
  const isCustomByproduct = customByproductName !== null && customByproductGwp !== null;
  const byproduct = !isCustomByproduct ? BYPRODUCT_TYPES.find(b => b.value === byproductType) : null;
  
  const initialData = createInitialIndicatorData(BYPRODUCT_INDICATORS);
  
  // 为所有指标初始化额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      value: item.value,
      dataSource: '',
      supportingMaterial: null
    }));
  });
  
  // 设置默认值
  initialData.byproductGwp = initialData.byproductGwp.map(item => ({ 
    ...item, 
    value: isCustomByproduct ? customByproductGwp : (byproduct?.gwp || 0) // 自定义副产品的GWP值在添加时带入
  }));
  
  // 根据原料气类型和副产品类型获取转化因子默认值
  if (parentGasType) {
    const defaultFactors = DEFAULT_EMISSION_FACTORS[parentGasType] || {};
    const conversionFactors = defaultFactors.conversionFactors || {};
    
    // 对于自定义副产品，尝试从通用转换因子中获取值，否则为null
    const conversionFactor = isCustomByproduct ? null : (conversionFactors[byproductType] || null);
    
    // 设置转化因子默认值
    initialData.conversionFactor = initialData.conversionFactor.map(item => ({ 
      ...item, 
      value: conversionFactor 
    }));
    
    // 副产品继承父原料气的收集效率和去除效率默认值
    if (defaultFactors.collectionEfficiency !== null && defaultFactors.collectionEfficiency !== undefined) {
      initialData.byproductCollectionEfficiency = initialData.byproductCollectionEfficiency.map(item => ({
        ...item,
        value: defaultFactors.collectionEfficiency
      }));
    }
    
    if (defaultFactors.removalEfficiency !== null && defaultFactors.removalEfficiency !== undefined) {
      initialData.byproductRemovalEfficiency = initialData.byproductRemovalEfficiency.map(item => ({
        ...item,
        value: defaultFactors.removalEfficiency
      }));
    }
  }
  
  return {
    id: `byproduct-${Date.now()}`,
    byproductType: byproductType,
    byproductLabel: customByproductName || (byproduct?.label || byproductType),
    data: initialData,
    files: {}
  };
};

function ElectronicProcessEmission({ onEmissionChange }) {
  // 电子原料气列表状态
  const [electronicMaterials, setElectronicMaterials] = useState([]);
  // 选中的原料气类型
  const [selectedGasType, setSelectedGasType] = useState('');
  // 自定义原料气名称和GWP
  const [customGasName, setCustomGasName] = useState('');
  const [customGasGwp, setCustomGasGwp] = useState('');
  // 自定义副产品名称
  const [customByproductName, setCustomByproductName] = useState('');
  
  // 控制缺省值表格弹出窗口显示
  const [showDefaultsModal, setShowDefaultsModal] = useState(false);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 添加新的电子原料气
  const addNewElectronicMaterial = useCallback(() => {
    // 如果选择了预设气体
    if (selectedGasType) {
      // 检查该原料气类型是否已存在
      const exists = electronicMaterials.some(material => material.gasType === selectedGasType);
      if (exists) {
        alert('该原料气类型已存在');
        return;
      }
      
      const newElectronicMaterial = initializeElectronicMaterialData(selectedGasType);
      setElectronicMaterials(prevMaterials => [...prevMaterials, newElectronicMaterial]);
      setSelectedGasType(''); // 重置选择
    } 
    // 如果输入了自定义气体名称和GWP
    else if (customGasName.trim() && customGasGwp.trim()) {
      const customGasKey = `custom-${customGasName.trim()}`;
      
      // 检查该自定义气体是否已存在
      const exists = electronicMaterials.some(material => material.gasType === customGasKey);
      if (exists) {
        alert('该自定义气体已存在');
        return;
      }
      
      const gwpValue = parseFloat(customGasGwp.trim());
      if (isNaN(gwpValue)) {
        alert('请输入有效的GWP值');
        return;
      }
      
      const newElectronicMaterial = initializeCustomElectronicMaterialData(customGasName.trim(), gwpValue);
      setElectronicMaterials(prevMaterials => [...prevMaterials, newElectronicMaterial]);
      setCustomGasName(''); // 重置输入
      setCustomGasGwp(''); // 重置GWP输入
    }
  }, [electronicMaterials, selectedGasType, customGasName, customGasGwp]);
  
  // 移除电子原料气
  const removeElectronicMaterial = useCallback((materialId) => {
    setElectronicMaterials(prevMaterials => prevMaterials.filter(material => material.id !== materialId));
  }, []);
  
  // 添加副产品
  const addByproduct = useCallback((materialId, byproductType, customByproductName = null, customByproductGwp = null) => {
    setElectronicMaterials(prevMaterials => {
      return prevMaterials.map(material => {
        if (material.id === materialId) {
          let finalByproductType = byproductType;
          let finalByproductName = customByproductName;
          
          // 如果传入了自定义副产品名称
          if (customByproductName) {
            finalByproductType = `custom-${customByproductName}`;
            finalByproductName = customByproductName;
          }
          
          // 检查该副产品类型是否已存在
          const exists = material.byproducts?.some(byproduct => byproduct.byproductType === finalByproductType);
          if (exists) {
            alert('该副产品类型已存在');
            return material;
          }
          
          // 传递当前原料气的 gasType 以获取转化因子默认值
          const newByproduct = initializeByproductData(finalByproductType, material.gasType, finalByproductName, customByproductGwp);
          return {
            ...material,
            byproducts: [...(material.byproducts || []), newByproduct]
          };
        }
        return material;
      });
    });
  }, []);
  
  // 移除副产品
  const removeByproduct = useCallback((materialId, byproductId) => {
    setElectronicMaterials(prevMaterials => {
      return prevMaterials.map(material => {
        if (material.id === materialId) {
          return {
            ...material,
            byproducts: material.byproducts?.filter(byproduct => byproduct.id !== byproductId) || []
          };
        }
        return material;
      });
    });
  }, []);
  
  // 格式化数值显示
  const formatValue = (value, decimalPlaces = 2) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toFixed(decimalPlaces);
  };
  
  // 更新计算值 - 实现排放量计算逻辑
  const updateCalculatedValues = useCallback(() => {
    // 处理电子原料气数据计算
    setElectronicMaterials(prevUnits => {
      let hasChanges = false;
      const updatedUnits = prevUnits.map(unit => {
        if (!unit.data) return unit;
        
        let updatedUnit = { ...unit, data: { ...unit.data }, byproducts: [...(unit.byproducts || [])] };
        let unitChanged = false;
        
        // 计算各月份泄漏排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的原料气使用量
          const gasUsageData = unit.data.gasUsage?.find(m => m.month === month);
          const gasUsageValue = gasUsageData?.value ? parseFloat(gasUsageData.value) : 0;
          
          // 获取当月的容器气体残余比例
          const gasResidualRatioData = unit.data.gasResidualRatio?.find(m => m.month === month);
          const gasResidualRatioValue = gasResidualRatioData?.value ? parseFloat(gasResidualRatioData.value) : 10;
          
          // 获取当月的原料气利用率
          const utilizationRateData = unit.data.utilizationRate?.find(m => m.month === month);
          const utilizationRateValue = utilizationRateData?.value ? parseFloat(utilizationRateData.value) : 0;
          
          // 获取当月的收集效率
          const collectionEfficiencyData = unit.data.collectionEfficiency?.find(m => m.month === month);
          const collectionEfficiencyValue = collectionEfficiencyData?.value ? parseFloat(collectionEfficiencyData.value) : 0;
          
          // 获取当月的去除效率
          const removalEfficiencyData = unit.data.removalEfficiency?.find(m => m.month === month);
          const removalEfficiencyValue = removalEfficiencyData?.value ? parseFloat(removalEfficiencyData.value) : 0;
          
          // 获取当月的全球变暖潜势
          const gwpData = unit.data.gwp?.find(m => m.month === month);
          const gwpValue = gwpData?.value ? parseFloat(gwpData.value) : 0;
          
          // 计算泄漏排放量：(1-h) * FCi * (1-Ui) * (1-ai*di) * GWPi
          const leakageEmissionValue = (1 - gasResidualRatioValue / 100) * gasUsageValue * (1 - utilizationRateValue / 100) * (1 - (collectionEfficiencyValue / 100) * (removalEfficiencyValue / 100)) * gwpValue;
          
          // 更新泄漏排放量数据
          const currentLeakageData = updatedUnit.data.leakageEmission || [];
          const leakageMonthIndex = currentLeakageData.findIndex(m => m.month === month);
          const newLeakageData = [...currentLeakageData];
          
          if (leakageMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newLeakageData[leakageMonthIndex].value) !== leakageEmissionValue) {
              newLeakageData[leakageMonthIndex] = {
                ...newLeakageData[leakageMonthIndex],
                value: leakageEmissionValue,
                unit: 'tCO₂e'
              };
              unitChanged = true;
            }
          } else if (leakageEmissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newLeakageData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: leakageEmissionValue,
              unit: 'tCO₂e'
            });
            unitChanged = true;
          }
          
          // 计算各副产品的排放量
          const updatedByproducts = updatedUnit.byproducts.map(byproduct => {
            if (!byproduct.data) return byproduct;
            
            let updatedByproduct = { ...byproduct, data: { ...byproduct.data } };
            let byproductChanged = false;
            
            // 获取当前副产品的收集效率
            const byproductCollectionEfficiencyData = updatedByproduct.data.byproductCollectionEfficiency?.find(m => m.month === month);
            const byproductCollectionEfficiencyValue = byproductCollectionEfficiencyData?.value ? parseFloat(byproductCollectionEfficiencyData.value) : 0;
            
            // 获取副产品的去除效率
            const byproductRemovalEfficiencyData = updatedByproduct.data.byproductRemovalEfficiency?.find(m => m.month === month);
            const byproductRemovalEfficiencyValue = byproductRemovalEfficiencyData?.value ? parseFloat(byproductRemovalEfficiencyData.value) : 0;
            
            // 获取副产品的全球变暖潜势
            const byproductGwpData = updatedByproduct.data.byproductGwp?.find(m => m.month === month);
            const byproductGwpValue = byproductGwpData?.value ? parseFloat(byproductGwpData.value) : 0;
            
            // 获取转化因子（用户输入值优先，否则使用默认值）
            const conversionFactorData = updatedByproduct.data.conversionFactor?.find(m => m.month === month);
            const conversionFactor = conversionFactorData?.value ? parseFloat(conversionFactorData.value) : 0;
            
            // 如果用户没有输入值，尝试使用默认值
            let finalConversionFactor = conversionFactor;
            if (!conversionFactor || conversionFactor === 0) {
              const defaultFactors = DEFAULT_EMISSION_FACTORS[unit.gasType] || {};
              const defaultConversionFactors = defaultFactors.conversionFactors || {};
              finalConversionFactor = defaultConversionFactors[byproduct.byproductType] || 0;
            }
            
            // 计算副产品排放量：(1-h) * FCi * B_i,j * (1-aj*dj) * GWPj
            const byproductEmissionValue = (1 - gasResidualRatioValue / 100) * gasUsageValue * finalConversionFactor * (1 - (byproductCollectionEfficiencyValue / 100) * (removalEfficiencyValue / 100)) * byproductGwpValue;
            
            // 更新副产品排放量数据
            const currentByproductEmissionData = updatedByproduct.data.byproductEmission || [];
            const byproductEmissionMonthIndex = currentByproductEmissionData.findIndex(m => m.month === month);
            const newByproductEmissionData = [...currentByproductEmissionData];
            
            if (byproductEmissionMonthIndex !== -1) {
              // 只有当值真正改变时才更新
              if (parseFloat(newByproductEmissionData[byproductEmissionMonthIndex].value) !== byproductEmissionValue) {
                newByproductEmissionData[byproductEmissionMonthIndex] = {
                  ...newByproductEmissionData[byproductEmissionMonthIndex],
                  value: byproductEmissionValue,
                  unit: 'tCO₂e'
                };
                byproductChanged = true;
              }
            } else if (byproductEmissionValue > 0) {
              // 确保排放量大于0时才添加新数据
              newByproductEmissionData.push({
                month,
                monthName: MONTHS[monthIndex],
                value: byproductEmissionValue,
                unit: 'tCO₂e'
              });
              byproductChanged = true;
            }
            
            // 应用更新
            if (byproductChanged) {
              unitChanged = true;
              return {
                ...updatedByproduct,
                data: {
                  ...updatedByproduct.data,
                  byproductEmission: newByproductEmissionData
                }
              };
            }
            
            return updatedByproduct;
          });
          
          // 应用更新
          updatedUnit = {
            ...updatedUnit,
            data: {
              ...updatedUnit.data,
              leakageEmission: newLeakageData
            },
            byproducts: updatedByproducts
          };
        }
        
        if (unitChanged) {
          hasChanges = true;
          return updatedUnit;
        }
        
        return unit;
      });
      
      return hasChanges ? updatedUnits : prevUnits;
    });
  }, [setElectronicMaterials]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, electronicMaterials]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'electronic-unit', parentId = null) => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    const setState = type === 'byproduct' ? setElectronicMaterials : setElectronicMaterials;
    
    setState(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id || item.id === parentId) {
          if (type === 'byproduct' && item.id === parentId) {
            // 处理副产品数据变化
            const updatedByproducts = item.byproducts.map(byproduct => {
              if (byproduct.id === id) {
                const currentData = byproduct.data || {};
                const currentIndicatorData = currentData[indicatorKey] || [];
                
                // 创建新数组以避免直接修改原数组
                const updatedIndicatorData = [...currentIndicatorData];
                const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
                
                if (monthIndex !== -1) {
                  // 更新现有月份数据
                  if (updatedIndicatorData[monthIndex][field] !== formattedValue) {
                    updatedIndicatorData[monthIndex] = {
                      ...updatedIndicatorData[monthIndex],
                      [field]: formattedValue
                    };
                    hasChanges = true;
                  }
                } else {
                  // 如果月份数据不存在，创建它
                  hasChanges = true;
                  const indicatorDefinition = BYPRODUCT_INDICATORS.find(ind => ind.key === indicatorKey);
                  
                  updatedIndicatorData.push({
                    month,
                    monthName: MONTHS[month - 1],
                    value: field === 'value' ? formattedValue : '',
                    dataSource: '',
                    supportingMaterial: null,
                    unit: indicatorDefinition?.unit || ''
                  });
                }
                
                // 只有在有变化时才创建新对象
                if (hasChanges) {
                  return {
                    ...byproduct,
                    data: {
                      ...currentData,
                      [indicatorKey]: updatedIndicatorData
                    }
                  };
                }
              }
              return byproduct;
            });
            
            return {
              ...item,
              byproducts: updatedByproducts
            };
          } else {
            // 处理电子原料气数据变化
            const currentData = item.data || {};
            const currentIndicatorData = currentData[indicatorKey] || [];
            
            // 创建新数组以避免直接修改原数组
            const updatedIndicatorData = [...currentIndicatorData];
            const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
            
            if (monthIndex !== -1) {
              // 更新现有月份数据
              if (updatedIndicatorData[monthIndex][field] !== formattedValue) {
                updatedIndicatorData[monthIndex] = {
                  ...updatedIndicatorData[monthIndex],
                  [field]: formattedValue
                };
                hasChanges = true;
              }
            } else {
              // 如果月份数据不存在，创建它
              hasChanges = true;
              const indicatorDefinition = INDICATORS.find(ind => ind.key === indicatorKey);
              
              updatedIndicatorData.push({
                month,
                monthName: MONTHS[month - 1],
                value: field === 'value' ? formattedValue : '',
                dataSource: '',
                supportingMaterial: null,
                unit: indicatorDefinition?.unit || ''
              });
            }
            
            // 只有在有变化时才创建新对象
            if (hasChanges) {
              return {
                ...item,
                data: {
                  ...currentData,
                  [indicatorKey]: updatedIndicatorData
                }
              };
            }
          }
        }
        return item;
      });
      
      return hasChanges ? updatedItems : prevItems;
    });
  }, [setElectronicMaterials]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'electronic-unit', parentId = null) => {
    if (!file) return;
    
    const setState = setElectronicMaterials;
    
    setState(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          if (type === 'byproduct') {
            // 处理副产品文件上传
            const updatedByproducts = item.byproducts.map(byproduct => {
              if (byproduct.id === parentId) {
                const currentData = byproduct.data || {};
                const currentIndicatorData = currentData[indicatorKey] || [];
                
                // 创建新数组以避免直接修改原数组
                const updatedIndicatorData = [...currentIndicatorData];
                
                // 创建或更新文件信息
                const updatedFiles = { ...byproduct.files };
                const fileKey = `${indicatorKey}-${month}`;
                updatedFiles[fileKey] = file;
                
                const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
                
                if (monthIndex !== -1) {
                  // 更新现有月份数据
                  if (updatedIndicatorData[monthIndex].supportingMaterial !== file) {
                    updatedIndicatorData[monthIndex] = {
                      ...updatedIndicatorData[monthIndex],
                      supportingMaterial: file
                    };
                    hasChanges = true;
                  }
                } else {
                  // 如果月份数据不存在，创建它
                  hasChanges = true;
                  const indicatorDefinition = BYPRODUCT_INDICATORS.find(ind => ind.key === indicatorKey);
                  
                  updatedIndicatorData.push({
                    month,
                    monthName: MONTHS[month - 1],
                    value: '',
                    dataSource: '',
                    supportingMaterial: file,
                    unit: indicatorDefinition?.unit || ''
                  });
                }
                
                // 只有在有变化时才创建新对象
                if (hasChanges) {
                  return {
                    ...byproduct,
                    data: {
                      ...currentData,
                      [indicatorKey]: updatedIndicatorData
                    },
                    files: updatedFiles
                  };
                }
              }
              return byproduct;
            });
            
            return {
              ...item,
              byproducts: updatedByproducts
            };
          } else {
            // 处理电子原料气文件上传
            const currentData = item.data || {};
            const currentIndicatorData = currentData[indicatorKey] || [];
            
            // 创建新数组以避免直接修改原数组
            const updatedIndicatorData = [...currentIndicatorData];
            
            // 创建或更新文件信息
            const updatedFiles = { ...item.files };
            const fileKey = `${indicatorKey}-${month}`;
            updatedFiles[fileKey] = file;
            
            const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
            
            if (monthIndex !== -1) {
              // 更新现有月份数据
              if (updatedIndicatorData[monthIndex].supportingMaterial !== file) {
                updatedIndicatorData[monthIndex] = {
                  ...updatedIndicatorData[monthIndex],
                  supportingMaterial: file
                };
                hasChanges = true;
              }
            } else {
              // 如果月份数据不存在，创建它
              hasChanges = true;
              const indicatorDefinition = INDICATORS.find(ind => ind.key === indicatorKey);
              
              updatedIndicatorData.push({
                month,
                monthName: MONTHS[month - 1],
                value: '',
                dataSource: '',
                supportingMaterial: file,
                unit: indicatorDefinition?.unit || ''
              });
            }
            
            // 只有在有变化时才创建新对象
            if (hasChanges) {
              return {
                ...item,
                data: {
                  ...currentData,
                  [indicatorKey]: updatedIndicatorData
                },
                files: updatedFiles
              };
            }
          }
        }
        return item;
      });
      
      return hasChanges ? updatedItems : prevItems;
    });
  }, [setElectronicMaterials]);

  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    electronicMaterials.forEach(material => {
      // 计算泄漏排放量
      if (material.data && material.data['leakageEmission']) {
        material.data['leakageEmission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
      
      // 计算副产品排放量
      if (material.byproducts) {
        material.byproducts.forEach(byproduct => {
          if (byproduct.data && byproduct.data['byproductEmission']) {
            byproduct.data['byproductEmission'].forEach(monthData => {
              total += parseFloat(monthData.value) || 0;
            });
          }
        });
      }
    });
    
    return total;
  }, [electronicMaterials]);
  
  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);
  
  // 渲染纵向布局的表格
  const renderVerticalLayoutTable = (item, isByproduct = false, parentId = null) => {
    if (!item.data) return null;
    
    const indicators = isByproduct ? BYPRODUCT_INDICATORS : INDICATORS;
    
    // 表头：指标名称、单位、获取方式、数据来源、支撑材料、1-12月、全年值
    const tableHeaders = (
      <thead>
        <tr style={{ backgroundColor: '#f5f5f5' }}>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>指标名称</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>单位</th>
          {MONTHS.map((month, index) => (
            <th key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{month}</th>
          ))}
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>全年值</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>获取方式</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>数据来源</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>支撑材料</th>
        </tr>
      </thead>
    );
    
    // 表体：各指标的数据行
    const tableBody = (
      <tbody>
        {indicators.map(indicator => {
          // 获取当前指标的所有月份数据
          const indicatorData = item.data[indicator.key] || [];
          
          // 计算全年值
          let yearlyValue = 0;
          if (indicator.isCalculated) {
            yearlyValue = indicatorData.reduce((sum, monthData) => {
              const value = parseFloat(monthData.value) || 0;
              return sum + value;
            }, 0);
          }
          
          return (
              <tr key={indicator.key}>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>{indicator.name}</td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{indicator.unit}</td>
                
                {MONTHS.map((month, index) => {
                  const monthNum = index + 1;
                  const monthData = indicatorData.find(d => d.month === monthNum);
                  const value = monthData?.value || '';
                  
                  return (
                    <td key={monthNum} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                      {indicator.isCalculated ? (
                        // 计算值，只显示
                        <span>{formatValue(value, indicator.decimalPlaces)}</span>
                      ) : indicator.readOnly ? (
                        // 只读值，显示文本
                        <span>{formatValue(value, indicator.decimalPlaces)}</span>
                      ) : (
                        // 输入值
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleDataChange(item.id, indicator.key, monthNum, 'value', e.target.value, isByproduct ? 'byproduct' : 'electronic-unit', parentId)}
                          style={{
                            width: '80px',
                            textAlign: 'center',
                            border: '1px solid #d9d9d9',
                            padding: '4px'
                          }}
                        />
                      )}
                    </td>
                  );
                })}
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                  {indicator.isCalculated ? (
                    formatValue(yearlyValue, indicator.decimalPlaces)
                  ) : (
                    '-' // 非计算值不显示全年值
                  )}
                </td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                  {indicator.isCalculated ? '计算值' : ''}
                </td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                  {indicator.isCalculated ? (
                    '-' // 计算值不需要数据来源
                  ) : (
                    <input
                      type="text"
                      placeholder="输入数据来源"
                      value={indicatorData[0]?.dataSource || ''}
                      onChange={(e) => {
                        // 为所有月份设置相同的数据来源
                        MONTHS.forEach((_, idx) => {
                          handleDataChange(item.id, indicator.key, idx + 1, 'dataSource', e.target.value, isByproduct ? 'byproduct' : 'electronic-unit', parentId);
                        });
                      }}
                      style={{
                        width: '100px',
                        border: '1px solid #d9d9d9',
                        padding: '4px'
                      }}
                    />
                  )}
                </td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                  {indicator.isCalculated ? (
                    '-' // 计算值不需要支撑材料
                  ) : (
                    <input
                      type="file"
                      onChange={(e) => {
                        // 为所有月份设置相同的支撑材料
                        MONTHS.forEach((_, idx) => {
                          handleFileUpload(item.id, indicator.key, idx + 1, e.target.files[0], isByproduct ? 'byproduct' : 'electronic-unit', parentId);
                        });
                      }}
                      style={{
                        fontSize: '12px'
                      }}
                    />
                  )}
                </td>
              </tr>
            );
        })}
      </tbody>
    );
    
    return (
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '16px' }}>
        {tableHeaders}
        {tableBody}
      </table>
    );
  };
  
  // 计算各月排放量
  const calculateMonthlyEmissionTotals = () => {
    const totalEmissions = [];
    
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      
      // 计算各电子原料气排放量
      electronicMaterials.forEach(material => {
        // 计算泄漏排放量
        if (material.data && material.data['leakageEmission']) {
          const emissionData = material.data['leakageEmission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          monthTotal += parseFloat(emissionValue) || 0;
        }
        
        // 计算副产品排放量
        if (material.byproducts) {
          material.byproducts.forEach(byproduct => {
            if (byproduct.data && byproduct.data['byproductEmission']) {
              const emissionData = byproduct.data['byproductEmission'];
              const monthData = emissionData.find(d => d.month === month + 1);
              const emissionValue = monthData?.value || 0;
              monthTotal += parseFloat(emissionValue) || 0;
            }
          });
        }
      });
      
      totalEmissions.push(monthTotal);
    }
    
    return totalEmissions;
  };
  
  // 渲染总排放量统计表格
  const renderTotalEmissionTable = () => {
    const totalEmissions = calculateMonthlyEmissionTotals();
    
    // 计算全年总计
    const totalYear = totalEmissions.reduce((sum, value) => sum + value, 0);
    
    return (
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '24px', backgroundColor: '#f9f9f9' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>指标</th>
            {MONTHS.map((month, index) => (
              <th key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>{month}</th>
            ))}
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>全年总计 (tCO₂e)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>电子设备制造业工业生产过程排放总量</td>
            {totalEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 3)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {formatValue(totalYear, 3)}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>电子设备制造业工业生产过程排放</h2>

      {/* 电子设备制造业工业生产过程排放说明 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '12px' }}>排放说明</h3>
            <p>电子设备制造业的工业生产过程排放主要由刻蚀与CVD腔室清洗工序产生，过程中产生的温室气体排放由原料气的泄漏与生产过程中生成的副产品（温室气体）的排放构成。</p>
            <p>原料气包括但不限于：NF₃、SF₆、CF₄、C₂F₆、C₃F₈、C₄F₆、c-C₄F₈、c-C₄F₈O、C₅F₈、CHF₃、CH₂F₂、CH₃F。</p>
            <p>副产品包括但不限于：CF₄、C₂F₆、C₃F₈。</p>
            
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>注意事项：</h4>
            <ul style={{ marginLeft: '20px' }}>
              <li>原料气容器的气体残余比例采用推荐值10%，但允许用户修改</li>
              <li>所有效率值以百分比表示（如0.9表示90%）</li>
            </ul>

            <button 
              onClick={() => setShowDefaultsModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}
            >
              📊 查看缺省值表格
            </button>

            <h3 style={{ marginBottom: '12px', marginTop: '20px' }}>计算说明</h3>
            <p><strong>原料气体泄漏排放计算：</strong></p>
            <p>E<sub>EFC,i</sub> = (1-h) × FC<sub>i</sub> × (1 - U<sub>i</sub>) × (1 - a<sub>i</sub> × d<sub>i</sub>) × GWP<sub>i</sub></p>
            <p>其中：</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>h：原料气容器的气体残余比例，%</li>
              <li>FC<sub>i</sub>：报告期内第i种原料气的使用量，t</li>
              <li>U<sub>i</sub>：第i种原料气的利用率，%</li>
              <li>a<sub>i</sub>：废气处理装置对第i种原料气的收集效率，%</li>
              <li>d<sub>i</sub>：废气处理装置对第i种原料气的去除效率，%</li>
              <li>GWP<sub>i</sub>：第i种原料气的全球变暖潜势</li>
            </ul>
            
            <p><strong>副产品排放计算：</strong></p>
            <p>第j种副产品的排放 = (1-h) × FC<sub>i</sub> × B<sub>i,j</sub> × (1 - a<sub>j</sub> × d<sub>j</sub>) × GWP<sub>j</sub></p>
            <p>其中：</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>B<sub>i,j</sub>：第i种原料气产生的第j种副产品的转化因子，t副产品/t原料气</li>
              <li>GWP<sub>j</sub>：第j种副产品的全球变暖潜势</li>
              <li>a<sub>j</sub>：废气处理装置对第j种副产品的收集效率，%</li>
              <li>d<sub>j</sub>：废气处理装置对第j种副产品的去除效率，%</li>
            </ul>
            
            <p><strong>最终排放量：</strong></p>
            <p>对于每一种原料气的排放 = 原料气体泄漏产生的排放 + 这种原料气的副产品排放之和。</p>
            <p>最终总的排放就是所有原料气的排放之和。</p>
            
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>注意事项：</h4>
            <ul style={{ marginLeft: '20px' }}>
              <li>原料气容器的气体残余比例采用推荐值10%，但允许用户修改</li>
              <li>所有效率值以百分比表示（如0.9表示90%）</li>
            </ul>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加电子原料气排放记录</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            {/* 预设原料气选择 */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '16px', alignItems: 'end' }}>
              <select
                value={selectedGasType}
                onChange={(e) => setSelectedGasType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginRight: '12px'
                }}
              >
                <option value="">请选择原料气类型</option>
                {MATERIAL_GASES.map(gas => (
                  <option key={gas.value} value={gas.value}>
                    {gas.label}
                  </option>
                ))}
              </select>
              <button
                onClick={addNewElectronicMaterial}
                disabled={!selectedGasType}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: selectedGasType ? 1 : 0.6
                }}
              >
                添加原料气排放记录
              </button>
            </div>
            
            {/* 或输入自定义原料气 */}
            <div style={{ display: 'flex', alignItems: 'end', gap: '12px' }}>
              <div style={{ color: '#666', fontSize: '14px', marginRight: '8px' }}>或</div>
              <input
                type="text"
                value={customGasName}
                onChange={(e) => setCustomGasName(e.target.value)}
                placeholder="输入自定义原料气名称"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '200px'
                }}
              />
              <input
                type="number"
                value={customGasGwp}
                onChange={(e) => setCustomGasGwp(e.target.value)}
                placeholder="GWP值"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100px'
                }}
              />
              <button
                onClick={addNewElectronicMaterial}
                disabled={!customGasName.trim() || !customGasGwp.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: (customGasName.trim() && customGasGwp.trim()) ? 1 : 0.6
                }}
              >
                添加自定义原料气
              </button>
            </div>
          </div>
        </div>
        
        <div>
          {electronicMaterials.map((material, index) => (
            <div key={material.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>{material.gasLabel}</h3>
                  <span style={{ fontSize: '14px', color: '#666' }}>GWP: {material.data?.gwp?.[0]?.value || 0}</span>
                </div>
                <button
                  onClick={() => removeElectronicMaterial(material.id)}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  删除
                </button>
              </div>
              
              {renderVerticalLayoutTable(material)}
              
              {/* 副产品部分 */}
              <div style={{ marginTop: '24px', paddingLeft: '20px', borderLeft: '3px solid #1890ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#1890ff' }}>副产品排放</h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                    {/* 预设副产品选择 */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addByproduct(material.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">添加预设副产品</option>
                      {BYPRODUCT_TYPES.map(byproduct => (
                        <option key={byproduct.value} value={byproduct.value}>
                          {byproduct.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* 自定义副产品输入 */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'end' }}>
                      <input
                        type="text"
                        value={material.customByproductName || ''}
                        onChange={(e) => {
                          setElectronicMaterials(prevMaterials =>
                            prevMaterials.map(m => 
                              m.id === material.id 
                                ? { ...m, customByproductName: e.target.value }
                                : m
                            )
                          );
                        }}
                        placeholder="或输入自定义副产品"
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '150px'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && material.customByproductName?.trim()) {
                            addByproduct(material.id, null, material.customByproductName.trim());
                            // 清除输入
                            setElectronicMaterials(prevMaterials =>
                              prevMaterials.map(m => 
                                m.id === material.id 
                                  ? { ...m, customByproductName: '' }
                                  : m
                              )
                            );
                          }
                        }}
                      />
                      <input
                        type="text"
                        value={material.customByproductGwp || ''}
                        onChange={(e) => {
                          setElectronicMaterials(prevMaterials =>
                            prevMaterials.map(m => 
                              m.id === material.id 
                                ? { ...m, customByproductGwp: e.target.value }
                                : m
                            )
                          );
                        }}
                        placeholder="副产品GWP值"
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '150px'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && material.customByproductGwp?.trim() && material.customByproductName?.trim()) {
                            addByproduct(material.id, null, material.customByproductName.trim(), material.customByproductGwp.trim());
                            // 清除输入
                            setElectronicMaterials(prevMaterials =>
                              prevMaterials.map(m => 
                                m.id === material.id 
                                  ? { ...m, customByproductGwp: '' }
                                  : m
                              )
                            );
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (material.customByproductName?.trim() && material.customByproductGwp?.trim()) {
                            addByproduct(material.id, null, material.customByproductName.trim(), material.customByproductGwp.trim());
                            // 清除输入
                            setElectronicMaterials(prevMaterials =>
                              prevMaterials.map(m => 
                                m.id === material.id 
                                  ? { ...m, customByproductName: '', customByproductGwp: '' }
                                  : m
                              )
                            );
                          }
                        }}
                        disabled={!material.customByproductName?.trim() || !material.customByproductGwp?.trim()}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#722ed1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: material.customByproductName?.trim() && material.customByproductGwp?.trim() ? 1 : 0.6
                        }}
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>
                
                {material.byproducts && material.byproducts.map(byproduct => (
                  <div key={byproduct.id} style={{ marginBottom: '24px', border: '1px solid #d9d9d9', padding: '12px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h5 style={{ margin: 0, fontSize: '14px', marginRight: '16px' }}>{byproduct.byproductLabel}</h5>
                        <span style={{ fontSize: '12px', color: '#666' }}>GWP: {byproduct.data?.byproductGwp?.[0]?.value || 0}</span>
                      </div>
                      <button
                        onClick={() => removeByproduct(material.id, byproduct.id)}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#ff7875',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        删除
                      </button>
                    </div>
                    
                    {renderVerticalLayoutTable(byproduct, true, material.id)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {/* 缺省值表格弹出窗口 */}
      {showDefaultsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowDefaultsModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f5f5f5';
                e.target.style.color = '#333';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#999';
              }}
            >
              ×
            </button>
            
            <h2 style={{ margin: '0 0 20px 0', color: '#1890ff', textAlign: 'center' }}>
              📊 各原料气缺省参数值
            </h2>
            
            <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>
              以下表格列出了各原料气的缺省参数值，当添加原料气或副产品时，系统会自动填入这些缺省值：
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginBottom: '20px', 
                fontSize: '14px',
                backgroundColor: 'white'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>原料气</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>利用率(%)</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>收集效率(%)</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>去除效率(%)</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>转化因子默认值</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(DEFAULT_EMISSION_FACTORS).map(([gasType, factors]) => {
                    const gasLabel = MATERIAL_GASES.find(g => g.value === gasType)?.label || gasType;
                    const conversionFactors = factors.conversionFactors || {};
                    const conversionEntries = Object.entries(conversionFactors);
                    
                    return conversionEntries.length > 0 ? conversionEntries.map(([byproductType, factor], index) => {
                      const byproductLabel = BYPRODUCT_TYPES.find(b => b.value === byproductType)?.label || byproductType;
                      const isFirst = index === 0;
                      
                      return (
                        <tr key={`${gasType}-${byproductType}`} style={{ transition: 'background-color 0.2s' }}>
                          {isFirst && (
                            <td style={{ 
                              border: '1px solid #d9d9d9', 
                              padding: '12px 8px', 
                              fontWeight: 'bold',
                              backgroundColor: '#fafafa'
                            }} rowSpan={conversionEntries.length}>
                              {gasLabel}
                            </td>
                          )}
                          <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>
                            {factors.utilizationRate || '-'}
                          </td>
                          <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>
                            {factors.collectionEfficiency || '-'}
                          </td>
                          <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>
                            {factors.removalEfficiency || '-'}
                          </td>
                          <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>
                            {byproductLabel}: {factor}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr key={gasType} style={{ transition: 'background-color 0.2s' }}>
                        <td style={{ 
                          border: '1px solid #d9d9d9', 
                          padding: '12px 8px', 
                          fontWeight: 'bold',
                          backgroundColor: '#fafafa'
                        }}>{gasLabel}</td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>
                          {factors.utilizationRate || '-'}
                        </td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>
                          {factors.collectionEfficiency || '-'}
                        </td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>
                          {factors.removalEfficiency || '-'}
                        </td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '12px 8px', textAlign: 'center' }}>-</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div style={{ 
              backgroundColor: '#f6f8fa', 
              border: '1px solid #e1e4e8', 
              borderRadius: '6px', 
              padding: '15px', 
              marginTop: '20px' 
            }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                <strong style={{ color: '#333' }}>说明：</strong><br/>
                • 缺省值会在用户添加原料气或副产品时自动填入相应字段<br/>
                • 用户可以根据实际情况修改这些缺省值<br/>
                • 转化因子默认值表示原料气产生特定副产品的转化比例<br/>
                • 副产品的收集效率和去除效率会自动继承其父原料气的缺省值
              </p>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '25px' }}>
              <button
                onClick={() => setShowDefaultsModal(false)}
                style={{
                  padding: '10px 30px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#40a9ff';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#1890ff';
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default ElectronicProcessEmission;