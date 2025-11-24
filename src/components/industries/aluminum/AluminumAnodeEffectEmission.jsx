import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DEFAULT_HEAT_EMISSION_FACTOR } from '../../../config/emissionConstants';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 阳极效应温室气体排放相关配置
const DEFAULT_CF4_EMISSION_FACTOR = 0.034; // kgCF4/tAl，阳极效应的CF4排放因子缺省值
const DEFAULT_C2F6_EMISSION_FACTOR = 0.0034; // kgC2F6/tAl，阳极效应的C2F6排放因子缺省值
const CF4_GWP = 6630; // 四氟化碳（CF4）的全球变暖潜势
const C2F6_GWP = 11100; // 六氟化二碳（C2F6）全球变暖潜势
const CF4_FACTOR = 0.143; // 阳极效应持续时间与CF4排放因子的系数

// 阳极效应温室气体排放计算指标
const HEAT_INDICATORS = [
  {
    key: 'aluminumProduction',
    name: '铝液产量',
    unit: 't',
    isCalculated: false,
    precision: 2 // 四舍五入保留到小数点后两位
  },
  {
    key: 'anodeEffectDuration',
    name: '平均每天每槽阳极效应持续时间',
    unit: 'min',
    isCalculated: false,
    precision: 2 // 四舍五入保留到小数点后两位
  },
  {
    key: 'cf4EmissionFactor',
    name: '阳极效应的CF4排放因子',
    unit: 'kgCF4/tAl',
    isCalculated: false,
    defaultValue: 0.034,
    precision: 3 // 四舍五入保留到小数点后三位
  },
  {
    key: 'c2f6EmissionFactor',
    name: '阳极效应的C2F6排放因子',
    unit: 'kgC2F6/tAl',
    isCalculated: false,
    defaultValue: 0.0034,
    precision: 4 // 四舍五入保留到小数点后四位
  },
  {
    key: 'cf4Gwp',
    name: '四氟化碳（CF4）的全球变暖潜势',
    unit: '',
    isCalculated: true,
    fixedValue: 6630,
    precision: 0 // 整数
  },
  {
    key: 'c2f6Gwp',
    name: '六氟化二碳（C2F6）全球变暖潜势',
    unit: '',
    isCalculated: true,
    fixedValue: 11100,
    precision: 0 // 整数
  },
  {
    key: 'emissionAmount',
    name: '阳极效应温室气体排放量',
    unit: 'tCO2',
    isCalculated: true,
    precision: 2 // 四舍五入保留到小数点后两位
  }
];

// 创建初始的指标数据
const createInitialIndicatorData = (indicator) => {
  return MONTHS.map((month, index) => ({
    month: index + 1,
    monthName: month,
    value: indicator.fixedValue !== undefined ? indicator.fixedValue : (indicator.defaultValue !== undefined ? indicator.defaultValue : 0),
    unit: indicator.unit,
  }));
};

// 为工序初始化阳极效应排放数据
const initializeHeatDataForProcess = (process) => {
  const heatData = {};
  
  HEAT_INDICATORS.forEach(indicator => {
    heatData[indicator.key] = createInitialIndicatorData(indicator);
  });
  
  // CF4和C2F6排放因子已在createInitialIndicatorData中通过defaultValue正确初始化
  
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

function AluminumAnodeEffectEmission({ onEmissionChange, productionLines = [], onProductionLinesChange }) {
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
  
  // 更新工序的计算值 - 实现阳极效应温室气体排放计算逻辑
  const updateCalculatedValues = useCallback(() => {
    if (onProductionLinesChange) {
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          if (!process.heatData) return process;
          
          let updatedProcess = { ...process, heatData: { ...process.heatData } };
          let processChanged = false;
          
          // 计算各月份的阳极效应温室气体排放值
          for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const month = monthIndex + 1;
            
            // 获取当月的输入值，增加严格的空值检查和类型转换
            const aluminumProductionData = process.heatData.aluminumProduction?.find(m => m.month === month) || { value: 0 };
            const aluminumProductionValue = parseFloat(aluminumProductionData.value) || 0;
            
            const anodeEffectDurationData = process.heatData.anodeEffectDuration?.find(m => m.month === month) || { value: '' };
            const anodeEffectDurationValue = parseFloat(anodeEffectDurationData.value) || '';
            
            // 获取CF4和C2F6排放因子
            let cf4EmissionFactorValue = DEFAULT_CF4_EMISSION_FACTOR;
            let c2f6EmissionFactorValue = DEFAULT_C2F6_EMISSION_FACTOR;
            
            // 如果提供了阳极效应持续时间，则使用公式计算排放因子
            if (anodeEffectDurationValue !== '') {
              cf4EmissionFactorValue = CF4_FACTOR * anodeEffectDurationValue;
              c2f6EmissionFactorValue = 0.1 * cf4EmissionFactorValue;
            } else {
              // 否则使用输入的排放因子值或默认值
              const cf4Data = process.heatData.cf4EmissionFactor?.find(m => m.month === month) || { value: DEFAULT_CF4_EMISSION_FACTOR };
              cf4EmissionFactorValue = parseFloat(cf4Data.value) || DEFAULT_CF4_EMISSION_FACTOR;
              
              const c2f6Data = process.heatData.c2f6EmissionFactor?.find(m => m.month === month) || { value: DEFAULT_C2F6_EMISSION_FACTOR };
              c2f6EmissionFactorValue = parseFloat(c2f6Data.value) || DEFAULT_C2F6_EMISSION_FACTOR;
            }
            
            // 获取指标定义以确定精度
            const cf4GwpIndicator = HEAT_INDICATORS.find(ind => ind.key === 'cf4Gwp');
            const c2f6GwpIndicator = HEAT_INDICATORS.find(ind => ind.key === 'c2f6Gwp');
            
            // 更新全球变暖潜势值
            const cf4GwpData = updatedProcess.heatData.cf4Gwp || [];
            const c2f6GwpData = updatedProcess.heatData.c2f6Gwp || [];
            
            const cf4GwpMonthIndex = cf4GwpData.findIndex(m => m.month === month);
            const c2f6GwpMonthIndex = c2f6GwpData.findIndex(m => m.month === month);
            
            const newCf4GwpData = [...cf4GwpData];
            const newC2f6GwpData = [...c2f6GwpData];
            
            // 更新CF4全球变暖潜势
            if (cf4GwpMonthIndex !== -1) {
              newCf4GwpData[cf4GwpMonthIndex] = {
                ...newCf4GwpData[cf4GwpMonthIndex],
                value: CF4_GWP,
                unit: cf4GwpIndicator.unit
              };
            } else {
              newCf4GwpData.push({
                month,
                monthName: MONTHS[monthIndex],
                value: CF4_GWP,
                unit: cf4GwpIndicator.unit
              });
              processChanged = true;
            }
            
            // 更新C2F6全球变暖潜势
            if (c2f6GwpMonthIndex !== -1) {
              newC2f6GwpData[c2f6GwpMonthIndex] = {
                ...newC2f6GwpData[c2f6GwpMonthIndex],
                value: C2F6_GWP,
                unit: c2f6GwpIndicator.unit
              };
            } else {
              newC2f6GwpData.push({
                month,
                monthName: MONTHS[monthIndex],
                value: C2F6_GWP,
                unit: c2f6GwpIndicator.unit
              });
              processChanged = true;
            }
            
            // 应用GWP更新
            updatedProcess.heatData.cf4Gwp = newCf4GwpData;
            updatedProcess.heatData.c2f6Gwp = newC2f6GwpData;
            
            // 计算温室气体排放量
            const cf4Emission = aluminumProductionValue * cf4EmissionFactorValue * CF4_GWP / 1000;
            const c2f6Emission = aluminumProductionValue * c2f6EmissionFactorValue * C2F6_GWP / 1000;
            const emissionAmount = cf4Emission + c2f6Emission;
            
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
      
      // 不进行格式化，直接使用用户输入值，仅在展示时格式化
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
                            ? monthData.value.toFixed(indicator.precision ?? 3)
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
                      // 直接传递输入值，不进行任何格式化处理
                      handleDataChange(process.id, indicator.key, monthData.month, e.target.value);
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
      <div className="anode-effect-emission">
        <h2>电解铝工序阳极效应温室气体排放</h2>
        
        <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
          <p><strong>阳极效应温室气体排放计算说明：</strong></p>
          <p><strong>阳极效应的CF4排放因子缺省值：0.034 kgCF4/tAl</strong></p>
          <p><strong>阳极效应的C2F6排放因子缺省值：0.0034 kgC2F6/tAl</strong></p>
          <p><strong>四氟化碳（CF4）的全球变暖潜势：6630</strong></p>
          <p><strong>六氟化二碳（C2F6）全球变暖潜势：11100</strong></p>
          <p><strong>计算方法：</strong></p>
          <p><strong>方式一（未提供阳极效应持续时间时）：</strong></p>
          <p>阳极效应温室气体排放量 = 铝液产量 × 阳极效应的CF4排放因子 × 四氟化碳（CF4）的全球变暖潜势 / 1000 + 铝液产量 × 阳极效应的C2F6排放因子 × 六氟化二碳（C2F6）全球变暖潜势 / 1000</p>
          <p><strong>方式二（提供阳极效应持续时间时）：</strong></p>
          <p>阳极效应的CF4排放因子 = 0.143 × 平均每天每槽阳极效应持续时间</p>
          <p>阳极效应的C2F6排放因子 = 0.1 × 阳极效应的CF4排放因子</p>
          <p>阳极效应温室气体排放量 = 铝液产量 × 阳极效应的CF4排放因子 × 四氟化碳（CF4）的全球变暖潜势 / 1000 + 铝液产量 × 阳极效应的C2F6排放因子 × 六氟化二碳（C2F6）全球变暖潜势 / 1000</p>
          <p><strong>单位说明：</strong></p>
          <p>- 铝液产量单位：t（吨），四舍五入保留到小数点后两位</p>
          <p>- 平均每天每槽阳极效应持续时间单位：min（分钟），四舍五入保留到小数点后两位</p>
          <p>- 阳极效应的CF4排放因子单位：kgCF4/tAl（千克四氟化碳/吨铝），四舍五入保留到小数点后三位</p>
          <p>- 阳极效应的C2F6排放因子单位：kgC2F6/tAl（千克六氟化二碳/吨铝），四舍五入保留到小数点后四位</p>
          <p>- 四氟化碳（CF4）的全球变暖潜势：无单位，固定值6630</p>
          <p>- 六氟化二碳（C2F6）全球变暖潜势：无单位，固定值11100</p>
          <p>- 阳极效应温室气体排放量单位：tCO2（吨二氧化碳当量），四舍五入保留到小数点后两位</p>
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

export default AluminumAnodeEffectEmission;
