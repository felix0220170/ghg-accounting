import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// HCFC-22生产线指标定义
const HCF22_PRODUCTION_INDICATORS = [
  {
    key: 'hcfc22Production',
    name: 'HCFC-22产量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'hfc23GenerationFactor',
    name: 'HFC-23生成因子',
    unit: 'tHFC-23/tHCFC-22',
    isCalculated: false,
    decimalPlaces: 4,
    defaultValue: 0.015
  },
  {
    key: 'hfc23Recovery',
    name: 'HFC-23回收量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'hfc23Generated',
    name: 'HFC-23产生量',
    unit: 't',
    isCalculated: true,
    decimalPlaces: 2,
    getValue: (data) => {
      const { hcfc22Production, hfc23GenerationFactor, hfc23Recovery } = data;
      return hcfc22Production * hfc23GenerationFactor - hfc23Recovery;
    }
  }
];

// HFC-23销毁装置指标定义
const HFC23_DESTRUCTION_INDICATORS = [
  {
    key: 'hfc23Input',
    name: '进入销毁装置的HFC-23量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'hfc23Output',
    name: '从销毁装置出口排出的HFC-23量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'hfc23Destroyed',
    name: 'HFC-23销毁量',
    unit: 't',
    isCalculated: true,
    decimalPlaces: 2,
    getValue: (data) => {
      const { hfc23Input, hfc23Output } = data;
      return hfc23Input - hfc23Output;
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

// 为HCFC-22生产线初始化数据（纵向布局）
const initializeHCFC22ProductionLineData = (lineNumber) => {
  const initialData = createInitialIndicatorData(HCF22_PRODUCTION_INDICATORS);
  
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
    id: `hcfc22-production-${Date.now()}`,
    lineNumber: lineNumber,
    name: `HCFC-22生产线 ${lineNumber}`,
    data: initialData,
    files: {}
  };
};

// 为HFC-23销毁装置初始化数据（纵向布局）
const initializeHFC23DestructionDeviceData = (deviceNumber) => {
  const initialData = createInitialIndicatorData(HFC23_DESTRUCTION_INDICATORS);
  
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
    id: `hfc23-destruction-${Date.now()}`,
    deviceNumber: deviceNumber,
    name: `HFC-23销毁装置 ${deviceNumber}`,
    data: initialData,
    files: {}
  };
};

function FluorineProcessEmission({ onEmissionChange }) {
  // HCFC-22生产线列表状态
  const [productionLines, setProductionLines] = useState([]);
  
  // HFC-23销毁装置列表状态
  const [destructionDevices, setDestructionDevices] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 添加新的HCFC-22生产线
  const addNewProductionLine = useCallback(() => {
    const newLineNumber = productionLines.length + 1;
    const newProductionLine = initializeHCFC22ProductionLineData(newLineNumber);
    setProductionLines(prevLines => [...prevLines, newProductionLine]);
  }, [productionLines]);
  
  // 移除HCFC-22生产线
  const removeProductionLine = useCallback((lineId) => {
    setProductionLines(prevLines => prevLines.filter(line => line.id !== lineId));
  }, []);
  
  // 添加新的HFC-23销毁装置
  const addNewDestructionDevice = useCallback(() => {
    const newDeviceNumber = destructionDevices.length + 1;
    const newDestructionDevice = initializeHFC23DestructionDeviceData(newDeviceNumber);
    setDestructionDevices(prevDevices => [...prevDevices, newDestructionDevice]);
  }, [destructionDevices]);
  
  // 移除HFC-23销毁装置
  const removeDestructionDevice = useCallback((deviceId) => {
    setDestructionDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
  }, []);
  
  // 格式化数值显示
  const formatValue = (value, decimalPlaces = 2) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toFixed(decimalPlaces);
  };
  
  // 更新计算值 - 实现HFC-23产生量和销毁量计算逻辑
  const updateCalculatedValues = useCallback(() => {
    // 处理HCFC-22生产线数据计算
    setProductionLines(prevLines => {
      let hasChanges = false;
      const updatedLines = prevLines.map(line => {
        if (!line.data) return line;
        
        let updatedLine = { ...line, data: { ...line.data } };
        let lineChanged = false;
        
        // 计算各月份的HFC-23产生量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的HCFC-22产量
          const productionData = line.data.hcfc22Production?.find(m => m.month === month);
          const productionValue = productionData?.value ? parseFloat(productionData.value) : 0;
          
          // 获取当月的HFC-23生成因子
          const factorData = line.data.hfc23GenerationFactor?.find(m => m.month === month);
          const factorValue = factorData?.value ? parseFloat(factorData.value) : 0;
          
          // 获取当月的HFC-23回收量
          const recoveryData = line.data.hfc23Recovery?.find(m => m.month === month);
          const recoveryValue = recoveryData?.value ? parseFloat(recoveryData.value) : 0;
          
          // 计算HFC-23产生量：产量 * 生成因子 - 回收量
          const hfc23GeneratedValue = productionValue * factorValue - recoveryValue;
          
          // 更新HFC-23产生量数据
          const currentGeneratedData = updatedLine.data.hfc23Generated || [];
          const generatedMonthIndex = currentGeneratedData.findIndex(m => m.month === month);
          const newGeneratedData = [...currentGeneratedData];
          
          if (generatedMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newGeneratedData[generatedMonthIndex].value) !== hfc23GeneratedValue) {
              newGeneratedData[generatedMonthIndex] = {
                ...newGeneratedData[generatedMonthIndex],
                value: hfc23GeneratedValue,
                unit: 't'
              };
              lineChanged = true;
            }
          } else if (hfc23GeneratedValue !== 0) {
            // 确保产生量不为0时才添加新数据
            newGeneratedData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: hfc23GeneratedValue,
              unit: 't'
            });
            lineChanged = true;
          }
          
          // 应用更新
          updatedLine = {
            ...updatedLine,
            data: {
              ...updatedLine.data,
              hfc23Generated: newGeneratedData
            }
          };
        }
        
        if (lineChanged) {
          hasChanges = true;
          return updatedLine;
        }
        
        return line;
      });
      
      return hasChanges ? updatedLines : prevLines;
    });
    
    // 处理HFC-23销毁装置数据计算
    setDestructionDevices(prevDevices => {
      let hasChanges = false;
      const updatedDevices = prevDevices.map(device => {
        if (!device.data) return device;
        
        let updatedDevice = { ...device, data: { ...device.data } };
        let deviceChanged = false;
        
        // 计算各月份的HFC-23销毁量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的进入销毁装置HFC-23量
          const inputData = device.data.hfc23Input?.find(m => m.month === month);
          const inputValue = inputData?.value ? parseFloat(inputData.value) : 0;
          
          // 获取当月的从销毁装置出口排出的HFC-23量
          const outputData = device.data.hfc23Output?.find(m => m.month === month);
          const outputValue = outputData?.value ? parseFloat(outputData.value) : 0;
          
          // 计算HFC-23销毁量：入口量 - 出口量
          const destroyedValue = inputValue - outputValue;
          
          // 更新HFC-23销毁量数据
          const currentDestroyedData = updatedDevice.data.hfc23Destroyed || [];
          const destroyedMonthIndex = currentDestroyedData.findIndex(m => m.month === month);
          const newDestroyedData = [...currentDestroyedData];
          
          if (destroyedMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newDestroyedData[destroyedMonthIndex].value) !== destroyedValue) {
              newDestroyedData[destroyedMonthIndex] = {
                ...newDestroyedData[destroyedMonthIndex],
                value: destroyedValue,
                unit: 't'
              };
              deviceChanged = true;
            }
          } else if (destroyedValue !== 0) {
            // 确保销毁量不为0时才添加新数据
            newDestroyedData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: destroyedValue,
              unit: 't'
            });
            deviceChanged = true;
          }
          
          // 应用更新
          updatedDevice = {
            ...updatedDevice,
            data: {
              ...updatedDevice.data,
              hfc23Destroyed: newDestroyedData
            }
          };
        }
        
        if (deviceChanged) {
          hasChanges = true;
          return updatedDevice;
        }
        
        return device;
      });
      
      return hasChanges ? updatedDevices : prevDevices;
    });
  }, []);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, productionLines, destructionDevices]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'production-line') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 根据类型选择对应的状态设置函数和指标定义
    const setState = type === 'production-line' ? setProductionLines : setDestructionDevices;
    const indicators = type === 'production-line' ? HCF22_PRODUCTION_INDICATORS : HFC23_DESTRUCTION_INDICATORS;
    
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
  }, []);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'production-line') => {
    if (!file) return;
    
    // 根据类型选择对应的状态设置函数
    const setState = type === 'production-line' ? setProductionLines : setDestructionDevices;
    
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
            const indicators = type === 'production-line' ? HCF22_PRODUCTION_INDICATORS : HFC23_DESTRUCTION_INDICATORS;
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
  }, []);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let totalHFC23Generated = 0;
    let totalHFC23Destroyed = 0;
    
    // 计算所有生产线产生的HFC-23总量
    productionLines.forEach(line => {
      if (line.data && line.data['hfc23Generated']) {
        line.data['hfc23Generated'].forEach(monthData => {
          totalHFC23Generated += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    // 计算所有销毁装置销毁的HFC-23总量
    destructionDevices.forEach(device => {
      if (device.data && device.data['hfc23Destroyed']) {
        device.data['hfc23Destroyed'].forEach(monthData => {
          totalHFC23Destroyed += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    // 总HFC-23量 = 产生量 - 销毁量
    const totalHFC23 = totalHFC23Generated - totalHFC23Destroyed;
    
    // 总排放 = 总HFC-23量 * GWP(11700) + 销毁装置总HFC-23量 * 44/70
    const hfc23Emission = totalHFC23 * 11700;
    const co2FromDestruction = totalHFC23Destroyed * 44 / 70;
    
    return hfc23Emission + co2FromDestruction;
  }, [productionLines, destructionDevices]);
  
  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);
  
  // 渲染纵向布局的表格
  const renderVerticalLayoutTable = (item, indicators, type = 'production-line') => {
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
  
  // 计算各月排放量
  const calculateMonthlyEmissionTotals = () => {
    const totalEmissions = [];
    const totalHFC23Generated = [];
    const totalHFC23Destroyed = [];
    
    for (let month = 0; month < 12; month++) {
      let monthHFC23Generated = 0;
      let monthHFC23Destroyed = 0;
      
      // 计算各生产线HFC-23产生量
      productionLines.forEach(line => {
        if (line.data && line.data['hfc23Generated']) {
          const generatedData = line.data['hfc23Generated'];
          const monthData = generatedData.find(d => d.month === month + 1);
          const generatedValue = monthData?.value || 0;
          monthHFC23Generated += parseFloat(generatedValue) || 0;
        }
      });
      
      // 计算各销毁装置HFC-23销毁量
      destructionDevices.forEach(device => {
        if (device.data && device.data['hfc23Destroyed']) {
          const destroyedData = device.data['hfc23Destroyed'];
          const monthData = destroyedData.find(d => d.month === month + 1);
          const destroyedValue = monthData?.value || 0;
          monthHFC23Destroyed += parseFloat(destroyedValue) || 0;
        }
      });
      
      totalHFC23Generated.push(monthHFC23Generated);
      totalHFC23Destroyed.push(monthHFC23Destroyed);
      
      // 计算当月总排放：总HFC-23量 * GWP + 销毁量 * 44/70
      const monthTotalHFC23 = monthHFC23Generated - monthHFC23Destroyed;
      const hfc23Emission = monthTotalHFC23 * 11700;
      const co2FromDestruction = monthHFC23Destroyed * 44 / 70;
      totalEmissions.push(hfc23Emission + co2FromDestruction);
    }
    
    return { totalEmissions, totalHFC23Generated, totalHFC23Destroyed };
  };
  
  // 渲染总排放量统计表格
  const renderTotalEmissionTable = () => {
    const { totalEmissions, totalHFC23Generated, totalHFC23Destroyed } = calculateMonthlyEmissionTotals();
    
    // 计算全年总计
    const totalYear = totalEmissions.reduce((sum, value) => sum + value, 0);
    const totalHFC23GeneratedYear = totalHFC23Generated.reduce((sum, value) => sum + value, 0);
    const totalHFC23DestroyedYear = totalHFC23Destroyed.reduce((sum, value) => sum + value, 0);
    
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>HFC-23产生量 (t)</td>
            {totalHFC23Generated.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {formatValue(totalHFC23GeneratedYear, 2)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>HFC-23销毁量 (t)</td>
            {totalHFC23Destroyed.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {formatValue(totalHFC23DestroyedYear, 2)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>总排放量</td>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>HCFC-22生产过程HFC-23排放</h2>

      {/* HCFC-22生产过程HFC-23排放 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '12px' }}>排放说明</h3>
            <p>HCFC-22生产过程中会产生副产物HFC-23气体。企业可能回收部分 HFC-23 作为产品卖给第三方，或安装 HFC-23 销毁装置销毁部分 HFC-23，其余部分则排放到大气中。</p>
            <p>本组件用于计算HCFC-22生产过程中的HFC-23排放量，包括HFC-23产生量、销毁量以及最终排放量。通过优化生产参数和销毁装置运行，可以有效减少HFC-23的温室气体排放。</p>
            <h3 style={{ marginBottom: '12px' }}>计算说明</h3>
            <p>HCFC-22生产过程HFC-23排放计算方法：</p>
            <p>1. HFC-23产生量 = HCFC-22产量 × HFC-23生成因子 - HFC-23回收量</p>
            <p>2. HFC-23销毁量 = 进入销毁装置的HFC-23量 - 从销毁装置出口排出的HFC-23量</p>
            <p>3. 总排放量 = (总HFC-23产生量 - 总销毁量) × 11700 + 销毁装置总HFC-23量 × 44/70</p>
            <p>- HCFC-22产量单位为t，保留两位小数</p>
            <p>- HFC-23生成因子单位为tHFC-23/tHCFC-22，默认值为0.015</p>
            <p>- HFC-23回收量和销毁量单位为t，保留两位小数</p>
            <p>- 排放量单位为tCO₂e，保留两位小数</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>技术要点：</h4>
            <p>- GWP(11700)：HFC-23的全球增温潜势，反映其温室效应强度</p>
            <p>- 44/70：销毁过程中CO₂与HFC-23的摩尔质量比</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        {/* HCFC-22生产线管理 */}
        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加HCFC-22生产线</h3>

          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '16px', alignItems: 'end' }}>
            <button
              onClick={addNewProductionLine}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              添加HCFC-22生产线
            </button>
          </div>
        </div>
        <div>
          {productionLines.map((line, index) => (
            <div key={line.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>HCFC-22生产线 {index + 1}</h3>
                </div>
                <button
                  onClick={() => removeProductionLine(line.id)}
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
              
              {renderVerticalLayoutTable(line, HCF22_PRODUCTION_INDICATORS, 'production-line')}
            </div>
          ))}
        </div>

        {/* HFC-23销毁装置管理 */}
        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#52c41a', fontWeight: 'bold', fontSize: '18px' }}>添加HFC-23销毁装置</h3>

          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '16px', alignItems: 'end' }}>
            <button
              onClick={addNewDestructionDevice}
              style={{
                padding: '8px 16px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              添加HFC-23销毁装置
            </button>
          </div>
        </div>
        <div>
          {destructionDevices.map((device, index) => (
            <div key={device.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>HFC-23销毁装置 {index + 1}</h3>
                </div>
                <button
                  onClick={() => removeDestructionDevice(device.id)}
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
              
              {renderVerticalLayoutTable(device, HFC23_DESTRUCTION_INDICATORS, 'destruction-device')}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default FluorineProcessEmission;