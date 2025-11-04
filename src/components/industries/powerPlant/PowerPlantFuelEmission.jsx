import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Table, InputNumber, Select, Button, Upload, message, Modal, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

// 月份数组
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 初始化月度数据的函数
const initMonthData = (defaultValue = '') => {
  const data = {};
  MONTHS.forEach(month => {
    data[month] = defaultValue;
  });
  return data;
};

// 化石燃料类型
const FUEL_TYPES = [
  { value: 'solid', label: '固体燃料' },
  { value: 'liquid', label: '液体燃料' },
  { value: 'gas', label: '气体燃料' }
];

const PowerPlantFuelEmission = ({ units = [], onEmissionChange, initialData = {}, allFuels = [] }) => {
  // 初始化排放数据
  const [emissionData, setEmissionData] = useState(initialData || {});
  // 保存上一次的排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 当前编辑的机组ID
  const [currentUnitId, setCurrentUnitId] = useState(null);
  // 生物质名称
  const [biomassName, setBiomassName] = useState('');
  
  // 当机组列表变化时，初始化对应的排放数据，并根据机组中的燃料信息预先生成燃料表格
  useEffect(() => {
    const newEmissionData = { ...emissionData };
    
    units.forEach(unit => {
      if (!newEmissionData[unit.id]) {
        newEmissionData[unit.id] = {
          fuels: [],
          biomass: [],
          boilerEfficiency: initMonthData(),
          boilerHeatProduction: initMonthData()
        };
      }
      
      // 如果机组中包含燃料信息，则自动为该机组添加对应的燃料
      if (unit.fuelNames && Array.isArray(unit.fuelNames) && unit.fuelNames.length > 0) {
        const existingFuelIds = newEmissionData[unit.id].fuels.map(f => f.fuelName);
        
        unit.fuelNames.forEach(fuelName => {
          // 确保不添加重复的燃料
          if (!existingFuelIds.includes(fuelName)) {
            const allFuels = getAllFuels();
            const fuelInfo = allFuels.find(f => f.id === fuelName);
            
            if (fuelInfo) {
              // 初始化月度热值数据，使用与consumption相同的结构
              const initialCalorificValue = {};
              MONTHS.forEach(month => {
                initialCalorificValue[month] = fuelInfo.calorificValue || 0;
              });
              
              // 初始化月度碳含量数据
              const initialCarbonContent = {};
              MONTHS.forEach(month => {
                initialCarbonContent[month] = fuelInfo.carbonContent || 0;
              });
              
              newEmissionData[unit.id].fuels.push({
                id: generateId(),
                type: fuelInfo.type,
                fuelName: fuelInfo.id,
                fuelLabel: fuelInfo.name, // 添加燃料显示名称
                unit: fuelInfo.unit || (fuelInfo.type === 'gas' ? '10<sup>4</sup>Nm³' : '吨'),
                consumption: initMonthData(),
                calorificValue: initialCalorificValue, // 改为月度数据对象
                carbonContent: initialCarbonContent, // 改为月度数据对象
                receivedBaseCarbonContent: fuelInfo.receivedBaseCarbonContent, // 添加收到基碳含量
                oxidationRate: fuelInfo.oxidationRate || (fuelInfo.type === 'gas' ? 99 : 98), // 添加氧化率
                emissionFactor: fuelInfo.carbonContent ? fuelInfo.carbonContent * 3.67 : 0 // 根据碳含量计算排放因子
              });
            }
          }
        });
      }
    });
    
    setEmissionData(newEmissionData);
    updateParentComponent(newEmissionData);
  }, [units.map(u => JSON.stringify(u)).join(',')]);

  // 获取燃料选项
  const getFuelOptions = (fuelType) => {
    // 从传入的allFuels中筛选特定类型的燃料
    return allFuels.filter(fuel => fuel.type === fuelType).map(fuel => ({
      value: fuel.id,
      label: fuel.name,
      unit: fuel.unit || (fuel.type === 'gas' ? '10<sup>4</sup>Nm³' : '吨'),
      defaultCalorificValue: fuel.calorificValue || 0,
      defaultEmissionFactor: fuel.carbonContent ? fuel.carbonContent * 3.67 : 0
    }));
  };

  // 生成唯一ID
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  // 获取所有可用燃料 - 直接使用传入的allFuels
  const getAllFuels = useCallback(() => {
    return allFuels;
  }, [allFuels]);

  // 获取可添加的燃料列表（排除已添加的）
  const getAvailableFuels = useCallback((unitId) => {
    const unitData = emissionData[unitId] || { fuels: [] };
    const addedFuelIds = unitData.fuels.map(fuel => fuel.fuelName);
    const allFuels = getAllFuels();
    
    return allFuels.filter(fuel => !addedFuelIds.includes(fuel.value));
  }, [emissionData, getAllFuels]);

  // 删除燃料
  const deleteFuel = (unitId, fuelId) => {
    const newEmissionData = { ...emissionData };
    if (newEmissionData[unitId]) {
      newEmissionData[unitId].fuels = newEmissionData[unitId].fuels.filter(fuel => fuel.id !== fuelId);
      setEmissionData(newEmissionData);
      updateParentComponent(newEmissionData);
    }
  };

  // 添加生物质
  const addBiomass = (unitId) => {
    setCurrentUnitId(unitId);
    setBiomassName('');
    setIsModalVisible(true);
  };

  // 确认添加生物质
  const confirmAddBiomass = () => {
    if (!biomassName.trim()) {
      message.warning('请输入生物质品种名称');
      return;
    }
    
    const newEmissionData = { ...emissionData };
    if (newEmissionData[currentUnitId]) {
      newEmissionData[currentUnitId].biomass = [...(newEmissionData[currentUnitId].biomass || [])];
      newEmissionData[currentUnitId].biomass.push({
        id: generateId(),
        name: biomassName.trim()
      });
      setEmissionData(newEmissionData);
    }
    
    setIsModalVisible(false);
    setBiomassName('');
    setCurrentUnitId(null);
  };

  // 删除生物质
  const deleteBiomass = (unitId, biomassId) => {
    const newEmissionData = { ...emissionData };
    if (newEmissionData[unitId]) {
      newEmissionData[unitId].biomass = newEmissionData[unitId].biomass.filter(biomass => biomass.id !== biomassId);
      setEmissionData(newEmissionData);
    }
  };

  // 更新生物质名称
  const updateBiomassName = (unitId, biomassId, name) => {
    const newEmissionData = { ...emissionData };
    if (newEmissionData[unitId]) {
      const biomassIndex = newEmissionData[unitId].biomass.findIndex(b => b.id === biomassId);
      if (biomassIndex !== -1) {
        newEmissionData[unitId].biomass = [...newEmissionData[unitId].biomass];
        newEmissionData[unitId].biomass[biomassIndex] = { ...newEmissionData[unitId].biomass[biomassIndex] };
        newEmissionData[unitId].biomass[biomassIndex].name = name;
        setEmissionData(newEmissionData);
      }
    }
  };

  // 更新锅炉效率
  const updateBoilerEfficiency = (unitId, month, value) => {
    const newEmissionData = { ...emissionData };
    if (newEmissionData[unitId]) {
      newEmissionData[unitId].boilerEfficiency = { ...newEmissionData[unitId].boilerEfficiency };
      newEmissionData[unitId].boilerEfficiency[month] = value;
      setEmissionData(newEmissionData);
    }
  };

  // 更新锅炉产热量
  const updateBoilerHeatProduction = (unitId, month, value) => {
    const newEmissionData = { ...emissionData };
    if (newEmissionData[unitId]) {
      newEmissionData[unitId].boilerHeatProduction = { ...newEmissionData[unitId].boilerHeatProduction };
      newEmissionData[unitId].boilerHeatProduction[month] = value;
      setEmissionData(newEmissionData);
    }
  };

  // 计算化石燃料热量
  const calculateFossilFuelHeat = (unitData, month) => {
    let totalHeat = 0;
    if (unitData.fuels && Array.isArray(unitData.fuels)) {
      unitData.fuels.forEach(fuel => {
        const consumption = parseFloat(fuel.consumption?.[month]) || 0;
        const calorificValue = parseFloat(fuel.calorificValue?.[month]) || 0;
        totalHeat += consumption * calorificValue;
      });
    }
    return totalHeat;
  };

  // 计算生物质热量占比
  const calculateBiomassHeatRatio = (unitData, month) => {
    const boilerEfficiency = parseFloat(unitData.boilerEfficiency?.[month]) || 0;
    const boilerHeatProduction = parseFloat(unitData.boilerHeatProduction?.[month]) || 0;
    
    if (boilerEfficiency <= 0 || boilerHeatProduction <= 0) {
      return 0;
    }
    
    const totalHeatInput = boilerHeatProduction / (boilerEfficiency / 100);
    const fossilFuelHeat = calculateFossilFuelHeat(unitData, month);
    
    if (totalHeatInput <= 0) {
      return 0;
    }
    
    return ((totalHeatInput - fossilFuelHeat) / totalHeatInput) * 100;
  };

  // 更新燃料属性
  const updateFuelProperty = (unitId, fuelId, property, value) => {
    // 优化性能：减少不必要的深度复制，只在真正需要修改时才执行
    const unitData = emissionData[unitId];
    if (!unitData || !unitData.fuels) return;
    
    const fuelIndex = unitData.fuels.findIndex(f => f.id === fuelId);
    if (fuelIndex === -1) return;
    
    // 创建新的数据对象以触发状态更新
    const newEmissionData = { ...emissionData };
    newEmissionData[unitId] = { ...unitData };
    newEmissionData[unitId].fuels = [...unitData.fuels];
    newEmissionData[unitId].fuels[fuelIndex] = { ...unitData.fuels[fuelIndex] };
    
    const fuel = newEmissionData[unitId].fuels[fuelIndex];
    
    // 更新属性
    if (property === 'oxidationRate') {
      // 对于氧化率，现在支持月度更新，这里仅在需要一次性设置所有月份时使用
      if (!fuel[property]) {
        fuel[property] = {};
      }
      MONTHS.forEach(month => {
        fuel[property][month] = value;
      });
    } else {
      // 其他属性直接设置
      fuel[property] = value;
    }
    
    // 2. 如果更新了燃料名称，设置一些默认值
    if (property === 'fuelName') {
      const allFuels = getAllFuels();
      const selectedFuel = allFuels.find(f => f.id === value);
      
      if (selectedFuel) {
        fuel.type = selectedFuel.type;
        fuel.fuelLabel = selectedFuel.name;
        fuel.unit = selectedFuel.unit;
        
        // 更新所有月份的热值
        if (!fuel.calorificValue) fuel.calorificValue = {};
        MONTHS.forEach(month => {
          fuel.calorificValue[month] = selectedFuel.calorificValue || 0;
        });
        
        // 更新碳含量，支持月度数据 - 与热值初始化方式保持一致
        if (!fuel.carbonContent) fuel.carbonContent = {};
        // 设置合理的默认碳含量，确保大于0以便计算排放量
        const defaultCarbonContent = selectedFuel.carbonContent || 0.026; // 默认值0.026 tC/GJ
        MONTHS.forEach(month => {
          fuel.carbonContent[month] = defaultCarbonContent;
        });
        
        // 更新氧化率，支持月度数据
        if (!fuel.oxidationRate) fuel.oxidationRate = {};
        const defaultOxidationRate = selectedFuel.oxidationRate || (selectedFuel.type === 'gas' ? 99 : 98);
        MONTHS.forEach(month => {
          if (fuel.oxidationRate[month] === undefined) {
            fuel.oxidationRate[month] = defaultOxidationRate;
          }
        });
        
        // 更新收到基元素碳含量，支持月度数据
        if (!fuel.receivedBaseCarbonContent) fuel.receivedBaseCarbonContent = {};
        if (selectedFuel.receivedBaseCarbonContent) {
          MONTHS.forEach(month => {
            if (fuel.receivedBaseCarbonContent[month] === undefined) {
              fuel.receivedBaseCarbonContent[month] = selectedFuel.receivedBaseCarbonContent;
            }
          });
        }
      }
    }
    
    setEmissionData(newEmissionData);
    // 延迟更新父组件，避免频繁重新计算
    setTimeout(() => updateParentComponent(newEmissionData), 0);
  };
  
  // 更新月度碳含量数据
  const updateMonthlyCarbonContent = (unitId, fuelId, month, value) => {
    // 创建新的数据对象以触发状态更新
    const newEmissionData = { ...emissionData };
    newEmissionData[unitId] = { ...emissionData[unitId] };
    newEmissionData[unitId].fuels = [...emissionData[unitId].fuels];
    
    const fuelIndex = newEmissionData[unitId].fuels.findIndex(fuel => fuel.id === fuelId);
    if (fuelIndex !== -1) {
      newEmissionData[unitId].fuels[fuelIndex] = { ...newEmissionData[unitId].fuels[fuelIndex] };
      
      // 确保carbonContent是对象
      const carbonContent = newEmissionData[unitId].fuels[fuelIndex].carbonContent;
      if (!carbonContent || typeof carbonContent !== 'object') {
        // 如果不存在或不是对象，创建新对象并为所有月份设置默认值
        newEmissionData[unitId].fuels[fuelIndex].carbonContent = {};
        // 使用当前值作为默认值（如果有），否则使用0
        const defaultValue = typeof carbonContent === 'number' ? carbonContent : 0;
        MONTHS.forEach(m => {
          newEmissionData[unitId].fuels[fuelIndex].carbonContent[m] = defaultValue;
        });
      }
      
      // 更新特定月份的碳含量
      newEmissionData[unitId].fuels[fuelIndex].carbonContent[month] = value;
      
      setEmissionData(newEmissionData);
      // 延迟更新父组件，避免频繁重新计算
      setTimeout(() => updateParentComponent(newEmissionData), 0);
    }
  };
  
  // 更新月度碳氧化率数据
  const updateMonthlyOxidationRate = (unitId, fuelId, month, value) => {
    // 创建新的数据对象以触发状态更新
    const newEmissionData = { ...emissionData };
    newEmissionData[unitId] = { ...emissionData[unitId] };
    newEmissionData[unitId].fuels = [...emissionData[unitId].fuels];
    
    const fuelIndex = newEmissionData[unitId].fuels.findIndex(fuel => fuel.id === fuelId);
    if (fuelIndex !== -1) {
      newEmissionData[unitId].fuels[fuelIndex] = { ...newEmissionData[unitId].fuels[fuelIndex] };
      
      // 确保oxidationRate是对象
      const oxidationRate = newEmissionData[unitId].fuels[fuelIndex].oxidationRate;
      if (!oxidationRate || typeof oxidationRate !== 'object') {
        // 如果不存在或不是对象，创建新对象
        newEmissionData[unitId].fuels[fuelIndex].oxidationRate = {};
      }
      
      // 更新特定月份的碳氧化率
      newEmissionData[unitId].fuels[fuelIndex].oxidationRate[month] = value;
      
      setEmissionData(newEmissionData);
      // 延迟更新父组件，避免频繁重新计算
      setTimeout(() => updateParentComponent(newEmissionData), 0);
    }
  };
  
  // 更新月度收到基元素碳含量数据
  const updateMonthlyElementCarbon = (unitId, fuelId, month, value) => {
    // 创建新的数据对象以触发状态更新
    const newEmissionData = { ...emissionData };
    newEmissionData[unitId] = { ...emissionData[unitId] };
    newEmissionData[unitId].fuels = [...emissionData[unitId].fuels];
    
    const fuelIndex = newEmissionData[unitId].fuels.findIndex(fuel => fuel.id === fuelId);
    if (fuelIndex !== -1) {
      newEmissionData[unitId].fuels[fuelIndex] = { ...newEmissionData[unitId].fuels[fuelIndex] };
      
      // 确保receivedBaseCarbonContent是对象
      const receivedBaseCarbonContent = newEmissionData[unitId].fuels[fuelIndex].receivedBaseCarbonContent;
      if (!receivedBaseCarbonContent || typeof receivedBaseCarbonContent !== 'object') {
        // 如果不存在或不是对象，创建新对象
        newEmissionData[unitId].fuels[fuelIndex].receivedBaseCarbonContent = {};
      }
      
      // 更新特定月份的收到基元素碳含量
      newEmissionData[unitId].fuels[fuelIndex].receivedBaseCarbonContent[month] = value;
      
      setEmissionData(newEmissionData);
      // 延迟更新父组件，避免频繁重新计算
      setTimeout(() => updateParentComponent(newEmissionData), 0);
    }
  };
  
  // 更新月度热值数据
  const updateMonthlyCalorificValue = (unitId, fuelId, month, value) => {
    // 创建新的数据对象以触发状态更新
    const newEmissionData = { ...emissionData };
    newEmissionData[unitId] = { ...emissionData[unitId] };
    newEmissionData[unitId].fuels = [...emissionData[unitId].fuels];
    
    const fuelIndex = newEmissionData[unitId].fuels.findIndex(fuel => fuel.id === fuelId);
    if (fuelIndex !== -1) {
      newEmissionData[unitId].fuels[fuelIndex] = { ...newEmissionData[unitId].fuels[fuelIndex] };
      
      // 确保calorificValue是对象
      if (!newEmissionData[unitId].fuels[fuelIndex].calorificValue) {
        newEmissionData[unitId].fuels[fuelIndex].calorificValue = {};
      }
      
      // 更新特定月份的热值
      newEmissionData[unitId].fuels[fuelIndex].calorificValue[month] = value;
      
      setEmissionData(newEmissionData);
      // 延迟更新父组件，避免频繁重新计算
      setTimeout(() => updateParentComponent(newEmissionData), 0);
    }
  };

  // 更新月度数据
  const updateMonthlyData = (unitId, fuelId, month, value) => {
    const newEmissionData = { ...emissionData };
    if (newEmissionData[unitId]) {
      const fuelIndex = newEmissionData[unitId].fuels.findIndex(fuel => fuel.id === fuelId);
      if (fuelIndex !== -1) {
        const updatedConsumption = { ...newEmissionData[unitId].fuels[fuelIndex].consumption };
        updatedConsumption[month] = value;
        newEmissionData[unitId].fuels[fuelIndex].consumption = updatedConsumption;
        setEmissionData(newEmissionData);
        updateParentComponent(newEmissionData);
      }
    }
  };



  // 计算月度排放量
  const calculateMonthlyEmission = useCallback((data, unitId, month) => {
    let emission = 0;
    const unitData = data[unitId];
    
    if (!unitData || !Array.isArray(unitData.fuels)) return 0;
    
    unitData.fuels.forEach(fuel => {
      const consumption = parseFloat(fuel.consumption?.[month]) || 0;
      // 正确使用月度数据，如果不存在则使用0
      const calorificValue = parseFloat(fuel.calorificValue?.[month]) || 0;
      const carbonContent = parseFloat(fuel.carbonContent?.[month]) || 0;
      const receivedBaseCarbonContent = parseFloat(fuel.receivedBaseCarbonContent?.[month]) || 0;
      const oxidationRate = parseFloat(fuel.oxidationRate?.[month]) || 100;
      const CARBON_TO_CO2_RATIO = 44 / 12;
      
      let monthlyEmission = 0;
      
      // 优先使用收到基元素碳含量计算
      if (receivedBaseCarbonContent > 0) {
        // 方式1：化石燃料消耗量 × 收到基元素碳含量 × 碳氧化率 × 44/12
        monthlyEmission = consumption * receivedBaseCarbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
      } else if (calorificValue > 0 && carbonContent > 0) {
        // 方式2：使用收到基低位发热量和单位热值含碳量计算
        // 直接使用收到基低位发热量计算
        monthlyEmission = consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
      }
      
      // 气体燃料的热值已按万立方米单位计算，无需额外转换
      emission += monthlyEmission;
    });
    
    return emission;
  }, []);

  // 计算总排放量
  const calculateTotalEmission = useCallback((data) => {
    let totalEmission = 0;
    
    Object.values(data).forEach(unitData => {
      if (!unitData || !Array.isArray(unitData.fuels)) return;
      
      unitData.fuels.forEach(fuel => {
        MONTHS.forEach(month => {
          const consumption = parseFloat(fuel.consumption?.[month]) || 0;
          // 正确使用月度数据，如果不存在则使用0
          const calorificValue = parseFloat(fuel.calorificValue?.[month]) || 0;
          const carbonContent = parseFloat(fuel.carbonContent?.[month]) || 0;
          const receivedBaseCarbonContent = parseFloat(fuel.receivedBaseCarbonContent?.[month]) || 0;
          const oxidationRate = parseFloat(fuel.oxidationRate?.[month]) || 100;
          const CARBON_TO_CO2_RATIO = 44 / 12;
          
          let monthlyEmission = 0;
          
          // 优先使用收到基元素碳含量计算
          if (receivedBaseCarbonContent > 0) {
            // 方式1：化石燃料消耗量 × 收到基元素碳含量 × 碳氧化率 × 44/12
            monthlyEmission = consumption * receivedBaseCarbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
          } else if (calorificValue > 0 && carbonContent > 0) {
            // 方式2：使用收到基低位发热量和单位热值含碳量计算
            // 直接使用收到基低位发热量计算
            monthlyEmission = consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
          }
          
          // 气体燃料的热值已按万立方米单位计算，无需额外转换
          
          totalEmission += monthlyEmission;
        });
      });
    });
    
    return totalEmission;
  }, []);

  // 计算月度汇总数据
  const calculateMonthlySummary = useCallback((data) => {
    // 计算每个机组的月度排放量
    const unitEmissions = [];
    
    Object.entries(data).forEach(([unitId, unitData]) => {
      const unit = units.find(u => u.id === unitId);
      if (!unit || !unitData || !Array.isArray(unitData.fuels)) return;
      
      const unitSummary = { unitName: unit.name };
      let unitTotal = 0;
      
      MONTHS.forEach(month => {
        const monthEmission = calculateMonthlyEmission(data, unitId, month);
        unitSummary[month] = monthEmission;
        unitTotal += monthEmission;
      });
      
      unitSummary.total = unitTotal;
      unitEmissions.push(unitSummary);
    });
    
    return unitEmissions;
  }, [units, calculateMonthlyEmission]);

  // 更新父组件
  const updateParentComponent = useCallback((data) => {
    if (onEmissionChange) {
      const totalEmission = calculateTotalEmission(data);
      // 计算月度汇总数据
      const monthlyUnitEmissions = calculateMonthlySummary(data);
      
      // 只有当排放量真正发生变化时，才通知父组件
      if (previousEmissionRef.current !== totalEmission) {
        previousEmissionRef.current = totalEmission;
        onEmissionChange({
          data: data,
          totalEmission: totalEmission,
          value: { CO2: totalEmission, CH4: 0, N2O: 0, total: totalEmission },
          monthlyUnitEmissions: monthlyUnitEmissions
        });
      }
    }
  }, [onEmissionChange, calculateTotalEmission, calculateMonthlySummary]);

  // 渲染每个机组的燃料表格
  const renderUnitFuelTable = useCallback((unit) => {
    const unitData = emissionData[unit.id] || { fuels: [], biomass: [], boilerEfficiency: {}, boilerHeatProduction: {} };
    
    // 构建表格数据，按信息项分组
    const prepareTableData = () => {
      const result = [];
      
      unitData.fuels.forEach(fuel => {
        const fuelOptions = getFuelOptions(fuel.type);
        const fuelInfo = fuelOptions.find(f => f.value === fuel.fuelName);
        const fuelLabel = fuelInfo?.label || fuel.fuelName;
        
        // 计算全年消耗量
        const annualConsumption = MONTHS.reduce((sum, month) => {
          return sum + (parseFloat(fuel.consumption?.[month]) || 0);
        }, 0);
        
        // 排放量计算将在下方进行
        
        // 为每种燃料创建不同信息项的行
        // 1. 消耗量
        result.push({
          key: `${fuel.id}-consumption`,
          fuelName: fuelLabel,
          fuelLabel: fuelLabel,
          fuelId: fuel.id,
          fuelType: fuel.type,
          infoItem: '消耗量',
          unit: fuel.unit,
          monthlyData: fuel.consumption,
          annualValue: annualConsumption,
          acquisitionMethod: '',
          dataSource: '',
          supportMaterial: null,
          showUpload: true,
          rowType: 'consumption'
        });
        
        // 2. 收到基低位发热量
        // 获取燃料信息
        const allFuels = getAllFuels();
        const selectedFuel = allFuels.find(f => f.id === fuel.fuelName);
        
        // 确保每个月都有从燃料获取的缺省值
        const calorificValueData = { ...fuel.calorificValue } || {};
        const defaultCalorificValue = selectedFuel?.calorificValue || 0;
        
        MONTHS.forEach(month => {
          // 如果该月份没有值，则使用默认值
          if (calorificValueData[month] === undefined || calorificValueData[month] === null || calorificValueData[month] === '') {
            calorificValueData[month] = defaultCalorificValue;
          }
        });
        
        result.push({
          key: `${fuel.id}-calorificValue`,
          fuelId: fuel.id,
          fuelType: fuel.type,
          infoItem: '收到基低位发热量',
          unit: fuel.type === 'gas' ? 'GJ/10<sup>4</sup>Nm³' : 'GJ/t', // 根据燃料类型显示不同单位
          monthlyData: calorificValueData,
          annualValue: '',
          acquisitionMethod: '缺省值', // 标记为缺省值，但仍允许用户修改
          dataSource: '',
          supportMaterial: null,
          showUpload: true,
          rowType: 'calorificValue'
        });
        
        // 3. 单位热值含碳量
        // 确保每个月都有从燃料获取的缺省值
        const carbonContentData = { ...fuel.carbonContent } || {};
        // 使用前面已声明的selectedFuel变量获取碳含量
        const defaultCarbonContent = selectedFuel?.carbonContent || 0;
        
        MONTHS.forEach(month => {
          // 如果该月份没有值，则使用默认值
          if (carbonContentData[month] === undefined || carbonContentData[month] === null || carbonContentData[month] === '') {
            carbonContentData[month] = defaultCarbonContent;
          }
        });
        
        result.push({
          key: `${fuel.id}-carbonContent`,
          fuelId: fuel.id,
          fuelType: fuel.type,
          infoItem: '单位热值含碳量',
          unit: 'tC/GJ',
          monthlyData: carbonContentData,
          annualValue: '',
          acquisitionMethod: '缺省值', // 标记为缺省值，但仍允许用户修改
          dataSource: '',
          supportMaterial: null,
          showUpload: false,
          rowType: 'carbonContent'
        });
        
        // 4. 收到基元素碳含量
        const elementCarbonData = {};
        MONTHS.forEach(month => {
          // 优先从fuel.receivedBaseCarbonContent获取已有值，如果不存在则为空字符串
          elementCarbonData[month] = fuel.receivedBaseCarbonContent?.[month] || '';
        });
        result.push({
          key: `${fuel.id}-elementCarbon`,
          fuelId: fuel.id,
          fuelType: fuel.type,
          infoItem: '收到基元素碳含量',
          unit: fuel.type === 'gas' ? 'tC/10<sup>4</sup>Nm³' : 'tC/t', // 根据燃料类型显示不同单位
          monthlyData: elementCarbonData,
          annualValue: '',
          acquisitionMethod: '',
          dataSource: '',
          supportMaterial: null,
          showUpload: true,
          rowType: 'elementCarbon'
        });
        
        // 5. 碳氧化率
        const oxidationRateData = {};
        MONTHS.forEach(month => {
          // 优先从fuel.oxidationRate获取已有值，如果不存在则使用默认值99
          oxidationRateData[month] = fuel.oxidationRate?.[month] || '99'; // 默认值
        });
        result.push({
          key: `${fuel.id}-oxidationRate`,
          fuelId: fuel.id,
          fuelType: fuel.type,
          infoItem: '碳氧化率',
          unit: '%',
          monthlyData: oxidationRateData,
          annualValue: '',
          acquisitionMethod: '缺省值',
          dataSource: '',
          supportMaterial: null,
          showUpload: false,
          rowType: 'oxidationRate'
        });
        
        // 6. 排放量（计算值）
        const monthlyEmissions = {};
        let annualEmission = 0;
        const CARBON_TO_CO2_RATIO = 44 / 12;
        
        MONTHS.forEach(month => {
          const consumption = parseFloat(fuel.consumption?.[month]) || 0;
          const oxidationRate = parseFloat(fuel.oxidationRate?.[month]) || 100;
          
          let monthlyEmission = 0;
          
          // 优先使用收到基元素碳含量计算
          const receivedBaseCarbonContent = parseFloat(fuel.receivedBaseCarbonContent?.[month]) || 0;
          if (receivedBaseCarbonContent > 0) {
            // 方式1：化石燃料消耗量 × 收到基元素碳含量 × 碳氧化率 × 44/12
            monthlyEmission = consumption * receivedBaseCarbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
          } else {
            // 方式2：使用收到基低位发热量和单位热值含碳量计算
            // 正确使用月度热值数据，如果不存在则使用0
            const calorificValue = parseFloat(fuel.calorificValue?.[month]) || 0;
            const carbonContent = parseFloat(fuel.carbonContent?.[month]) || 0;
            
            if (calorificValue > 0 && carbonContent > 0) {
              // 化石燃料消耗量 × 收到基低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12
              // 直接使用收到基低位发热量计算，不需要除以1000000
              monthlyEmission = consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
            }
          }
          
          // 气体燃料的热值已按万立方米单位计算，无需额外转换
          
          monthlyEmissions[month] = monthlyEmission;
          annualEmission += monthlyEmission;
        });
        
        result.push({
          key: `${fuel.id}-emission`,
          fuelId: fuel.id,
          fuelType: fuel.type,
          infoItem: '排放量',
          unit: 'tCO2',
          monthlyData: monthlyEmissions,
          annualValue: annualEmission,
          acquisitionMethod: '计算值',
          dataSource: '',
          supportMaterial: null,
          showUpload: false,
          rowType: 'emission'
        });
      });
      
      return result;
    };
    
    const tableData = prepareTableData();
    
    // 构建列配置
    const columns = [
      // 燃料名称列
      {
        title: '燃料名称',
        key: 'fuelName',
        width: 100,
        render: (_, record) => {
          // 只在每组的第一行显示燃料名称
          if (record.rowType === 'consumption') {
            return (
              <div style={{ fontWeight: 'bold', color: record.fuelType === 'solid' ? '#8B4513' : record.fuelType === 'liquid' ? '#0000CD' : '#4682B4' }}>
                {record.fuelLabel}
              </div>
            );
          }
          return null;
        }
      },
      // 信息项列
      {
        title: '信息项',
        key: 'infoItem',
        width: 140,
        render: (_, record) => record.infoItem
      },
      // 单位列
      {
        title: '单位',
        key: 'unit',
        width: 80,
        render: (_, record) => <span dangerouslySetInnerHTML={{ __html: record.unit }} />
      }
    ];
    
    // 添加月份列
    MONTHS.forEach(month => {
      columns.push({
        title: month,
        key: month,
        width: 80,
        render: (_, record) => {
          const value = record.monthlyData[month];
          
          // 对于排放量，显示计算值，不允许编辑
          if (record.rowType === 'emission') {
            return value !== '' && !isNaN(parseFloat(value)) ? parseFloat(value).toFixed(2) : '';
          }
          
          // 显示输入框，允许编辑所有字段
          return (
            <InputNumber
              min={0}
              step={record.rowType === 'calorificValue' ? 0.1 : record.rowType === 'carbonContent' || record.rowType === 'elementCarbon' ? 0.0001 : 0.01}
              value={value}
              onChange={(val) => {
                if (record.rowType === 'consumption') {
                  // 更新消耗量
                  updateMonthlyData(unit.id, record.fuelId, month, val);
                } else if (record.rowType === 'calorificValue') {
                  // 更新月度热值
                  updateMonthlyCalorificValue(unit.id, record.fuelId, month, val);
                } else if (record.rowType === 'carbonContent') {
                  // 更新月度碳含量
                  updateMonthlyCarbonContent(unit.id, record.fuelId, month, val);
                } else if (record.rowType === 'elementCarbon') {
                  // 更新收到基元素碳含量（按月更新）
                  updateMonthlyElementCarbon(unit.id, record.fuelId, month, val);
                } else if (record.rowType === 'oxidationRate') {
                  // 更新碳氧化率（按月更新）
                  updateMonthlyOxidationRate(unit.id, record.fuelId, month, val);
                }
              }}
              style={{ width: '100%' }}
            />
          );
        }
      });
    });
    
    // 添加全年值列
    columns.push({
      title: '全年值',
      key: 'annualValue',
      width: 100,
      render: (_, record) => {
        if (record.annualValue !== '' && typeof record.annualValue === 'number') {
          return record.annualValue.toFixed(record.rowType === 'emission' || record.rowType === 'consumption' ? 2 : 0);
        }
        return record.annualValue;
      }
    });
    
    // 添加获取方式列
    columns.push({
      title: '获取方式',
      key: 'acquisitionMethod',
      width: 80,
      render: (_, record) => record.acquisitionMethod
    });
    
    // 添加数据来源列
    columns.push({
      title: '数据来源',
      key: 'dataSource',
      width: 100,
      render: (_, record) => (
        <input
          type="text"
          placeholder="数据来源"
          style={{ width: '100%', textAlign: 'center' }}
        />
      )
    });
    
    // 添加支撑材料列
    columns.push({
      title: '支撑材料',
      key: 'supportMaterial',
      width: 100,
      render: (_, record) => {
        if (record.showUpload) {
          return (
            <input
              type="file"
              onChange={(e) => {
                // 这里可以添加文件上传逻辑
                console.log('File uploaded:', e.target.files[0]);
              }}
              style={{ fontSize: '12px' }}
            />
          );
        }
        return null;
      }
    });
    
    // 构建生物质表格数据
    const prepareBiomassTableData = () => {
      const result = [];
      
      // 添加生物质品种行
      (unitData.biomass || []).forEach(biomass => {
        result.push({
          key: `biomass-${biomass.id}`,
          infoItem: '生物质品种',
          name: biomass.name,
          biomassId: biomass.id,
          rowType: 'biomass'
        });
      });
      
      // 添加锅炉效率行
      result.push({
        key: 'boiler-efficiency',
        infoItem: '锅炉效率',
        unit: '%',
        monthlyData: unitData.boilerEfficiency || {},
        rowType: 'boilerEfficiency'
      });
      
      // 添加锅炉产热量行
      result.push({
        key: 'boiler-heat-production',
        infoItem: '锅炉产热量',
        unit: 'GJ',
        monthlyData: unitData.boilerHeatProduction || {},
        rowType: 'boilerHeatProduction'
      });
      
      // 添加化石燃料热量行（计算值）
      const fossilFuelHeatData = {};
      MONTHS.forEach(month => {
        fossilFuelHeatData[month] = calculateFossilFuelHeat(unitData, month);
      });
      result.push({
        key: 'fossil-fuel-heat',
        infoItem: '化石燃料热量',
        unit: 'GJ',
        monthlyData: fossilFuelHeatData,
        rowType: 'fossilFuelHeat',
        isCalculated: true
      });
      
      // 添加生物质热量占比行（计算值）
      const biomassHeatRatioData = {};
      MONTHS.forEach(month => {
        biomassHeatRatioData[month] = calculateBiomassHeatRatio(unitData, month);
      });
      result.push({
        key: 'biomass-heat-ratio',
        infoItem: '生物质热量占比',
        unit: '%',
        monthlyData: biomassHeatRatioData,
        rowType: 'biomassHeatRatio',
        isCalculated: true
      });
      
      return result;
    };
    
    const biomassTableData = prepareBiomassTableData();
    
    // 构建生物质表格列配置
    const biomassColumns = [
      { title: '信息项', key: 'infoItem', width: 140, render: (_, record) => record.infoItem },
      {
        title: '生物质品种名称',
        key: 'name',
        width: 150,
        render: (_, record) => {
          if (record.rowType === 'biomass') {
            return (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>{record.name}</span>
                <Button 
                  type="text" 
                  danger 
                  onClick={() => deleteBiomass(unit.id, record.biomassId)}
                  size="small"
                >
                  删除
                </Button>
              </div>
            );
          }
          return null;
        }
      }
    ];
    
    // 添加月份列
    MONTHS.forEach(month => {
      biomassColumns.push({
        title: month,
        key: month,
        width: 80,
        render: (_, record) => {
          if (record.rowType === 'biomass') {
            return null;
          }
          
          const value = record.monthlyData[month];
          
          // 对于计算值，显示计算结果，不允许编辑
          if (record.isCalculated) {
            return value !== '' && !isNaN(parseFloat(value)) ? parseFloat(value).toFixed(2) : '';
          }
          
          // 显示输入框
          return (
            <InputNumber
              min={0}
              step={record.rowType === 'boilerEfficiency' ? 0.1 : 0.01}
              value={value}
              onChange={(val) => {
                if (record.rowType === 'boilerEfficiency') {
                  updateBoilerEfficiency(unit.id, month, val);
                } else if (record.rowType === 'boilerHeatProduction') {
                  updateBoilerHeatProduction(unit.id, month, val);
                }
              }}
              style={{ width: '100%' }}
            />
          );
        }
      });
    });
    
    // 添加单位列
    biomassColumns.push({
      title: '单位',
      key: 'unit',
      width: 80,
      render: (_, record) => record.unit || ''
    });

    return (
      <div 
        key={unit.id} 
        className="production-line" 
        style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          border: '2px solid #4CAF50', 
          borderRadius: '8px', 
          backgroundColor: '#f9fff9' 
        }}
      >
        <div className="line-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: '10px 0' }}>{unit.name}</h3>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ marginBottom: '15px' }}>燃料燃烧计算</h4>
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            rowKey="key"
            scroll={{ x: 'max-content' }}
          />
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4>掺烧生物质计算</h4>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => addBiomass(unit.id)}
            >
              添加生物质
            </Button>
          
          {/* 生物质添加模态框 */}
          <Modal
            title="添加生物质品种"
            open={isModalVisible && currentUnitId === unit.id}
            onOk={confirmAddBiomass}
            onCancel={() => setIsModalVisible(false)}
            centered
          >
            <Input
              placeholder="请输入生物质品种名称"
              value={biomassName}
              onChange={(e) => setBiomassName(e.target.value)}
              onPressEnter={confirmAddBiomass}
            />
          </Modal>
          </div>
          <Table
            columns={biomassColumns}
            dataSource={biomassTableData}
            pagination={false}
            rowKey="key"
            scroll={{ x: 'max-content' }}
          />
        </div>
      </div>
    );
  }, [emissionData, updateFuelProperty, updateMonthlyData, updateMonthlyElementCarbon, updateMonthlyOxidationRate, addBiomass, deleteBiomass, updateBiomassName, updateBoilerEfficiency, updateBoilerHeatProduction, calculateFossilFuelHeat, calculateBiomassHeatRatio, isModalVisible, currentUnitId, biomassName, confirmAddBiomass]);

  // 计算各机组月度排放量汇总数据
  const calculateMonthlyEmissionsSummary = useMemo(() => {
    const summary = [];
    const totalByMonth = {};
    MONTHS.forEach(month => totalByMonth[month] = 0);
    
    units.forEach(unit => {
      const unitData = emissionData[unit.id] || { fuels: [] };
      const unitSummary = { unitName: unit.name, monthlyData: {} };
      let unitTotal = 0;
      
      MONTHS.forEach(month => {
        let monthlyEmission = 0;
        
        if (unitData.fuels && Array.isArray(unitData.fuels)) {
          unitData.fuels.forEach(fuel => {
            const consumption = parseFloat(fuel.consumption?.[month]) || 0;
            const oxidationRate = parseFloat(fuel.oxidationRate?.[month]) || 100;
            const CARBON_TO_CO2_RATIO = 44 / 12;
            
            // 优先使用收到基元素碳含量计算
            const receivedBaseCarbonContent = parseFloat(fuel.receivedBaseCarbonContent?.[month]) || 0;
            if (receivedBaseCarbonContent > 0) {
              monthlyEmission += consumption * receivedBaseCarbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
            } else {
              // 使用收到基低位发热量和单位热值含碳量计算
              const calorificValue = parseFloat(fuel.calorificValue?.[month]) || 0;
              const carbonContent = parseFloat(fuel.carbonContent?.[month]) || 0;
              
              if (calorificValue > 0 && carbonContent > 0) {
                monthlyEmission += consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
              }
            }
          });
        }
        
        unitSummary.monthlyData[month] = monthlyEmission;
        unitTotal += monthlyEmission;
        totalByMonth[month] += monthlyEmission;
      });
      
      unitSummary.total = unitTotal;
      summary.push(unitSummary);
    });
    
    // 添加总计行
    summary.push({
      unitName: '总计',
      monthlyData: totalByMonth,
      total: Object.values(totalByMonth).reduce((sum, val) => sum + val, 0),
      isTotal: true
    });
    
    return summary;
  }, [emissionData, units]);

  return (
    <div className="fossil-fuel-emission">
      <h2>发电设施化石燃料燃烧 CO2 排放</h2>
      
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>发电设施化石燃料燃烧排放：</strong></p>
        <p>化石燃料在发电设施各机组中燃烧产生的二氧化碳排放。</p>
        <p><strong>计算公式：</strong></p>
        <p>1. 当使用收到基元素碳含量时：单台机组的CO2排放量 = Σ(该机组各化石燃料消耗量 × 收到基元素碳含量 × 碳氧化率 × 44/12)</p>
        <p>2. 当使用传统方法时：单台机组的CO2排放量 = Σ(该机组各化石燃料消耗量 × 收到基低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12)</p>
        <p>3. 发电设施总CO2排放量 = 所有机组CO2排放量之和</p>
        <p>4. 气体燃料消耗量单位为10<sup>4</sup>Nm³（万立方米）</p>
      </div>

      {/* 排放量按月汇总表格 */}
      {units.length > 0 && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #2196F3', borderRadius: '8px', backgroundColor: '#f0f7ff' }}>
          <h3 style={{ marginBottom: '15px' }}>各机组排放量月度汇总</h3>
          <Table
            columns={[
              { title: '机组名称', key: 'unitName', width: 150, render: (_, record) => (
                <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{record.unitName}</span>
              )},
              ...MONTHS.map(month => ({
                title: month,
                key: month,
                width: 80,
                render: (_, record) => {
                  const value = record.monthlyData[month] || 0;
                  return value.toFixed(2);
                }
              })),
              { 
                title: '全年累计', 
                key: 'total', 
                width: 100,
                render: (_, record) => {
                  const value = record.total || 0;
                  return (
                    <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal', color: record.isTotal ? '#f5222d' : '#333' }}>
                      {value.toFixed(2)}
                    </span>
                  );
                }
              }
            ]}
            dataSource={calculateMonthlyEmissionsSummary}
            pagination={false}
            rowKey="unitName"
            scroll={{ x: 'max-content' }}
          />
        </div>
      )}

      {units.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#999', border: '1px dashed #d9d9d9', borderRadius: '4px' }}>
          请先添加机组
        </div>
      ) : (
        units.map(unit => renderUnitFuelTable(unit))
      )}
    </div>
  );
};

export default PowerPlantFuelEmission;