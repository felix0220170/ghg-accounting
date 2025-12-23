import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 连续烧焦装置（类似催化裂化）计算指标
const CONTINUOUS_INDICATORS = [
  {
    key: 'catalystBurningRate',
    name: '催化剂烧焦量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'carbonContent',
    name: '焦层中含碳量',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 100
  },
  {
    key: 'carbonOxidationRate',
    name: '碳氧化率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 98
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    getValue: (data) => {
      const { catalystBurningRate, carbonContent, carbonOxidationRate } = data;
      return catalystBurningRate * carbonContent / 100 * (carbonOxidationRate / 100) * 44 / 12;
    }
  }
];

// 间歇烧焦装置（类似催化重整）计算指标
const BATCH_INDICATORS = [
  {
    key: 'catalystAmount',
    name: '待再生的催化剂量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'carbonContentBefore',
    name: '再生前催化剂含碳量',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'carbonContentAfter',
    name: '再生后催化剂含碳量',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'carbonOxidationRate',
    name: '碳氧化率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 98
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    getValue: (data) => {
      const { catalystAmount, carbonContentBefore, carbonContentAfter, carbonOxidationRate } = data;
      const emissionValue = catalystAmount * (1 - carbonContentBefore / 100) * (carbonContentBefore / (100 - carbonContentBefore) - carbonContentAfter / (100 - carbonContentAfter)) * 44 / 12;
      return emissionValue * (carbonOxidationRate / 100);
    }
  }
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

// 为连续烧焦装置初始化数据（纵向布局）
const initializeContinuousUnitData = (unitNumber) => {
  const initialData = createInitialIndicatorData(CONTINUOUS_INDICATORS);
  
  // 为所有指标初始化额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      value: item.value,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  return {
    id: `continuous-unit-${Date.now()}`,
    unitNumber: unitNumber,
    name: `连续烧焦装置 ${unitNumber}`,
    data: initialData,
    files: {}
  };
};

// 为间歇烧焦装置初始化数据（纵向布局）
const initializeBatchUnitData = (unitNumber) => {
  const initialData = createInitialIndicatorData(BATCH_INDICATORS);
  
  // 为所有指标初始化额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      value: item.value,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  return {
    id: `batch-unit-${Date.now()}`,
    unitNumber: unitNumber,
    name: `间歇烧焦装置 ${unitNumber}`,
    data: initialData,
    files: {}
  };
};

function PetroleumOtherCatalystEmission({ onEmissionChange }) {
  // 连续烧焦装置列表状态
  const [continuousUnits, setContinuousUnits] = useState([]);
  
  // 间歇烧焦装置列表状态
  const [batchUnits, setBatchUnits] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 添加新的连续烧焦装置
  const addNewContinuousUnit = useCallback(() => {
    const newUnitNumber = continuousUnits.length + 1;
    const newContinuousUnit = initializeContinuousUnitData(newUnitNumber);
    setContinuousUnits(prevUnits => [...prevUnits, newContinuousUnit]);
  }, [continuousUnits]);
  
  // 添加新的间歇烧焦装置
  const addNewBatchUnit = useCallback(() => {
    const newUnitNumber = batchUnits.length + 1;
    const newBatchUnit = initializeBatchUnitData(newUnitNumber);
    setBatchUnits(prevUnits => [...prevUnits, newBatchUnit]);
  }, [batchUnits]);
  
  // 移除连续烧焦装置
  const removeContinuousUnit = useCallback((unitId) => {
    setContinuousUnits(prevUnits => prevUnits.filter(unit => unit.id !== unitId));
  }, []);
  
  // 移除间歇烧焦装置
  const removeBatchUnit = useCallback((unitId) => {
    setBatchUnits(prevUnits => prevUnits.filter(unit => unit.id !== unitId));
  }, []);
  
  // 格式化数值显示
  const formatValue = (value, decimalPlaces = 2) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toFixed(decimalPlaces);
  };
  
  // 更新连续烧焦装置的计算值
  const updateContinuousCalculatedValues = useCallback(() => {
    setContinuousUnits(prevUnits => {
      let hasChanges = false;
      const updatedUnits = prevUnits.map(unit => {
        if (!unit.data) return unit;
        
        let updatedUnit = { ...unit, data: { ...unit.data } };
        let unitChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的催化剂烧焦量
          const catalystBurningRateData = unit.data.catalystBurningRate?.find(m => m.month === month);
          const catalystBurningRateValue = catalystBurningRateData?.value ? parseFloat(catalystBurningRateData.value) : 0;
          
          // 获取当月的焦层中含碳量
          const carbonContentData = unit.data.carbonContent?.find(m => m.month === month);
          const carbonContentValue = carbonContentData?.value ? parseFloat(carbonContentData.value) : 0;

          // 获取当月的碳氧化率
          const carbonOxidationRateData = unit.data.carbonOxidationRate?.find(m => m.month === month);
          const carbonOxidationRateValue = carbonOxidationRateData?.value ? parseFloat(carbonOxidationRateData.value) : 100;
          
          // 计算排放量：催化剂烧焦量 * 焦层中含碳量 / 100 * (碳氧化率/100) * 44 / 12
          const emissionValue = catalystBurningRateValue * carbonContentValue / 100 * (carbonOxidationRateValue / 100) * 44 / 12;
          
          // 更新排放量数据
          const currentEmissionData = updatedUnit.data.emission || [];
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
              unitChanged = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂'
            });
            unitChanged = true;
          }
          
          // 应用更新
          updatedUnit = {
            ...updatedUnit,
            data: {
              ...updatedUnit.data,
              emission: newEmissionData
            }
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
  }, []);
  
  // 更新间歇烧焦装置的计算值
  const updateBatchCalculatedValues = useCallback(() => {
    setBatchUnits(prevUnits => {
      let hasChanges = false;
      const updatedUnits = prevUnits.map(unit => {
        if (!unit.data) return unit;
        
        let updatedUnit = { ...unit, data: { ...unit.data } };
        let unitChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的待再生的催化剂量
          const catalystAmountData = unit.data.catalystAmount?.find(m => m.month === month);
          const catalystAmountValue = catalystAmountData?.value ? parseFloat(catalystAmountData.value) : 0;
          
          // 获取当月的再生前催化剂含碳量
          const carbonContentBeforeData = unit.data.carbonContentBefore?.find(m => m.month === month);
          const carbonContentBeforeValue = carbonContentBeforeData?.value ? parseFloat(carbonContentBeforeData.value) : 0;

          // 获取当月的再生后催化剂含碳量
          const carbonContentAfterData = unit.data.carbonContentAfter?.find(m => m.month === month);
          const carbonContentAfterValue = carbonContentAfterData?.value ? parseFloat(carbonContentAfterData.value) : 0;

          // 获取当月的碳氧化率
          const carbonOxidationRateData = unit.data.carbonOxidationRate?.find(m => m.month === month);
          const carbonOxidationRateValue = carbonOxidationRateData?.value ? parseFloat(carbonOxidationRateData.value) : 98;
          
          // 计算排放量：待再生的催化剂量 × (1 - 再生前催化剂含碳量 / 100) × (再生前催化剂含碳量 / (100 - 再生前催化剂含碳量) - 再生后催化剂含碳量 / (100 - 再生后催化剂含碳量)) × 44 / 12
          const emissionValue = catalystAmountValue * (1 - carbonContentBeforeValue / 100) * (carbonContentBeforeValue / (100 - carbonContentBeforeValue) - carbonContentAfterValue / (100 - carbonContentAfterValue)) * 44 / 12;
          
          // 应用碳氧化率
          const finalEmissionValue = emissionValue * (carbonOxidationRateValue / 100);
          
          // 更新排放量数据
          const currentEmissionData = updatedUnit.data.emission || [];
          const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
          const newEmissionData = [...currentEmissionData];
          
          if (emissionMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newEmissionData[emissionMonthIndex].value) !== finalEmissionValue) {
              newEmissionData[emissionMonthIndex] = {
                ...newEmissionData[emissionMonthIndex],
                value: finalEmissionValue,
                unit: 'tCO₂'
              };
              unitChanged = true;
            }
          } else if (finalEmissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: finalEmissionValue,
              unit: 'tCO₂'
            });
            unitChanged = true;
          }
          
          // 应用更新
          updatedUnit = {
            ...updatedUnit,
            data: {
              ...updatedUnit.data,
              emission: newEmissionData
            }
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
  }, []);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateContinuousCalculatedValues();
  }, [updateContinuousCalculatedValues, continuousUnits]);
  
  useEffect(() => {
    updateBatchCalculatedValues();
  }, [updateBatchCalculatedValues, batchUnits]);
  
  // 处理连续装置数据变化
  const handleContinuousDataChange = useCallback((id, indicatorKey, month, field, value) => {
    const formattedValue = value || '';
    setContinuousUnits(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          const currentData = item.data || {};
          const currentIndicatorData = currentData[indicatorKey] || [];
          const updatedIndicatorData = [...currentIndicatorData];
          const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
          
          if (monthIndex !== -1) {
            if (updatedIndicatorData[monthIndex][field] !== formattedValue) {
              updatedIndicatorData[monthIndex] = {
                ...updatedIndicatorData[monthIndex],
                [field]: formattedValue
              };
              hasChanges = true;
            }
          } else {
            hasChanges = true;
            const indicatorDefinition = CONTINUOUS_INDICATORS.find(ind => ind.key === indicatorKey);
            updatedIndicatorData.push({
              month,
              monthName: MONTHS[month - 1],
              value: field === 'value' ? formattedValue : '',
              dataSource: '',
              supportingMaterial: null,
              unit: indicatorDefinition?.unit || ''
            });
          }
          
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
        return item;
      });
      return hasChanges ? updatedItems : prevItems;
    });
  }, []);
  
  // 处理间歇装置数据变化
  const handleBatchDataChange = useCallback((id, indicatorKey, month, field, value) => {
    const formattedValue = value || '';
    setBatchUnits(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          const currentData = item.data || {};
          const currentIndicatorData = currentData[indicatorKey] || [];
          const updatedIndicatorData = [...currentIndicatorData];
          const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
          
          if (monthIndex !== -1) {
            if (updatedIndicatorData[monthIndex][field] !== formattedValue) {
              updatedIndicatorData[monthIndex] = {
                ...updatedIndicatorData[monthIndex],
                [field]: formattedValue
              };
              hasChanges = true;
            }
          } else {
            hasChanges = true;
            const indicatorDefinition = BATCH_INDICATORS.find(ind => ind.key === indicatorKey);
            updatedIndicatorData.push({
              month,
              monthName: MONTHS[month - 1],
              value: field === 'value' ? formattedValue : '',
              dataSource: '',
              supportingMaterial: null,
              unit: indicatorDefinition?.unit || ''
            });
          }
          
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
        return item;
      });
      return hasChanges ? updatedItems : prevItems;
    });
  }, []);
  
  // 处理连续装置文件上传
  const handleContinuousFileUpload = useCallback((id, indicatorKey, month, file) => {
    if (!file) return;
    setContinuousUnits(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          const currentData = item.data || {};
          const currentIndicatorData = currentData[indicatorKey] || [];
          const updatedIndicatorData = [...currentIndicatorData];
          const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
          const updatedFiles = { ...item.files };
          const fileKey = `${indicatorKey}-${month}`;
          updatedFiles[fileKey] = file;
          
          if (monthIndex !== -1) {
            if (updatedIndicatorData[monthIndex].supportingMaterial !== file) {
              updatedIndicatorData[monthIndex] = {
                ...updatedIndicatorData[monthIndex],
                supportingMaterial: file
              };
              hasChanges = true;
            }
          } else {
            hasChanges = true;
            const indicatorDefinition = CONTINUOUS_INDICATORS.find(ind => ind.key === indicatorKey);
            updatedIndicatorData.push({
              month,
              monthName: MONTHS[month - 1],
              value: '',
              dataSource: '',
              supportingMaterial: file,
              unit: indicatorDefinition?.unit || ''
            });
          }
          
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
        return item;
      });
      return hasChanges ? updatedItems : prevItems;
    });
  }, []);
  
  // 处理间歇装置文件上传
  const handleBatchFileUpload = useCallback((id, indicatorKey, month, file) => {
    if (!file) return;
    setBatchUnits(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          const currentData = item.data || {};
          const currentIndicatorData = currentData[indicatorKey] || [];
          const updatedIndicatorData = [...currentIndicatorData];
          const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
          const updatedFiles = { ...item.files };
          const fileKey = `${indicatorKey}-${month}`;
          updatedFiles[fileKey] = file;
          
          if (monthIndex !== -1) {
            if (updatedIndicatorData[monthIndex].supportingMaterial !== file) {
              updatedIndicatorData[monthIndex] = {
                ...updatedIndicatorData[monthIndex],
                supportingMaterial: file
              };
              hasChanges = true;
            }
          } else {
            hasChanges = true;
            const indicatorDefinition = BATCH_INDICATORS.find(ind => ind.key === indicatorKey);
            updatedIndicatorData.push({
              month,
              monthName: MONTHS[month - 1],
              value: '',
              dataSource: '',
              supportingMaterial: file,
              unit: indicatorDefinition?.unit || ''
            });
          }
          
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
        return item;
      });
      return hasChanges ? updatedItems : prevItems;
    });
  }, []);
  
  // 渲染纵向布局的表格（通用函数）
  const renderVerticalLayoutTable = (item, indicators, handleDataChange, handleFileUpload) => {
    if (!item.data) return null;
    
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
          const indicatorData = item.data[indicator.key] || [];
          
          // 计算全年值
          let yearlyValue = 0;
          if (indicator.isCalculated || indicator.key === 'consumptionAmount') {
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
                      <span>{formatValue(value, indicator.decimalPlaces)}</span>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleDataChange(item.id, indicator.key, monthNum, 'value', e.target.value)}
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
                {indicator.isCalculated || indicator.key === 'consumptionAmount' ? (
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
                      MONTHS.forEach((_, idx) => {
                        handleDataChange(item.id, indicator.key, idx + 1, 'dataSource', e.target.value);
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
                      MONTHS.forEach((_, idx) => {
                        handleFileUpload(item.id, indicator.key, idx + 1, e.target.files[0]);
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
  
  // 计算连续装置各月排放量
  const calculateContinuousMonthlyEmissionTotals = () => {
    const totalEmissions = [];
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      continuousUnits.forEach(unit => {
        if (unit.data && unit.data['emission']) {
          const emissionData = unit.data['emission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          monthTotal += parseFloat(emissionValue) || 0;
        }
      });
      totalEmissions.push(monthTotal);
    }
    return totalEmissions;
  };
  
  // 计算间歇装置各月排放量
  const calculateBatchMonthlyEmissionTotals = () => {
    const totalEmissions = [];
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      batchUnits.forEach(unit => {
        if (unit.data && unit.data['emission']) {
          const emissionData = unit.data['emission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          monthTotal += parseFloat(emissionValue) || 0;
        }
      });
      totalEmissions.push(monthTotal);
    }
    return totalEmissions;
  };
  
  // 计算连续装置总排放量
  const continuousTotalEmission = useMemo(() => {
    let total = 0;
    continuousUnits.forEach(unit => {
      if (unit.data && unit.data['emission']) {
        unit.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    return total;
  }, [continuousUnits]);
  
  // 计算间歇装置总排放量
  const batchTotalEmission = useMemo(() => {
    let total = 0;
    batchUnits.forEach(unit => {
      if (unit.data && unit.data['emission']) {
        unit.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    return total;
  }, [batchUnits]);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    return continuousTotalEmission + batchTotalEmission;
  }, [continuousTotalEmission, batchTotalEmission]);
  
  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);
  
  // 渲染连续装置总排放量统计表格
  const renderContinuousTotalEmissionTable = () => {
    const totalEmissions = calculateContinuousMonthlyEmissionTotals();
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>连续烧焦装置排放总量</td>
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
  
  // 渲染间歇装置总排放量统计表格
  const renderBatchTotalEmissionTable = () => {
    const totalEmissions = calculateBatchMonthlyEmissionTotals();
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>间歇烧焦装置排放总量</td>
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
  
  // 渲染总体总排放量统计表格
  const renderOverallTotalEmissionTable = () => {
    const continuousEmissions = calculateContinuousMonthlyEmissionTotals();
    const batchEmissions = calculateBatchMonthlyEmissionTotals();
    const overallEmissions = [];
    for (let i = 0; i < 12; i++) {
      overallEmissions.push(continuousEmissions[i] + batchEmissions[i]);
    }
    const totalYear = overallEmissions.reduce((sum, value) => sum + value, 0);
    
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold', backgroundColor: '#e6f7ff' }}>其它装置催化剂烧焦排放总量</td>
            {overallEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#e6f7ff' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e6f7ff' }}>
              {formatValue(totalYear, 2)}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>其它装置催化剂烧焦排放</h2>
      
      {/* 排放说明 */}
      <div style={{ marginTop: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
          <h3 style={{ marginBottom: '12px' }}>排放说明</h3>
          <p>石油炼制与石油化工生产过程还存在其它需要用到催化剂并可能进行烧焦再生的装置。</p>
          <h3 style={{ marginBottom: '12px', marginTop: '16px' }}>计算说明</h3>
          <p>本组件支持两种烧焦装置类型的排放计算：</p>
          <p>1. 连续烧焦装置：排放量（tCO₂） = 催化剂烧焦量（t） × 焦层中含碳量（%） × (碳氧化率（%）) × 44 / 12</p>
          <p>2. 间歇烧焦装置：排放量（tCO₂） = 待再生的催化剂量 × (1 - 再生前催化剂含碳量%) × (再生前催化剂含碳量% / (1 - 再生前催化剂含碳量%) - 再生后催化剂含碳量% / (1 - 再生后催化剂含碳量%)) × 44 / 12 × (碳氧化率%)</p>
          <p>注：连续烧焦装置类似催化裂化装置，间歇烧焦装置类似催化重整装置。</p>
        </div>
      </div>

      {/* 总体总排放量统计 */}
      { (
        <div style={{ marginTop: '40px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px', color: '#1890ff' }}>总体排放汇总</h3>
          {renderOverallTotalEmissionTable()}
        </div>
      )}
      
      {/* 连续烧焦装置部分 */}
      <div style={{ marginTop: '40px', marginBottom: '40px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1890ff' }}>连续烧焦装置</h3>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={addNewContinuousUnit}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            添加连续烧焦装置
          </button>
        </div>
        
        {/* 连续烧焦装置列表 */}
        {continuousUnits.map((unit) => (
          <div key={unit.id} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0 }}>{unit.name}</h4>
              <button
                onClick={() => removeContinuousUnit(unit.id)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                删除
              </button>
            </div>
            {renderVerticalLayoutTable(unit, CONTINUOUS_INDICATORS, handleContinuousDataChange, handleContinuousFileUpload)}
          </div>
        ))}
        
        {/* 连续烧焦装置总排放量统计 */}
        {continuousUnits.length > 0 && renderContinuousTotalEmissionTable()}
      </div>
      
      {/* 间歇烧焦装置部分 */}
      <div style={{ marginTop: '40px', marginBottom: '40px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1890ff' }}>间歇烧焦装置</h3>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={addNewBatchUnit}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            添加间歇烧焦装置
          </button>
        </div>
        
        {/* 间歇烧焦装置列表 */}
        {batchUnits.map((unit) => (
          <div key={unit.id} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0 }}>{unit.name}</h4>
              <button
                onClick={() => removeBatchUnit(unit.id)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                删除
              </button>
            </div>
            {renderVerticalLayoutTable(unit, BATCH_INDICATORS, handleBatchDataChange, handleBatchFileUpload)}
          </div>
        ))}
        
        {/* 间歇烧焦装置总排放量统计 */}
        {batchUnits.length > 0 && renderBatchTotalEmissionTable()}
      </div>
      
    </div>
  );
}

export default PetroleumOtherCatalystEmission;