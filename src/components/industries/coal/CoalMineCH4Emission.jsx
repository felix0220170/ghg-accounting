import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 矿井类型
const MINE_TYPES = [
  { id: 'continuous', name: '已实现瓦斯连续监测的矿井' },
  { id: 'discontinuous', name: '尚未实现瓦斯连续监测的矿井' }
];

// 矿井排放指标（已实现连续监测）
const CONTINUOUS_MINE_INDICATORS = [
  {
    key: 'ch4VentilationAmount',
    name: 'CH4 风排量',
    unit: '万Nm³',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'ch4ExtractionAmount',
    name: 'CH4 抽放量',
    unit: '万Nm³',
    isCalculated: false,
    decimalPlaces: 2
  }
];

// 矿井排放指标（尚未实现连续监测）
const DISCONTINUOUS_MINE_INDICATORS = [
  {
    key: 'avgCh4VentilationPerMinute',
    name: '当月平均每分钟CH4风排量',
    unit: 'Nm³/min',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'workDays',
    name: '当月实际工作日数',
    unit: '天',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'ch4VentilationAmount',
    name: 'CH4 风排量',
    unit: '万Nm³',
    isCalculated: true,
    decimalPlaces: 2
  },
  {
    key: 'ch4ExtractionAmount',
    name: 'CH4 抽放量',
    unit: '万Nm³',
    isCalculated: false,
    decimalPlaces: 2
  }
];

// 共享排放指标
const SHARED_EMISSION_INDICATORS = [
  {
    key: 'ch4TorchDestructionAmount',
    name: 'CH4 火炬销毁量',
    unit: '万Nm³',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'ch4RecoveryUtilizationAmount',
    name: 'CH4 回收利用量',
    unit: '万Nm³',
    isCalculated: false,
    decimalPlaces: 2
  }
];

// 排放计算常量
const EMISSION_CONSTANTS = {
  CH4_DENSITY: 7.17, // 标准状况下CH4的密度，单位为吨CH4/万Nm³
  GWP_CH4: 21 // CH4的全球变暖潜能值
};

// 所有指标类型
const ALL_INDICATORS = {
  continuous: CONTINUOUS_MINE_INDICATORS,
  discontinuous: DISCONTINUOUS_MINE_INDICATORS,
  shared: SHARED_EMISSION_INDICATORS
};

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = (indicators) => {
  // 为每个指标创建包含12个月数据的对象
  return indicators.reduce((acc, indicator) => {
    acc[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: indicator.isCalculated ? 0 : (indicator.defaultValue !== undefined ? indicator.defaultValue : ''),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 初始化矿井数据（纵向布局）
const initializeMineData = (product, mineType) => {
  const indicators = mineType === 'continuous' ? CONTINUOUS_MINE_INDICATORS : DISCONTINUOUS_MINE_INDICATORS;
  const initialData = createInitialIndicatorData(indicators);
  
  // 为每个指标添加额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  return {
    ...product,
    data: initialData,
    files: {},
    mineType: mineType,
    isDefault: false // 不再有默认的产品
  };
};

// 初始化共享排放数据（纵向布局）
const initializeSharedEmissionData = () => {
  const initialData = createInitialIndicatorData(SHARED_EMISSION_INDICATORS);
  
  // 为每个指标添加额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  return {
    id: 'shared-emission',
    name: '共享排放数据',
    data: initialData,
    files: {},
    isDefault: true // 共享数据默认存在
  };
};

function CoalMineCH4Emission({ onEmissionChange }) {
  // 矿井记录列表状态
  const [mineRecords, setMineRecords] = useState([]);
  
  // 共享排放数据状态
  const [sharedEmissionData, setSharedEmissionData] = useState(initializeSharedEmissionData());
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 当前矿井类型选择
  const [selectedMineType, setSelectedMineType] = useState('continuous');
  
  // 矿井名称输入
  const [mineName, setMineName] = useState('');
  
  // 初始化默认数据
  useEffect(() => {
    // 初始化时没有默认的矿井记录
    setMineRecords([]);
  }, []);
  
  // 添加新的矿井记录
  const addNewMineRecord = useCallback(() => {
    if (!selectedMineType) {
      alert('请选择矿井类型');
      return;
    }
    
    if (!mineName.trim()) {
      alert('请输入矿井名称');
      return;
    }
    
    const newMineId = `mine-${Date.now()}`;
    
    // 创建新的矿井记录对象
    const newMine = {
      id: newMineId,
      name: mineName.trim(),
      mineType: selectedMineType
    };
    
    const initializedNewMine = initializeMineData(newMine, selectedMineType);
    setMineRecords(prevRecords => [...prevRecords, initializedNewMine]);
    
    // 重置表单
    setMineName('');
  }, [mineName, selectedMineType]);
  
  // 移除矿井记录（仅支持移除非默认产品）
  const removeMineRecord = useCallback((mineId) => {
    setMineRecords(prevRecords => {
      return prevRecords.filter(mine => mine.id !== mineId);
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
    // 处理矿井数据计算（尚未实现连续监测的矿井）
    setMineRecords(prevRecords => {
      let hasChanges = false;
      const updatedRecords = prevRecords.map(mine => {
        if (!mine.data || mine.mineType !== 'discontinuous') return mine;
        
        let updatedMine = { ...mine, data: { ...mine.data } };
        let mineChanged = false;
        
        // 计算各月份的CH4风排量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的平均每分钟CH4风排量和工作日数
          const avgCh4VentilationData = mine.data.avgCh4VentilationPerMinute?.find(m => m.month === month);
          const avgCh4VentilationValue = avgCh4VentilationData?.value ? parseFloat(avgCh4VentilationData.value) : 0;

          const workDaysData = mine.data.workDays?.find(m => m.month === month);
          const workDaysValue = workDaysData?.value ? parseFloat(workDaysData.value) : 0;
          
          // 计算CH4风排量：平均每分钟风排量 × 工作日数 × 60 × 24 × 0.0001
          const ch4VentilationAmountValue = avgCh4VentilationValue * workDaysValue * 60 * 24 * 0.0001;
          
          // 更新CH4风排量数据
          const currentCh4VentilationData = updatedMine.data.ch4VentilationAmount || [];
          const ch4VentilationMonthIndex = currentCh4VentilationData.findIndex(m => m.month === month);
          const newCh4VentilationData = [...currentCh4VentilationData];
          
          if (ch4VentilationMonthIndex !== -1) {
            if (parseFloat(newCh4VentilationData[ch4VentilationMonthIndex].value) !== ch4VentilationAmountValue) {
              newCh4VentilationData[ch4VentilationMonthIndex] = {
                ...newCh4VentilationData[ch4VentilationMonthIndex],
                value: ch4VentilationAmountValue,
                unit: '万Nm³'
              };
              mineChanged = true;
            }
          } else if (ch4VentilationAmountValue > 0) {
            // 确保值大于0时才添加新数据
            newCh4VentilationData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: ch4VentilationAmountValue,
              unit: '万Nm³',
              dataSource: '',
              supportingMaterial: null
            });
            mineChanged = true;
          }
          
          // 应用更新
          updatedMine = {
            ...updatedMine,
            data: {
              ...updatedMine.data,
              ch4VentilationAmount: newCh4VentilationData
            }
          };
        }
        
        if (mineChanged) {
          hasChanges = true;
          return updatedMine;
        }
        
        return mine;
      });
      
      return hasChanges ? updatedRecords : prevRecords;
    });
  }, [setMineRecords]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, mineRecords]);

  // 处理技术选择变化
  const handleTechChange = useCallback((productId, selectedTech) => {
    setMineRecords(prevRecords => {
      return prevRecords.map(mine => {
        if (mine.id === productId) {
          return {
            ...mine,
            selectedTech
          };
        }
        return mine;
      });
    });
  }, [setMineRecords]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'mine-record') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 根据类型选择不同的状态管理
    if (type === 'shared-emission') {
      // 处理共享排放数据
      setSharedEmissionData(prev => {
        if (prev.id !== id) return prev;
        
        // 确保data存在
        const currentData = prev.data || {};
        const currentIndicatorData = currentData[indicatorKey] || [];
        
        // 创建新数组以避免直接修改原数组
        const updatedIndicatorData = [...currentIndicatorData];
        const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
        
        let hasChanges = false;
        
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
          const indicatorDefinition = SHARED_EMISSION_INDICATORS.find(ind => ind.key === indicatorKey);
          
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
            ...prev,
            data: {
              ...currentData,
              [indicatorKey]: updatedIndicatorData
            }
          };
        }
        
        return prev;
      });
    } else {
      // 处理矿井记录数据
      setMineRecords(prevItems => {
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
              // 根据矿井类型获取相应的指标定义
              const indicators = item.mineType === 'continuous' ? CONTINUOUS_MINE_INDICATORS : DISCONTINUOUS_MINE_INDICATORS;
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
    }
  }, [setMineRecords, setSharedEmissionData]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'mine-record') => {
    if (!file) return;
    
    // 根据类型选择不同的状态管理
    if (type === 'shared-emission') {
      // 处理共享排放数据的文件上传
      setSharedEmissionData(prev => {
        if (prev.id !== id) return prev;
        
        // 确保data存在
        const currentData = prev.data || {};
        const currentIndicatorData = currentData[indicatorKey] || [];
        
        // 创建新数组以避免直接修改原数组
        const updatedIndicatorData = [...currentIndicatorData];
        const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
        
        // 创建或更新文件信息
        const updatedFiles = { ...prev.files };
        const fileKey = `${indicatorKey}-${month}`;
        updatedFiles[fileKey] = file;
        
        let hasChanges = false;
        
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
          const indicatorDefinition = SHARED_EMISSION_INDICATORS.find(ind => ind.key === indicatorKey);
          
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
            ...prev,
            data: {
              ...currentData,
              [indicatorKey]: updatedIndicatorData
            },
            files: updatedFiles
          };
        }
        
        return prev;
      });
    } else {
      // 处理矿井记录数据的文件上传
      setMineRecords(prevItems => {
        let hasChanges = false;
        const updatedItems = prevItems.map(item => {
          if (item.id === id) {
            // 确保data存在
            const currentData = item.data || {};
            const currentIndicatorData = currentData[indicatorKey] || [];
            
            // 创建新数组以避免直接修改原数组
            const updatedIndicatorData = [...currentIndicatorData];
            const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
            
            // 创建或更新文件信息
            const updatedFiles = { ...item.files };
            const fileKey = `${indicatorKey}-${month}`;
            updatedFiles[fileKey] = file;
            
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
              // 根据矿井类型获取相应的指标定义
              const indicators = item.mineType === 'continuous' ? CONTINUOUS_MINE_INDICATORS : DISCONTINUOUS_MINE_INDICATORS;
              const indicatorDefinition = indicators.find(ind => ind.key === indicatorKey);
              
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
              const updatedItem = {
                ...item,
                data: {
                  ...currentData,
                  [indicatorKey]: updatedIndicatorData
                },
                files: updatedFiles
              };
              
              return updatedItem;
            }
          }
          return item;
        });
        
        return hasChanges ? updatedItems : prevItems;
      });
    }
  }, [setMineRecords, setSharedEmissionData]);

  // 计算各月排放量
  const calculateMonthlyEmissionTotals = useCallback(() => {
    const totalEmissions = [];
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const month = monthIndex + 1;
      let monthTotal = 0;
      
      // 遍历所有矿井记录
      mineRecords.forEach(mine => {
        if (!mine.data) return;
        
        // 获取当月的CH4风排量和抽放量
        const ch4VentilationData = mine.data.ch4VentilationAmount?.find(m => m.month === month);
        const ch4VentilationValue = ch4VentilationData?.value ? parseFloat(ch4VentilationData.value) : 0;

        const ch4ExtractionData = mine.data.ch4ExtractionAmount?.find(m => m.month === month);
        const ch4ExtractionValue = ch4ExtractionData?.value ? parseFloat(ch4ExtractionData.value) : 0;
        
        // 累加矿井的CH4风排量和抽放量
        monthTotal += ch4VentilationValue + ch4ExtractionValue;
      });
      
      // 减去CH4火炬销毁量和回收利用量
       if (sharedEmissionData) {
         // 对于sharedEmissionData，实际数据存储在data属性中
         const actualSharedData = sharedEmissionData.data || sharedEmissionData;
         
         // 获取当月的CH4火炬销毁量和回收利用量
         const torchDestructionData = actualSharedData.ch4TorchDestructionAmount?.find(m => m.month === month);
         const torchDestructionValue = torchDestructionData?.value ? parseFloat(torchDestructionData.value) : 0;

         const recoveryData = actualSharedData.ch4RecoveryUtilizationAmount?.find(m => m.month === month);
         const recoveryValue = recoveryData?.value ? parseFloat(recoveryData.value) : 0;
         
         // 减去CH4火炬销毁量和回收利用量
         monthTotal -= (torchDestructionValue + recoveryValue);
       }
      
      // 计算最终排放量：(风排量+抽放量-火炬销毁量-回收利用量) * CH4密度 * GWP值
      monthTotal = Math.max(0, monthTotal) * EMISSION_CONSTANTS.CH4_DENSITY * EMISSION_CONSTANTS.GWP_CH4;
      totalEmissions.push(monthTotal);
    }
    
    return totalEmissions;
  }, [mineRecords, sharedEmissionData]);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    // 计算各月份的排放量
    const monthlyTotals = calculateMonthlyEmissionTotals();
    
    // 累加各月份的排放量得到全年总排放量
    monthlyTotals.forEach(monthlyTotal => {
      total += monthlyTotal || 0;
    });
    
    return total;
  }, [calculateMonthlyEmissionTotals]);
  
  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);
  
  // 当矿井记录或共享排放数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, mineRecords]);
  
  // 当计算值更新时，重新计算月度排放总量和总排放量
  useEffect(() => {
    calculateMonthlyEmissionTotals();
  }, [calculateMonthlyEmissionTotals, mineRecords, sharedEmissionData]);
  
  // 渲染纵向布局的表格
  const renderVerticalLayoutTable = (item, type = 'mine-record') => {
    if (!item.data) return null;
    
    // 根据类型选择不同的指标定义
    let indicators;
    if (type === 'shared-emission') {
      indicators = SHARED_EMISSION_INDICATORS;
    } else {
      // 根据矿井类型获取相应的指标定义
      indicators = item.mineType === 'continuous' ? CONTINUOUS_MINE_INDICATORS : DISCONTINUOUS_MINE_INDICATORS;
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
          // 对于shared-emission类型，数据存储在item.data.data中
          const actualData = type === 'shared-emission' ? item.data.data : item.data;
          const indicatorData = actualData[indicator.key] || [];
          
          // 计算全年值
          let yearlyValue = 0;
          if (indicator.isCalculated || !indicator.isEmissionFactor) {
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
                  {indicator.isCalculated || !indicator.isEmissionFactor ? (
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
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>全年总计 (tCO₂)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>井工开采的CH4逃逸排放总量</td>
            {totalEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
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
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>井工开采的CH4逃逸排放</h2>
      {/* 井工开采的CH4逃逸排放 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '16px' }}>计算说明</h3>
            <p>井工开采过程中，CH4从煤矿巷道和采空区逃逸排放，排放量根据矿井类型（连续监测或非连续监测）分别计算。</p>
            <p>已实现瓦斯连续监测的矿井需直接输入CH4风排量和CH4抽放量。</p>
            <p>尚未实现瓦斯连续监测的矿井：CH4风排量 = 当月平均每分钟CH4风排量 × 当月实际工作日数 × 60 × 24 × 0.0001（单位：万Nm³）</p>
            <p>总排放 = （各矿井的CH4风排量之和 + 各矿井的CH4抽放量 - CH4的火炬销毁量 - CH4的回收利用量） × 7.17 × 21</p>
            <p>其中：7.17是标准状况下CH4的密度（吨CH4/10<sup>4</sup>Nm³），21是CH4的全球变暖潜能值（GWP）</p>
            <p>- CH4风排量、抽放量、火炬销毁量、回收利用量单位均为 10<sup>4</sup>Nm³</p>
            <p>- 排放量单位为 tCO₂</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加矿井排放记录</h3>
            
            <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>矿井类型<span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span></label>
                    <select
                        value={selectedMineType}
                        onChange={(e) => setSelectedMineType(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minWidth: '200px'
                        }}
                    >
                        <option value="">请选择矿井类型</option>
                        {MINE_TYPES.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 'bold', color: '#333' }}>矿井名称<span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span></label>
                    <input
                        type="text"
                        placeholder="请输入矿井名称"
                        value={mineName}
                        onChange={(e) => setMineName(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minWidth: '200px'
                        }}
                    />
                </div>
            </div>
            
            <button
                onClick={addNewMineRecord}
                style={{
                    padding: '10px 24px',
                    backgroundColor: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
            >
                添加矿井排放记录
            </button>
        </div>

        {/* 共享排放数据 - CH4火炬销毁量和回收利用量 */}
        <div style={{ marginTop: '32px', marginBottom: '40px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>需扣除排放数据</h3>
          </div>
          
          {renderVerticalLayoutTable({ ...sharedEmissionData, data: sharedEmissionData }, 'shared-emission')}
        </div>

        {/* 矿井排放记录列表 */}
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>矿井排放记录</h3>
          
          {mineRecords.length === 0 ? (
            <div style={{ backgroundColor: '#f5f5f5', padding: '24px', textAlign: 'center', borderRadius: '4px' }}>
              <p>暂无矿井排放记录，请点击"添加矿井排放记录"按钮添加</p>
            </div>
          ) : (
            mineRecords.map((mine, index) => (
              <div key={mine.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{mine.name}</h3>
                    <span style={{ fontSize: '14px', color: '#666', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                      {MINE_TYPES.find(type => type.id === mine.mineType)?.name}
                    </span>
                  </div>
                  {!
                    mine.isDefault && (
                      <button
                        onClick={() => removeMineRecord(mine.id)}
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
                    )}
                </div>
                
                {renderVerticalLayoutTable(mine)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CoalMineCH4Emission;
