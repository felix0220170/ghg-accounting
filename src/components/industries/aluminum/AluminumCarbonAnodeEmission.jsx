import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DEFAULT_HEAT_EMISSION_FACTOR } from '../../../config/emissionConstants';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 炭阳极相关配置
const DEFAULT_CARBON_ANODE_RATE = 0.411; // tC/tAl，吨铝炭阳极净耗量推荐值
const DEFAULT_SULFUR_CONTENT = 2; // %，炭阳极平均含硫量缺省值
const DEFAULT_ASH_CONTENT = 0.4; // %，炭阳极平均灰分含量缺省值

// 炭阳极排放计算指标
const HEAT_INDICATORS = [
  {
    key: 'aluminumProduction',
    name: '铝液产量',
    unit: 't',
    isCalculated: false,
    precision: 2 // 四舍五入保留到小数点后两位
  },
  {
    key: 'carbonAnodeConsumption',
    name: '炭阳极消耗量',
    unit: 't',
    isCalculated: false,
    precision: 2 // 四舍五入保留到小数点后两位
  },
  {
    key: 'carbonAnodeRate',
    name: '吨铝炭阳极净耗量',
    unit: 't/tAl',
    isCalculated: false,
    defaultValue: DEFAULT_CARBON_ANODE_RATE,
    precision: 3 // 四舍五入保留到小数点后三位
  },
  {
    key: 'sulfurContent',
    name: '炭阳极平均含硫量',
    unit: '%',
    isCalculated: false,
    defaultValue: DEFAULT_SULFUR_CONTENT,
    precision: 2 // 四舍五入保留到小数点后两位
  },
  {
    key: 'ashContent',
    name: '炭阳极平均灰分含量',
    unit: '%',
    isCalculated: false,
    defaultValue: DEFAULT_ASH_CONTENT,
    precision: 3 // 四舍五入保留到小数点后三位
  },
  {
    key: 'emissionFactor',
    name: '炭阳极消耗的二氧化碳排放因子',
    unit: 'tCO₂/tAl',
    isCalculated: true,
    precision: 2 // 四舍五入保留到小数点后两位
  },
  {
    key: 'emissionAmount',
    name: '碳排放量',
    unit: 'tCO₂',
    isCalculated: true,
    precision: 2, // 四舍五入保留到小数点后两位
    calculation: (data) => (data.aluminumProduction || 0) * (data.emissionFactor || 0)
  }
];

// 创建初始的指标数据
const createInitialIndicatorData = (indicator) => {
  return MONTHS.map((month, index) => ({
    month: index + 1,
    monthName: month,
    value: indicator.defaultValue !== undefined ? indicator.defaultValue : 0,
    unit: indicator.unit,
  }));
};

// 为工序初始化炭阳极数据
const initializeHeatDataForProcess = (process, emissionFactor) => {
  const heatData = {};
  
  HEAT_INDICATORS.forEach(indicator => {
    heatData[indicator.key] = createInitialIndicatorData(indicator);
  });
  
  // 为炭阳极排放因子设置默认值
  heatData.emissionFactor = heatData.emissionFactor.map(item => ({
    ...item,
    value: emissionFactor
  }));
  
  return {
    ...process,
    heatData,
    files: process.files || {} // 初始化files对象用于存储支撑材料
  };
};

// 根据指标精度格式化数值
const formatValueByPrecision = (value, indicator) => {
  if (value === '' || value === null || value === undefined) return 0;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 0;
  
  return parseFloat(numValue.toFixed(indicator.precision));
};

function AluminumCarbonAnodeEmission({ onEmissionChange, productionLines = [], onProductionLinesChange }) {
  // 将productionLines重命名为processes以符合工序驱动的概念
  const processes = productionLines;
  
  // 格式化数值显示，根据指标类型使用不同的小数位数
  const formatValue = (value, indicatorKey = '') => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    
    // 解析为浮点数
    const numValue = parseFloat(value);
    // 确保是有效数字
    if (isNaN(numValue)) return '';
    
    // A、B、C指标（inputHeat、outputHeat、consumedHeat）使用GJ单位，保留两位小数
    if (['inputHeat', 'outputHeat', 'consumedHeat'].includes(indicatorKey)) {
      return numValue.toFixed(2);
    }
    
    // 排放量使用两位小数
    if (indicatorKey === 'emission') {
      return numValue.toFixed(2);
    }
    
    // 其他指标使用默认两位小数
    return numValue.toFixed(2);
  };
  
  // 保存上一次的排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 初始化工序的炭阳极数据 - 仅在组件首次挂载时执行一次，避免无限循环
  useEffect(() => {
    if (onProductionLinesChange) {
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          // 只有在需要修改时才创建新对象
          if (!process.heatData) {
            hasChanges = true;
            return initializeHeatDataForProcess(process);
          }
          
          // 没有变化，直接返回原对象
          return process;
        });
        
        // 只有在有实际变化时才返回新数组
        return hasChanges ? updatedProcesses : prevProcesses;
      });
    }
  }, []); // 空依赖数组，确保只在组件挂载时执行一次
  
  // 辅助函数：更新流程中的指标值
  const updateProcessIndicator = (process, indicatorKey, month, value, unit = 'GJ') => {
    const currentHeatData = process.heatData || {};
    const currentIndicatorData = currentHeatData[indicatorKey] || [];
    
    const updatedIndicatorData = [...currentIndicatorData];
    const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
    
    if (monthIndex !== -1) {
      // 只有值发生变化时才更新
      if (updatedIndicatorData[monthIndex].value !== value) {
        updatedIndicatorData[monthIndex] = {
          ...updatedIndicatorData[monthIndex],
          value,
          unit
        };
        return {
          ...process,
          heatData: {
            ...currentHeatData,
            [indicatorKey]: updatedIndicatorData
          }
        };
      }
    } else {
      // 添加新的月份数据
      updatedIndicatorData.push({
        month,
        monthName: MONTHS[month - 1],
        value,
        unit
      });
      
      return {
        ...process,
        heatData: {
          ...currentHeatData,
          [indicatorKey]: updatedIndicatorData
        }
      };
    }
    
    // 如果没有变化，返回原对象
    return process;
  }
  
  // 更新工序的计算值 - 实现炭阳极排放计算逻辑
  const updateCalculatedValues = useCallback(() => {
    if (onProductionLinesChange) {
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          if (!process.heatData) return process;
          
          let updatedProcess = { ...process, heatData: { ...process.heatData } };
          let processChanged = false;
          
          // 计算各月份的炭阳极排放值
          for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const month = monthIndex + 1;
            
            // 获取当月的输入值，增加严格的空值检查和类型转换
            const carbonAnodeRateData = process.heatData.carbonAnodeRate?.find(m => m.month === month) || { value: DEFAULT_CARBON_ANODE_RATE };
            const carbonAnodeRateValue = parseFloat(carbonAnodeRateData.value) || DEFAULT_CARBON_ANODE_RATE;
            
            const sulfurContentData = process.heatData.sulfurContent?.find(m => m.month === month) || { value: DEFAULT_SULFUR_CONTENT };
            const sulfurContentValue = parseFloat(sulfurContentData.value) || DEFAULT_SULFUR_CONTENT;
            
            const ashContentData = process.heatData.ashContent?.find(m => m.month === month) || { value: DEFAULT_ASH_CONTENT };
            const ashContentValue = parseFloat(ashContentData.value) || DEFAULT_ASH_CONTENT;
            
            const aluminumProductionData = process.heatData.aluminumProduction?.find(m => m.month === month) || { value: 0 };
            const aluminumProductionValue = parseFloat(aluminumProductionData.value) || 0;
            
            // 计算炭阳极消耗的二氧化碳排放因子
            // 计算逻辑：基于碳阳极净耗量、含硫量和灰分含量
            const carbonContentRate = 1 - (sulfurContentValue / 100) - (ashContentValue / 100);
            const carbonFactor = carbonAnodeRateValue * carbonContentRate * (44/12); // 44/12是CO2/C的摩尔质量比
            
            // 获取指标定义以确定精度
            const emissionFactorIndicator = HEAT_INDICATORS.find(ind => ind.key === 'emissionFactor');
            const formattedEmissionFactor = formatValueByPrecision(carbonFactor, emissionFactorIndicator);
            
            // 更新emissionFactor数据
            const currentEmissionFactorData = updatedProcess.heatData.emissionFactor || [];
            const emissionFactorMonthIndex = currentEmissionFactorData.findIndex(m => m.month === month);
            const newEmissionFactorData = [...currentEmissionFactorData];
            
            if (emissionFactorMonthIndex !== -1) {
              // 只有当值真正改变时才更新
              if (parseFloat(newEmissionFactorData[emissionFactorMonthIndex].value) !== formattedEmissionFactor) {
                newEmissionFactorData[emissionFactorMonthIndex] = {
                  ...newEmissionFactorData[emissionFactorMonthIndex],
                  value: formattedEmissionFactor,
                  unit: emissionFactorIndicator.unit
                };
                processChanged = true;
              }
            } else {
              // 添加新的月份数据
              newEmissionFactorData.push({
                month,
                monthName: MONTHS[monthIndex],
                value: formattedEmissionFactor,
                unit: emissionFactorIndicator.unit
              });
              processChanged = true;
            }
            
            // 更新emissionFactor数据
            updatedProcess.heatData.emissionFactor = newEmissionFactorData;
            
            // 计算排放量 = 铝液产量 * 排放因子
            const emissionAmount = aluminumProductionValue * formattedEmissionFactor;
            
            // 获取排放量指标定义以确定精度
            const emissionAmountIndicator = HEAT_INDICATORS.find(ind => ind.key === 'emissionAmount');
            const formattedEmissionAmount = formatValueByPrecision(emissionAmount, emissionAmountIndicator);
            
            // 手动更新排放量
            const currentEmissionData = updatedProcess.heatData.emissionAmount || [];
            const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
            const newEmissionData = [...currentEmissionData];
            
            if (emissionMonthIndex !== -1) {
              // 只有当值真正改变时才更新
              if (parseFloat(newEmissionData[emissionMonthIndex].value) !== formattedEmissionAmount) {
                newEmissionData[emissionMonthIndex] = {
                  ...newEmissionData[emissionMonthIndex],
                  value: formattedEmissionAmount,
                  unit: emissionAmountIndicator.unit
                };
                processChanged = true;
              }
            } else {
              // 添加新的月份数据
              newEmissionData.push({
                month,
                monthName: MONTHS[monthIndex],
                value: formattedEmissionAmount,
                unit: emissionAmountIndicator.unit
              });
              processChanged = true;
            }
            
            // 应用更新
            updatedProcess = {
              ...updatedProcess,
              heatData: {
                ...updatedProcess.heatData,
                emissionAmount: newEmissionData
              }
            };
          }
          
          if (processChanged) {
            hasChanges = true;
            return updatedProcess;
          }
          
          return process;
        });
        
        return hasChanges ? updatedProcesses : prevProcesses;
      });
    }
  }, [onProductionLinesChange]);
    
  // 当排放因子变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues]); // 不再需要heatEmissionFactor，因为已在updateCalculatedValues的依赖项中
  
  // 当processes变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [processes.length, updateCalculatedValues]); // 只依赖processes的长度变化来避免循环
  
  // 计算总排放量和工序详细排放数据
  const { totalEmission, processEmissions } = useMemo(() => {
    if (!Array.isArray(processes)) return { totalEmission: 0, processEmissions: {} };
    
    let total = 0;
    const emissionsByProcess = {};
    
    processes.forEach(process => {
      if (!process.heatData || !process.heatData.emissionAmount) return;
      
      // 初始化该工序的排放数据
      emissionsByProcess[process.id] = {
        monthlyData: [],
        yearlyTotal: 0
      };
      
      let processTotal = 0;
      
      // 遍历所有月份的排放量
      for (let i = 0; i < 12; i++) {
        const monthData = process.heatData.emissionAmount.find(m => m.month === i + 1);
        const emission = monthData ? parseFloat(monthData.value) || 0 : 0;
        total += emission;
        processTotal += emission;
        
        // 存储月度数据
        emissionsByProcess[process.id].monthlyData[i] = emission;
      }
      
      // 存储工序全年总计
      emissionsByProcess[process.id].yearlyTotal = processTotal;
    });
    
    return { totalEmission: total, processEmissions: emissionsByProcess };
  }, [processes]);



  // 处理数据变化（新的炭阳极布局）
  const handleDataChange = useCallback((processId, indicatorKey, month, value) => {
    if (onProductionLinesChange) {
      // 获取指标定义以确定单位和精度
      const indicatorDefinition = HEAT_INDICATORS.find(ind => ind.key === indicatorKey);
      
      // 格式化输入值
      let formattedValue = value;
      
      // 使用函数式更新获取最新的processes
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          if (process.id === processId) {
            // 确保heatData存在
            const currentHeatData = process.heatData || {};
            const currentIndicatorData = currentHeatData[indicatorKey] || [];
            
            // 创建新数组以避免直接修改原数组
            const updatedIndicatorData = [...currentIndicatorData];
            const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
            
            if (monthIndex !== -1) {
              // 更新现有月份数据
              if (parseFloat(updatedIndicatorData[monthIndex].value) !== formattedValue) {
                updatedIndicatorData[monthIndex] = {
                  ...updatedIndicatorData[monthIndex],
                  value: formattedValue
                };
                hasChanges = true;
              }
            } else {
              // 如果月份数据不存在，创建它
              hasChanges = true;
              updatedIndicatorData.push({
                month,
                monthName: MONTHS[month - 1],
                value: formattedValue,
                unit: indicatorDefinition?.unit || ''
              });
            }
            
            // 只有在有变化时才创建新对象
            if (hasChanges) {
              const updatedProcess = {
                ...process,
                heatData: {
                  ...currentHeatData,
                  [indicatorKey]: updatedIndicatorData
                }
              };
              
              // 数据更新后，需要重新计算依赖此数据的计算值
              // 但这里不直接调用updateCalculatedValues，避免循环
              // 计算会在单独的useEffect中触发
              return updatedProcess;
            }
          }
          return process;
        });
        
        return hasChanges ? updatedProcesses : prevProcesses;
      });
    }
  }, [onProductionLinesChange]);

  // 更新月度数据，通过回调通知父组件
  const updateMonthlyData = useCallback((processId, monthIndex, field, value) => {
    // 将旧格式的调用转换为新格式
    const month = monthIndex + 1;
    handleDataChange(processId, field, month, value);
  }, [handleDataChange]);
  
  // 更新支撑材料文件
  const updateFile = useCallback((processId, indicatorKey, file) => {
    if (!file || !onProductionLinesChange) return;
    
    // 创建一个文件对象，包含文件名和模拟的文件路径
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      path: `/uploads/${Date.now()}_${file.name}` // 模拟文件路径
    };
    
    // 更新processes状态，保存文件信息
    onProductionLinesChange(prevProcesses => {
      if (!Array.isArray(prevProcesses)) return prevProcesses;
      
      return prevProcesses.map(process => {
        if (process.id === processId) {
          // 如果process中还没有files对象，创建一个
          const existingFiles = process.files || {};
          return {
            ...process,
            files: {
              ...existingFiles,
              [indicatorKey]: fileInfo
            }
          };
        }
        return process;
      });
    });
    
    // 可以在这里添加实际的文件上传逻辑
    console.log('上传文件:', fileInfo, '到工序:', processId, '指标:', indicatorKey);
  }, [onProductionLinesChange]);
  
  // 计算各月排放总量的函数
  const calculateMonthlyEmissionTotals = useCallback(() => {
    const monthlyTotals = [];
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const month = monthIndex + 1; // 将索引转换为月份（1-12）
      let monthTotal = 0;
      if (Array.isArray(processes)) {
        processes.forEach(process => {
          if (process.heatData && process.heatData['emissionAmount']) {
            // 获取该月的排放数据
            const emissionData = process.heatData['emissionAmount'];
            const monthData = emissionData.find(m => m.month === month); // 现在使用正确的月份值
            const emissionValue = monthData?.value || '';
            
            // 确保值有效且可转换为数字
            if (emissionValue !== '' && !isNaN(parseFloat(emissionValue))) {
              monthTotal += parseFloat(emissionValue);
            }
          }
        });
      }
      monthlyTotals.push(monthTotal);
    }
    
    // 计算全年总计
    const yearlyTotal = monthlyTotals.reduce((sum, value) => sum + value, 0);
    
    return { monthlyTotals, yearlyTotal };
  }, [processes]);

  // 当排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      // 传递包含总排放量和工序详细排放数据的对象
      onEmissionChange({
        totalEmission,
        processEmissions
      });
    }
  }, [totalEmission, processEmissions, onEmissionChange]);
  
  // 渲染纵向布局的表格
  const renderVerticalLayoutTable = (process) => {
    if (!process.heatData) return null;
    
    const indicators =  HEAT_INDICATORS;
    
    // 表头：指标名称、单位、1-12月、全年值、获取方式、数据来源、支撑材料
    const tableHeaders = (
      <thead>
        <tr style={{ backgroundColor: '#f5f5f5' }}>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>指标名称</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>单位</th>
          {MONTHS.map((month, index) => (
            <th key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{month}</th>
          ))}
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>全年值</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '100px' }}>获取方式</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '120px' }}>数据来源</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '150px' }}>支撑材料</th>
        </tr>
      </thead>
    );

    // 表格主体：按指标分组显示
    const tableBody = (
      <tbody>
        {indicators.map((indicator) => (
          <tr key={indicator.key}>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{indicator.name}</td>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{indicator.unit}</td>
            {process.heatData[indicator.key] && process.heatData[indicator.key].map((monthData, monthIndex) => (
              <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {indicator.isCalculated || indicator.key === 'emissionFactor' ? (
                  <div style={{ backgroundColor: '#fafafa' }}>
                    {typeof monthData.value === 'number' && indicator.unit === 'tCO₂'
                      ? monthData.value.toFixed(2)
                      : typeof monthData.value === 'number' && indicator.unit === 'tCO₂/tAl'
                        ? monthData.value.toFixed(2)
                        : typeof monthData.value === 'number' && indicator.unit === 'GJ'
                          ? monthData.value.toFixed(2)
                          : typeof monthData.value === 'number'
                            ? monthData.value.toFixed(indicator.precision || 3)
                            : indicator.unit === 'GJ'
                              ? '0.00'
                              : '0.000'}
                  </div>
                ) : (
                  <input
                    type="number"
                    step="0.001"
                    value={monthData.value || ''}
                    style={{ width: '100%', textAlign: 'center' }}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // 直接传递输入值，不进行toFixed格式化
                      handleDataChange(process.id, indicator.key, monthData.month, inputValue);
                    }}
                  />
                )}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
              {indicator.isCalculated || indicator.defaultValue ? "" : calculateAnnualTotal(process.heatData[indicator.key])}
            </td>
            {/* 获取方式 */}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              {indicator.isCalculated ? '计算值' : ''}
            </td>
            {/* 数据来源 */}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              <input
                type="text"
                placeholder="数据来源"
                style={{ width: '100%', textAlign: 'center' }}
              />
            </td>
            {/* 支撑材料 */}
              <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                  {!indicator.isCalculated && (
                    <input
                      type="file"
                      onChange={(e) => updateFile(process.id, indicator.key, e.target.files[0])}
                      style={{ fontSize: '12px' }}
                    />
                  )}
                </td>
          </tr>
        ))}
      </tbody>
    );

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        {tableHeaders}
        {tableBody}
      </table>
    );
  };

  // 计算某指标的全年总值
  const calculateAnnualTotal = (monthlyData) => {
    if (!Array.isArray(monthlyData)) return '0.000';
    
    const total = monthlyData.reduce((sum, month) => {
      const value = parseFloat(month.value) || 0;
      return sum + value;
    }, 0);
    
    // 根据单位判断小数位数
    const unit = monthlyData.length > 0 && monthlyData[0].unit;
    const indicator = HEAT_INDICATORS.find(ind => ind.unit === unit);
    
    if (indicator && typeof indicator.precision === 'number') {
      return total.toFixed(indicator.precision);
    } else if (unit === 'tCO₂') {
      return total.toFixed(2);
    } else if (unit === 't/tAl') {
      return total.toFixed(3);
    } else {
      return total.toFixed(2);
    }
  };

  // 移除了ensureThreeDecimals函数，因为现在使用onChange直接处理输入值
  
  return (
    <div className="carbon-anode-emission">
      <h2>炭阳极消耗排放</h2>
      
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>炭阳极消耗排放计算说明：</strong></p>
        <p><strong>吨铝炭阳极净耗量推荐值：0.411 tC/tAl</strong></p>
        <p><strong>炭阳极平均含硫量缺省值：2%</strong></p>
        <p><strong>炭阳极平均灰分含量缺省值：0.4%</strong></p>
        <p><strong>计算方法：</strong></p>
        <p>炭阳极消耗的二氧化碳排放因子 = 吨铝炭阳极净耗量 × (1 - 含硫量/100 - 灰分含量/100) × (44/12)</p>
        <p>碳排放量 = 铝液产量 × 炭阳极消耗的二氧化碳排放因子</p>
        <p><strong>单位说明：</strong></p>
        <p>- 铝液产量、炭阳极消耗量单位：t（吨），四舍五入保留到小数点后两位</p>
        <p>- 吨铝炭阳极净耗量单位：t/tAl（吨/吨铝），四舍五入保留到小数点后三位</p>
        <p>- 炭阳极平均含硫量单位：%，四舍五入保留到小数点后两位</p>
        <p>- 炭阳极平均灰分含量单位：%，四舍五入保留到小数点后三位</p>
        <p>- 炭阳极消耗的二氧化碳排放因子单位：tCO₂/tAl（吨二氧化碳/吨铝），四舍五入保留到小数点后两位</p>
        <p>- 碳排放量单位：tCO₂（吨二氧化碳），四舍五入保留到小数点后两位</p>
      </div>
      {/* 月度排放总量表格 */}
      <div className="calculation-section" style={{ marginTop: '20px' }}>
        <h3 className="section-title">月度排放总量汇总表</h3>
        <div className="table-container" style={{ overflowX: 'auto', marginBottom: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: '1200px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '150px' }}>指标</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                  <th key={month} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '80px' }}>{month}月</th>
                ))}
                <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '100px', fontWeight: 'bold' }}>全年总计</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>碳排放量 (tCO₂)</td>
                {(() => {
                  // 调用计算函数获取月度和年度排放总量
                  const { monthlyTotals, yearlyTotal } = calculateMonthlyEmissionTotals();
                  
                  // 渲染各月数据和总计
                  return [
                    ...monthlyTotals.map((total, index) => (
                      <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                        {total.toFixed(2)}
                      </td>
                    )),
                    <td key="total" style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                      {yearlyTotal.toFixed(2)}
                    </td>
                  ];
                })()}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 工序列表 */}
      {Array.isArray(processes) && processes.map((process, processIndex) => (
        <div key={process.id} className="process-section" style={{ marginBottom: '30px', padding: '20px', border: '2px solid #2196F3', borderRadius: '8px', backgroundColor: '#f0f8ff' }}>
          <div className="process-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: '10px 0' }}>{process.processName || process.name || `工序 ${processIndex + 1}`}</h3>
          </div>
          
          {/* 使用新的纵向布局表格渲染函数 */}
          {renderVerticalLayoutTable(process)}
        </div>
      ))}
      
    </div>
  );
}

export default AluminumCarbonAnodeEmission;
