import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 默认熔剂配置
const DEFAULT_FLUXES = [
  { id: 'flux-1', name: '石灰石', emissionFactor: 0.440 },
  { id: 'flux-2', name: '白云石', emissionFactor: 0.471 }
];

const DEFAULT_ELECTRODES = [
  { id: 'electrode-1', name: '电极', emissionFactor: 3.663 }
];

// 默认外购含碳原料配置
const DEFAULT_CARBON_MATERIALS = [
  { id: 'carbon-material-1', name: '生铁', emissionFactor: 0.172 },
  { id: 'carbon-material-2', name: '直接还原铁', emissionFactor: 0.073 },
  { id: 'carbon-material-3', name: '镍铁合金', emissionFactor: 0.037 },
  { id: 'carbon-material-4', name: '硅铁合金', emissionFactor: 0.007 },
  { id: 'carbon-material-5', name: '钼铁合金', emissionFactor: 0.018 },
  { id: 'carbon-material-6', name: '锰硅合金', emissionFactor: 0.092 },
  { id: 'carbon-material-7', name: '低碳锰硅合金', emissionFactor: 0.011 },
  { id: 'carbon-material-8', name: '高炉锰铁', emissionFactor: 0.275 },
  { id: 'carbon-material-9', name: '电炉高碳锰铁', emissionFactor: 0.275 },
  { id: 'carbon-material-10', name: '微碳锰铁', emissionFactor: 0.004 },
  { id: 'carbon-material-11', name: '高碳铬铁', emissionFactor: 0.348 },
  { id: 'carbon-material-12', name: '废钢', emissionFactor: 0.037 }
];

// 熔剂排放计算指标
const FLUX_INDICATORS = [
  {
    key: 'purchaseAmount',
    name: '熔剂净购入使用量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'emissionFactor',
    name: '熔剂排放因子',
    unit: 'tCO₂/t',
    isCalculated: false,
    decimalPlaces: 3
  },
  {
    key: 'emission',
    name: '熔剂消耗产生的二氧化碳排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2
  }
];

// 电极排放计算指标
const ELECTRODE_INDICATORS = [
  {
    key: 'purchaseAmount',
    name: '电极净购入使用量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'emissionFactor',
    name: '电极排放因子',
    unit: 'tCO₂/t',
    isCalculated: false,
    decimalPlaces: 3
  },
  {
    key: 'emission',
    name: '电极消耗产生的二氧化碳排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2
  }
];

// 外购含碳原料排放计算指标
const CARBON_MATERIAL_INDICATORS = [
  {
    key: 'purchaseAmount',
    name: '外购含碳原料净购入使用量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'emissionFactor',
    name: '外购含碳原料排放因子',
    unit: 'tCO₂/t',
    isCalculated: false,
    decimalPlaces: 3
  },
  {
    key: 'emission',
    name: '外购含碳原料消耗产生的二氧化碳排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2
  }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = () => {
  const indicators = FLUX_INDICATORS;
  
  // 为每个指标创建包含12个月数据的对象
  return indicators.reduce((acc, indicator) => {
    acc[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: indicator.isCalculated ? 0 : (indicator.key === 'emissionFactor' ? 0 : ''),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 为熔剂初始化数据（纵向布局）
const initializeFluxData = (flux) => {
  const initialData = createInitialIndicatorData();
  
  // 为排放因子设置默认值和额外字段
  initialData.emissionFactor = initialData.emissionFactor.map(item => ({
    ...item,
    value: flux.emissionFactor,
    dataSource: '', // 数据来源
    supportingMaterial: null // 支撑材料
  }));
  
  // 为净购入使用量初始化额外字段
  initialData.purchaseAmount = initialData.purchaseAmount.map(item => ({
    ...item,
    value: item.value,
    dataSource: '', // 数据来源
    supportingMaterial: null // 支撑材料
  }));
  
  return {
    ...flux,
    data: initialData,
    files: {},
    isDefault: flux.id === 'flux-1' || flux.id === 'flux-2' // 标记默认熔剂
  };
};

// 为电极初始化数据（纵向布局）
const initializeElectrodeData = (electrode) => {
  const initialData = createInitialIndicatorData();
  
  // 为排放因子设置默认值和额外字段
  initialData.emissionFactor = initialData.emissionFactor.map(item => ({
    ...item,
    value: electrode.emissionFactor,
    dataSource: '', // 数据来源
    supportingMaterial: null // 支撑材料
  }));
  
  // 为净购入使用量初始化额外字段
  initialData.purchaseAmount = initialData.purchaseAmount.map(item => ({
    ...item,
    value: item.value,
    dataSource: '', // 数据来源
    supportingMaterial: null // 支撑材料
  }));
  
  return {
    ...electrode,
    data: initialData,
    files: {},
    isDefault: electrode.id === 'electrode-1' // 标记默认电极
  };
};

// 为外购含碳原料初始化数据（纵向布局）
const initializeCarbonMaterialData = (material) => {
  // 修改createInitialIndicatorData调用，使用外购含碳原料的指标
  const initialData = {};
  
  // 使用CARBON_MATERIAL_INDICATORS创建初始数据
  CARBON_MATERIAL_INDICATORS.forEach(indicator => {
    initialData[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: indicator.isCalculated ? 0 : (indicator.key === 'emissionFactor' ? material.emissionFactor : ''),
      unit: indicator.unit,
      dataSource: '',
      supportingMaterial: null
    }));
  });
  
  // 为排放因子设置默认值
  if (initialData.emissionFactor) {
    initialData.emissionFactor = initialData.emissionFactor.map(item => ({
      ...item,
      value: material.emissionFactor,
      dataSource: '',
      supportingMaterial: null
    }));
  }
  
  // 为净购入使用量初始化额外字段
  if (initialData.purchaseAmount) {
    initialData.purchaseAmount = initialData.purchaseAmount.map(item => ({
      ...item,
      dataSource: '',
      supportingMaterial: null
    }));
  }
  
  return {
    ...material,
    data: initialData,
    files: {},
    // 标记所有默认的外购含碳原料
    isDefault: DEFAULT_CARBON_MATERIALS.some(defaultMaterial => defaultMaterial.id === material.id)
  };
};

function SteelProcessEmission({ onEmissionChange, onProductionLinesChange }) {
  // 熔剂列表状态
  const [fluxes, setFluxes] = useState([]);
  
  // 电极列表状态
  const [electrodes, setElectrodes] = useState([]);
  
  // 外购含碳原料列表状态
  const [carbonMaterials, setCarbonMaterials] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 初始化默认数据
  useEffect(() => {
    const initializedFluxes = DEFAULT_FLUXES.map(flux => initializeFluxData(flux));
    setFluxes(initializedFluxes);
    
    const initializedElectrodes = DEFAULT_ELECTRODES.map(electrode => initializeElectrodeData(electrode));
    setElectrodes(initializedElectrodes);
    
    const initializedCarbonMaterials = DEFAULT_CARBON_MATERIALS.map(material => initializeCarbonMaterialData(material));
    setCarbonMaterials(initializedCarbonMaterials);
  }, []);
  
  // 添加新的自定义熔剂
  const addNewFlux = useCallback(() => {
    const newFluxId = `flux-${Date.now()}`;
    const newFlux = {
      id: newFluxId,
      name: '新熔剂',
      emissionFactor: 0
    };
    
    const initializedNewFlux = initializeFluxData(newFlux);
    setFluxes(prevFluxes => [...prevFluxes, initializedNewFlux]);
  }, []);
  
  // 添加新的自定义外购含碳原料
  const addNewCarbonMaterial = useCallback(() => {
    const newMaterialId = `carbon-material-${Date.now()}`;
    const newMaterial = {
      id: newMaterialId,
      name: '新外购含碳原料',
      emissionFactor: 0
    };
    
    const initializedNewMaterial = initializeCarbonMaterialData(newMaterial);
    setCarbonMaterials(prevMaterials => [...prevMaterials, initializedNewMaterial]);
  }, []);
  
  // 移除熔剂（仅支持移除非默认熔剂）
  const removeFlux = useCallback((fluxId) => {
    setFluxes(prevFluxes => {
      const fluxToRemove = prevFluxes.find(flux => flux.id === fluxId);
      // 只允许移除非默认熔剂
      if (fluxToRemove && !fluxToRemove.isDefault) {
        return prevFluxes.filter(flux => flux.id !== fluxId);
      }
      return prevFluxes;
    });
  }, []);
  
  // 移除外购含碳原料（仅支持移除非默认原料）
  const removeCarbonMaterial = useCallback((materialId) => {
    setCarbonMaterials(prevMaterials => {
      const materialToRemove = prevMaterials.find(material => material.id === materialId);
      // 只允许移除非默认原料
      if (materialToRemove && !materialToRemove.isDefault) {
        return prevMaterials.filter(material => material.id !== materialId);
      }
      return prevMaterials;
    });
  }, []);
  
  // 更新熔剂名称
  const updateFluxName = useCallback((fluxId, newName) => {
    setFluxes(prevFluxes => prevFluxes.map(flux => 
      flux.id === fluxId ? { ...flux, name: newName } : flux
    ));
  }, []);
  
  // 更新外购含碳原料名称
  const updateCarbonMaterialName = useCallback((materialId, newName) => {
    setCarbonMaterials(prevMaterials => prevMaterials.map(material => 
      material.id === materialId ? { ...material, name: newName } : material
    ));
  }, []);
  
  // 格式化数值显示
  const formatValue = (value, decimalPlaces = 2) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toFixed(decimalPlaces);
  };
  
  // 更新计算值 - 实现排放量计算逻辑（同时处理熔剂和电极）
  const updateCalculatedValues = useCallback(() => {
    // 处理熔剂数据计算
    setFluxes(prevFluxes => {
      let hasChanges = false;
      const updatedFluxes = prevFluxes.map(flux => {
        if (!flux.data) return flux;
        
        let updatedFlux = { ...flux, data: { ...flux.data } };
        let fluxChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的净购入使用量和排放因子
          const purchaseAmountData = flux.data.purchaseAmount?.find(m => m.month === month);
          const purchaseAmountValue = purchaseAmountData?.value ? parseFloat(purchaseAmountData.value) : 0;
          
          const emissionFactorData = flux.data.emissionFactor?.find(m => m.month === month);
          const emissionFactorValue = emissionFactorData?.value || flux.emissionFactor || 0;
          
          // 计算排放量：使用量 * 排放因子
          const emissionValue = Math.max(0, purchaseAmountValue) * emissionFactorValue;
          
          // 更新排放量数据
          const currentEmissionData = updatedFlux.data.emission || [];
          const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
          const newEmissionData = [...currentEmissionData];
          
          if (emissionMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newEmissionData[emissionMonthIndex].value) !== emissionValue) {
              newEmissionData[emissionMonthIndex] = {
                ...newEmissionData[emissionMonthIndex],
                value: emissionValue,
                unit: 'tCO₂'
              };
              fluxChanged = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂'
            });
            fluxChanged = true;
          }
          
          // 应用更新
          updatedFlux = {
            ...updatedFlux,
            data: {
              ...updatedFlux.data,
              emission: newEmissionData
            }
          };
        }
        
        if (fluxChanged) {
          hasChanges = true;
          return updatedFlux;
        }
        
        return flux;
      });
      
      return hasChanges ? updatedFluxes : prevFluxes;
    });
    
    // 处理电极数据计算（与熔剂计算逻辑相同）
    setElectrodes(prevElectrodes => {
      let hasChanges = false;
      const updatedElectrodes = prevElectrodes.map(electrode => {
        if (!electrode.data) return electrode;
        
        let updatedElectrode = { ...electrode, data: { ...electrode.data } };
        let electrodeChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的净购入使用量和排放因子
          const purchaseAmountData = updatedElectrode.data.purchaseAmount?.find(m => m.month === month);
          const purchaseAmountValue = purchaseAmountData?.value ? parseFloat(purchaseAmountData.value) : 0;
          
          const emissionFactorData = updatedElectrode.data.emissionFactor?.find(m => m.month === month);
          const emissionFactorValue = emissionFactorData?.value || electrode.emissionFactor || 0;
          
          // 计算排放量：使用量 * 排放因子
          const emissionValue = Math.max(0, purchaseAmountValue) * emissionFactorValue;
          
          // 更新排放量数据
          const currentEmissionData = updatedElectrode.data.emission || [];
          const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
          const newEmissionData = [...currentEmissionData];
          
          if (emissionMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newEmissionData[emissionMonthIndex].value) !== emissionValue) {
              newEmissionData[emissionMonthIndex] = {
                ...newEmissionData[emissionMonthIndex],
                value: emissionValue,
                unit: 'tCO₂'
              };
              electrodeChanged = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂'
            });
            electrodeChanged = true;
          }
          
          // 应用更新
          updatedElectrode = {
            ...updatedElectrode,
            data: {
              ...updatedElectrode.data,
              emission: newEmissionData
            }
          };
        }
        
        if (electrodeChanged) {
          hasChanges = true;
          return updatedElectrode;
        }
        
        return electrode;
      });
      
      return hasChanges ? updatedElectrodes : prevElectrodes;
    });
    
    // 处理外购含碳原料数据计算（与熔剂和电极计算逻辑相同）
    setCarbonMaterials(prevMaterials => {
      let hasChanges = false;
      const updatedMaterials = prevMaterials.map(material => {
        if (!material.data) return material;
        
        let updatedMaterial = { ...material, data: { ...material.data } };
        let materialChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的净购入使用量和排放因子
          const purchaseAmountData = updatedMaterial.data.purchaseAmount?.find(m => m.month === month);
          const purchaseAmountValue = purchaseAmountData?.value ? parseFloat(purchaseAmountData.value) : 0;
          
          const emissionFactorData = updatedMaterial.data.emissionFactor?.find(m => m.month === month);
          const emissionFactorValue = emissionFactorData?.value || material.emissionFactor || 0;
          
          // 计算排放量：使用量 * 排放因子
          const emissionValue = Math.max(0, purchaseAmountValue) * emissionFactorValue;
          
          // 更新排放量数据
          const currentEmissionData = updatedMaterial.data.emission || [];
          const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
          const newEmissionData = [...currentEmissionData];
          
          if (emissionMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newEmissionData[emissionMonthIndex].value) !== emissionValue) {
              newEmissionData[emissionMonthIndex] = {
                ...newEmissionData[emissionMonthIndex],
                value: emissionValue,
                unit: 'tCO₂'
              };
              materialChanged = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂'
            });
            materialChanged = true;
          }
          
          // 应用更新
          updatedMaterial = {
            ...updatedMaterial,
            data: {
              ...updatedMaterial.data,
              emission: newEmissionData
            }
          };
        }
        
        if (materialChanged) {
          hasChanges = true;
          return updatedMaterial;
        }
        
        return material;
      });
      
      return hasChanges ? updatedMaterials : prevMaterials;
    });
  }, [setElectrodes, setFluxes, setCarbonMaterials]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, fluxes, carbonMaterials, electrodes]);
  
  // 处理数据变化（纵向布局）- 支持熔剂、电极和外购含碳原料
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'flux') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 根据类型选择相应的状态更新函数和指标定义
    let setState, indicators;
    if (type === 'flux') {
      setState = setFluxes;
      indicators = FLUX_INDICATORS;
    } else if (type === 'electrode') {
      setState = setElectrodes;
      indicators = ELECTRODE_INDICATORS;
    } else if (type === 'carbon-material') {
      setState = setCarbonMaterials;
      indicators = CARBON_MATERIAL_INDICATORS;
    } else {
      // 默认使用熔剂相关设置
      setState = setFluxes;
      indicators = FLUX_INDICATORS;
    }
    
    setState(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          // 确保data存在
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
            // 获取指标定义以确定单位
            const indicatorDefinition = indicators.find(ind => ind.key === indicatorKey);
            
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
            const updatedItem = {
              ...item,
              data: {
                ...currentData,
                [indicatorKey]: updatedIndicatorData
              }
            };
            
            return updatedItem;
          }
        }
        return item;
      });
      
      return hasChanges ? updatedItems : prevItems;
    });
    
    // 数据更新后，计算会在单独的useEffect中触发，避免循环
  }, [setFluxes, setElectrodes, setCarbonMaterials]);
  
  // 处理支撑材料文件上传 - 支持熔剂、电极和外购含碳原料
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'flux') => {
    // 根据类型选择相应的状态更新函数
    let setState;
    if (type === 'flux') {
      setState = setFluxes;
    } else if (type === 'electrode') {
      setState = setElectrodes;
    } else if (type === 'carbon-material') {
      setState = setCarbonMaterials;
    } else {
      setState = setFluxes; // 默认使用熔剂
    }
    
    setState(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === id && item.data && item.data[indicatorKey]) {
          const updatedIndicatorData = [...item.data[indicatorKey]];
          const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
          
          if (monthIndex !== -1) {
            // 更新支撑材料
            updatedIndicatorData[monthIndex] = {
              ...updatedIndicatorData[monthIndex],
              supportingMaterial: file.name
            };
            
            // 更新文件存储
            const updatedFiles = { ...item.files };
            updatedFiles[`${indicatorKey}-${month}`] = file;
            
            return {
              ...item,
              data: {
                ...item.data,
                [indicatorKey]: updatedIndicatorData
              },
              files: updatedFiles
            };
          }
        }
        return item;
      });
      
      return updatedItems;
    });
  }, [setFluxes, setElectrodes, setCarbonMaterials]);
  
  // 计算总排放量
  const totalEmission = useMemo(() => {
    let total = 0;
    
    // 计算熔剂排放量
    fluxes.forEach(flux => {
      if (!flux.data || !flux.data.emission) return;
      
      flux.data.emission.forEach(monthData => {
        const emission = parseFloat(monthData.value) || 0;
        total += emission;
      });
    });
    
    // 计算电极排放量
    electrodes.forEach(electrode => {
      if (!electrode.data || !electrode.data.emission) return;
      
      electrode.data.emission.forEach(monthData => {
        const emission = parseFloat(monthData.value) || 0;
        total += emission;
      });
    });
    
    // 计算外购含碳原料排放量
    carbonMaterials.forEach(material => {
      if (!material.data || !material.data.emission) return;
      
      material.data.emission.forEach(monthData => {
        const emission = parseFloat(monthData.value) || 0;
        total += emission;
      });
    });
    
    return total;
  }, [fluxes, electrodes, carbonMaterials]);
  
  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);
  
  // 渲染纵向布局的表格 - 支持熔剂、电极和外购含碳原料
  const renderVerticalLayoutTable = (item, type = 'flux') => {
    if (!item.data) return null;
    
    // 根据类型选择对应的指标定义
    let indicators;
    if (type === 'flux') {
      indicators = FLUX_INDICATORS;
    } else if (type === 'electrode') {
      indicators = ELECTRODE_INDICATORS;
    } else if (type === 'carbon-material') {
      indicators = CARBON_MATERIAL_INDICATORS;
    } else {
      indicators = FLUX_INDICATORS; // 默认使用熔剂指标
    }
    
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
          if (indicator.isCalculated || indicator.key === 'purchaseAmount') {
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
                      ) : (
                        // 输入值
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleDataChange(item.id, indicator.key, monthNum, 'value', e.target.value, type)}
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
                  {indicator.isCalculated || indicator.key === 'purchaseAmount' ? (
                    formatValue(yearlyValue, indicator.decimalPlaces)
                  ) : (
                    '-' // 排放因子不显示全年值
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
                          handleDataChange(item.id, indicator.key, idx + 1, 'dataSource', e.target.value, type);
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
                          handleFileUpload(item.id, indicator.key, idx + 1, e.target.files[0], type);
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
  
  // 计算各月排放量（分别计算各类别和总量）
  const calculateMonthlyEmissionTotals = () => {
    const fluxEmissions = [];
    const electrodeEmissions = [];
    const carbonMaterialEmissions = [];
    const totalEmissions = [];
    
    for (let month = 0; month < 12; month++) {
      let fluxTotal = 0;
      let electrodeTotal = 0;
      let carbonMaterialTotal = 0;
      
      // 计算熔剂排放量
      fluxes.forEach(flux => {
        if (flux.data && flux.data['emission']) {
          const emissionData = flux.data['emission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          fluxTotal += parseFloat(emissionValue) || 0;
        }
      });
      
      // 计算电极排放量
      electrodes.forEach(electrode => {
        if (electrode.data && electrode.data['emission']) {
          const emissionData = electrode.data['emission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          electrodeTotal += parseFloat(emissionValue) || 0;
        }
      });
      
      // 计算外购含碳原料排放量
      carbonMaterials.forEach(material => {
        if (material.data && material.data['emission']) {
          const emissionData = material.data['emission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          carbonMaterialTotal += parseFloat(emissionValue) || 0;
        }
      });
      
      // 计算总量
      const total = fluxTotal + electrodeTotal + carbonMaterialTotal;
      
      // 保存各类别排放量
      fluxEmissions.push(fluxTotal);
      electrodeEmissions.push(electrodeTotal);
      carbonMaterialEmissions.push(carbonMaterialTotal);
      totalEmissions.push(total);
    }
    
    return {
      fluxEmissions,
      electrodeEmissions,
      carbonMaterialEmissions,
      totalEmissions
    };
  };
  
  // 渲染总排放量统计表格
  const renderTotalEmissionTable = () => {
    const { fluxEmissions, electrodeEmissions, carbonMaterialEmissions, totalEmissions } = calculateMonthlyEmissionTotals();
    
    // 计算各类别的全年总计
    const fluxTotalYear = fluxEmissions.reduce((sum, value) => sum + value, 0);
    const electrodeTotalYear = electrodeEmissions.reduce((sum, value) => sum + value, 0);
    const carbonMaterialTotalYear = carbonMaterialEmissions.reduce((sum, value) => sum + value, 0);
    const totalYear = totalEmissions.reduce((sum, value) => sum + value, 0);
    
    return (
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '24px', backgroundColor: '#f9f9f9' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>指标</th>
            {MONTHS.map((month, index) => (
              <th key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>{month}</th>
            ))}
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>全年总计 (tCO₂)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>熔剂消耗排放量</td>
            {fluxEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              {formatValue(fluxTotalYear, 2)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>电极消耗排放量</td>
            {electrodeEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              {formatValue(electrodeTotalYear, 2)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>外购含碳原料消耗排放量</td>
            {carbonMaterialEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              {formatValue(carbonMaterialTotalYear, 2)}
            </td>
          </tr>
          <tr style={{ backgroundColor: '#e6f7ff' }}>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>合计排放量</td>
            {totalEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {formatValue(totalYear, 2)}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      <h2 style={{ marginBottom: '20px' }}>工业生产过程排放</h2>
      
      {/* 总排放量统计 */}
      {renderTotalEmissionTable()}

      {/* 明显分隔线 - */}
      <div style={{ 
        borderTop: '4px solid #1890ff', 
        margin: '40px 0', 
        paddingTop: '40px',
        backgroundColor: '#f0f8ff',
        padding: '20px',
        borderRadius: '4px'
      }}>
        <h3 style={{ margin: 0, color: '#1890ff' }}>熔剂部分</h3>
      </div>
      
      {/* 熔剂部分 */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>熔剂排放计算说明</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
            <p>熔剂消耗产生的二氧化碳排放量计算方法：排放量（tCO₂） = 熔剂净购入使用量（t） × 熔剂排放因子（tCO₂/t）</p>
            <p>- 净购入使用量单位为 t，保留两位小数</p>
            <p>- 排放因子单位为 tCO₂/t，保留三位小数</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
          </div>
        </div>
        
        {/* 熔剂列表 */}
        <div>
          {fluxes.map((flux, index) => (
            <div key={flux.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, marginRight: '16px' }}>熔剂 {index + 1}</h3>
                  <input
                    type="text"
                    value={flux.name}
                    onChange={(e) => updateFluxName(flux.id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      width: '150px'
                    }}
                  />
                </div>
                {!flux.isDefault && (
                  <button
                    onClick={() => removeFlux(flux.id)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    移除
                  </button>
                )}
              </div>
              {renderVerticalLayoutTable(flux, 'flux')}
            </div>
          ))}
          
          <button
            onClick={addNewFlux}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            添加熔剂
          </button>
        </div>
      </div>
      
      {/* 明显分隔线 - 区分外购含碳原料和熔剂部分 */}
      <div style={{ 
        borderTop: '4px solid #1890ff', 
        margin: '40px 0', 
        paddingTop: '40px',
        backgroundColor: '#f0f8ff',
        padding: '20px',
        borderRadius: '4px'
      }}>
        <h3 style={{ margin: 0, color: '#1890ff' }}>外购含碳原料部分</h3>
      </div>
      
      {/* 外购含碳原料部分 */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>外购含碳原料排放计算说明</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
            <p>外购含碳原料消耗产生的二氧化碳排放量计算方法：排放量（tCO₂） = 外购含碳原料净购入使用量（t） × 外购含碳原料排放因子（tCO₂/t</p>
            <p>- 净购入使用量单位为 t，保留两位小数</p>
            <p>- 排放因子单位为 tCO₂/t，保留三位小数</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
          </div>
        </div>
        
        {/* 外购含碳原料列表 */}
        <div>
          {carbonMaterials.map((material, index) => (
            <div key={material.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, marginRight: '16px' }}>外购含碳原料 {index + 1}</h3>
                  <input
                    type="text"
                    value={material.name}
                    onChange={(e) => updateCarbonMaterialName(material.id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      width: '150px'
                    }}
                  />
                </div>
                {!material.isDefault && (
                  <button
                    onClick={() => removeCarbonMaterial(material.id)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    移除
                  </button>
                )}
              </div>
              {renderVerticalLayoutTable(material, 'carbon-material')}
            </div>
          ))}
          
          <button
            onClick={addNewCarbonMaterial}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            添加外购含碳原料
          </button>
        </div>
      </div>

      <div></div>
      
      {/* 明显分隔线 - 区分外购含碳原料和电极部分 */}
      <div style={{ 
        borderTop: '4px solid #1890ff', 
        margin: '40px 0', 
        paddingTop: '40px',
        backgroundColor: '#f0f8ff',
        padding: '20px',
        borderRadius: '4px'
      }}>
        <h3 style={{ margin: 0, color: '#1890ff' }}>电极部分</h3>
      </div>
      
      {/* 电极部分 */}
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>电极排放计算说明</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
            <p>电极消耗产生的二氧化碳排放量计算方法：排放量（tCO₂） = 电极净购入使用量（t） × 电极排放因子（tCO₂/t）</p>
            <p>- 净购入使用量单位为 t，保留两位小数</p>
            <p>- 排放因子固定为 3.663 tCO₂/t，保留三位小数</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
          </div>
        </div>
        
        {/* 电极列表 */}
        <div>
          {electrodes.map((electrode, index) => (
            <div key={electrode.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, marginRight: '16px' }}>电极 {index + 1}</h3>
                  <input
                    type="text"
                    value={electrode.name}
                    onChange={(e) => updateElectrodeName(electrode.id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      width: '150px'
                    }}
                  />
                </div>
                {!electrode.isDefault && (
                  <button
                    onClick={() => removeElectrode(electrode.id)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    移除
                  </button>
                )}
              </div>
              {renderVerticalLayoutTable(electrode, 'electrode')}
            </div>
          ))}
          
        </div>
      </div>
      
    </div>
  );
}

export default SteelProcessEmission;
