import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 默认电网排放因子
const DEFAULT_GRID_EMISSION_FACTOR = 0.5366;

// 电力指标定义 - 方式1
const ELECTRICITY_INDICATORS_METHOD1 = [
  { key: 'inputTotalElectricity', name: '进入工序的总电量', unit: 'MW·h' },
  { key: 'inputNonFossilGrid', name: '直供非化石能源电量', unit: 'MW·h' },
  { key: 'inputNonFossilSelf', name: '自发自用非化石能源电量', unit: 'MW·h' },
  { key: 'outputTotalElectricity', name: '输出工序的总电量', unit: 'MW·h' },
  { key: 'outputNonFossilGrid', name: '直供非化石能源电量', unit: 'MW·h' },
  { key: 'outputNonFossilSelf', name: '自发自用非化石能源电量', unit: 'MW·h' },
  { key: 'consumedElectricity', name: '工序消耗电量', unit: 'MW·h', isCalculated: true },
  { key: 'emission', name: '排放量', unit: 'tCO₂', isCalculated: true }
];

// 电力指标定义 - 方式2
const ELECTRICITY_INDICATORS_METHOD2 = [
  { key: 'totalConsumedElectricity', name: '工序总消耗电量', unit: 'MW·h' },
  { key: 'nonFossilGrid', name: '直供非化石能源电量', unit: 'MW·h' },
  { key: 'nonFossilSelf', name: '自发自用非化石能源电量', unit: 'MW·h' },
  { key: 'selfGeneratedElectricity', name: '工序自产发电量', unit: 'MW·h' },
  { key: 'netConsumedElectricity', name: '工序消耗电量', unit: 'MW·h', isCalculated: true },
  { key: 'emission', name: '排放量', unit: 'tCO₂', isCalculated: true }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = (calculationMethod) => {
  const indicators = calculationMethod === 1 ? ELECTRICITY_INDICATORS_METHOD1 : ELECTRICITY_INDICATORS_METHOD2;
  
  // 为每个指标创建包含12个月数据的对象
  return indicators.reduce((acc, indicator) => {
    acc[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: indicator.isCalculated ? 0 : '' // 计算字段初始化为0，输入字段初始化为空字符串
    }));
    return acc;
  }, {});
};

// 为工序初始化电力数据（纵向布局）
const initializeElectricityDataForProcess = (process, calculationMethod) => {
  return {
    ...process,
    calculationMethod,
    electricityData: createInitialIndicatorData(calculationMethod),
    files: process.files || {} // 初始化files对象用于存储支撑材料
  };
};

// 获取当前计算方式对应的指标列表
const getCurrentIndicators = (calculationMethod) => {
  return calculationMethod === 1 ? ELECTRICITY_INDICATORS_METHOD1 : ELECTRICITY_INDICATORS_METHOD2;
};

function SteelElectricityEmission({ onEmissionChange, productionLines = [], onProductionLinesChange }) {
  // 将productionLines重命名为processes以符合工序驱动的概念
  const processes = productionLines;
  
  // 格式化数值显示
  const formatValue = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    
    // 解析为浮点数
    const numValue = parseFloat(value);
    // 确保是有效数字后进行格式化
    return isNaN(numValue) ? '' : numValue.toFixed(decimals);
  };
  
  // 格式化电量（MW∙h），保留三位小数
  const formatElectricityValue = (value) => {
    return formatValue(value, 3);
  };
  
  // 格式化排放量（tCO₂），保留两位小数
  const formatEmissionValue = (value) => {
    return formatValue(value, 2);
  };
  
  // 计算方式：1=有工序进出电量计量，2=无工序进出电量计量
  const [calculationMethod, setCalculationMethod] = useState(1);
  
  // 电网排放因子
  const [gridEmissionFactor, setGridEmissionFactor] = useState(DEFAULT_GRID_EMISSION_FACTOR);
  
  // 保存上一次的排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 初始化工序的电力数据
  useEffect(() => {
    if (onProductionLinesChange) {
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          // 只有在需要修改时才创建新对象
          if (!process.electricityData) {
            hasChanges = true;
            return initializeElectricityDataForProcess(process, calculationMethod);
          }
          
          if (process.calculationMethod !== undefined && process.calculationMethod !== calculationMethod) {
            hasChanges = true;
            return initializeElectricityDataForProcess(process, calculationMethod);
          }
          
          // 检查是否需要更新计算方式或电力数据
          if (!process.hasOwnProperty('calculationMethod') || !process.electricityData) {
            hasChanges = true;
            return {
              ...process,
              calculationMethod,
              electricityData: process.electricityData || createInitialIndicatorData(calculationMethod)
            };
          }
          
          // 没有变化，直接返回原对象
          return process;
        });
        
        // 只有在有实际变化时才返回新数组
        return hasChanges ? updatedProcesses : prevProcesses;
      });
    }
  }, [calculationMethod, onProductionLinesChange]);
  
  // 辅助函数：更新流程中的指标值 - 使用useCallback避免不必要的重新创建
  const updateProcessIndicator = useCallback((process, indicatorKey, month, value, unit = 'MW·h') => {
    const currentElectricityData = process.electricityData || {};
    const currentIndicatorData = currentElectricityData[indicatorKey] || [];
    
    const updatedIndicatorData = [...currentIndicatorData];
    const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
    
    if (monthIndex !== -1) {
      // 只有值发生变化时才更新
      if (parseFloat(updatedIndicatorData[monthIndex].value) !== parseFloat(value)) {
        updatedIndicatorData[monthIndex] = {
          ...updatedIndicatorData[monthIndex],
          value
        };
        return {
          ...process,
          electricityData: {
            ...currentElectricityData,
            [indicatorKey]: updatedIndicatorData
          }
        };
      }
    } else {
      // 如果月份数据不存在，创建它
      updatedIndicatorData.push({
        month,
        monthName: MONTHS[month - 1],
        value,
        unit
      });
      return {
        ...process,
        electricityData: {
          ...currentElectricityData,
          [indicatorKey]: updatedIndicatorData
        }
      };
    }
    
    // 如果没有变化，返回原对象
    return process;
  }, []);
  
  // 更新工序的计算值 - 重构为单次状态更新
  const updateCalculatedValues = useCallback(() => {
    if (onProductionLinesChange) {
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          if (!process.electricityData) return process;
          
          let updatedProcess = { ...process, electricityData: { ...process.electricityData } };
          let processChanged = false;
          
          // 根据计算方式计算各月份的值
          MONTHS.forEach((_, monthIndex) => {
            const month = monthIndex + 1;
            let consumedElectricityValue = 0;
            let emissionValue = 0;
            
            if (process.calculationMethod === 1) {
              // 计算方式1的逻辑
              const inputTotalElectricity = parseFloat(process.electricityData.inputTotalElectricity?.find(m => m.month === month)?.value) || 0;
              const inputNonFossilGrid = parseFloat(process.electricityData.inputNonFossilGrid?.find(m => m.month === month)?.value) || 0;
              const inputNonFossilSelf = parseFloat(process.electricityData.inputNonFossilSelf?.find(m => m.month === month)?.value) || 0;
              const outputTotalElectricity = parseFloat(process.electricityData.outputTotalElectricity?.find(m => m.month === month)?.value) || 0;
              const outputNonFossilGrid = parseFloat(process.electricityData.outputNonFossilGrid?.find(m => m.month === month)?.value) || 0;
              const outputNonFossilSelf = parseFloat(process.electricityData.outputNonFossilSelf?.find(m => m.month === month)?.value) || 0;
              
              consumedElectricityValue = (inputTotalElectricity - inputNonFossilGrid - inputNonFossilSelf) - (outputTotalElectricity - outputNonFossilGrid - outputNonFossilSelf);
            } else {
              // 计算方式2的逻辑
              const totalConsumedElectricity = parseFloat(process.electricityData.totalConsumedElectricity?.find(m => m.month === month)?.value) || 0;
              const nonFossilGrid = parseFloat(process.electricityData.nonFossilGrid?.find(m => m.month === month)?.value) || 0;
              const nonFossilSelf = parseFloat(process.electricityData.nonFossilSelf?.find(m => m.month === month)?.value) || 0;
              const selfGeneratedElectricity = parseFloat(process.electricityData.selfGeneratedElectricity?.find(m => m.month === month)?.value) || 0;
              
              consumedElectricityValue = totalConsumedElectricity - nonFossilGrid - nonFossilSelf - selfGeneratedElectricity;
            }
            
            // 计算排放量
            emissionValue = Math.max(0, consumedElectricityValue) * gridEmissionFactor;
            
            // 更新净消耗电量
              const consumedKey = process.calculationMethod === 1 ? 'consumedElectricity' : 'netConsumedElectricity';
              const newProcessAfterConsumed = updateProcessIndicator(updatedProcess, consumedKey, month, consumedElectricityValue);
              
              // 更新排放量
              const newProcessAfterEmission = updateProcessIndicator(newProcessAfterConsumed, 'emission', month, emissionValue);
              
              // 只有当实际返回了新对象时才标记为已更改
              if (updatedProcess !== newProcessAfterEmission) {
                processChanged = true;
                updatedProcess = newProcessAfterEmission;
              }
          });
          
          if (processChanged) {
            hasChanges = true;
            return updatedProcess;
          }
          
          return process;
        });
        
        return hasChanges ? updatedProcesses : prevProcesses;
      });
    }
  }, [gridEmissionFactor, onProductionLinesChange, updateProcessIndicator]);
    
  // 当计算方式或排放因子变化时，更新计算值
  useEffect(() => {
    // 由于updateCalculatedValues现在使用函数式更新，不需要直接依赖processes
    updateCalculatedValues();
  }, [calculationMethod, gridEmissionFactor, updateCalculatedValues]);
  
  // 计算总排放量和工序详细排放数据
  const { totalEmission, processEmissions } = useMemo(() => {
    if (!Array.isArray(processes)) return { totalEmission: 0, processEmissions: {} };
    
    let total = 0;
    const emissionsByProcess = {};
    
    processes.forEach(process => {
      if (!process.electricityData || !process.electricityData.emission) return;
      
      // 初始化该工序的排放数据
      emissionsByProcess[process.id] = {
        monthlyData: [],
        yearlyTotal: 0
      };
      
      let processTotal = 0;
      
      // 遍历所有月份的排放量
      process.electricityData.emission.forEach((monthData, index) => {
        const emission = parseFloat(monthData.value) || 0;
        total += emission;
        processTotal += emission;
        
        // 存储月度数据
        emissionsByProcess[process.id].monthlyData[index] = emission;
      });
      
      // 存储工序全年总计
      emissionsByProcess[process.id].yearlyTotal = processTotal;
    });
    
    return { totalEmission: total, processEmissions: emissionsByProcess };
  }, [processes]);



  // 处理数据变化（新的纵向布局）
  const handleDataChange = useCallback((processId, indicatorKey, month, value) => {
    if (onProductionLinesChange) {
      // 使用函数式更新获取最新的processes
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          if (process.id === processId) {
            // 确保electricityData存在
            const currentElectricityData = process.electricityData || {};
            const currentIndicatorData = currentElectricityData[indicatorKey] || [];
            
            // 创建新数组以避免直接修改原数组
            const updatedIndicatorData = [...currentIndicatorData];
            const monthIndex = updatedIndicatorData.findIndex(m => m.month === month);
            
            if (monthIndex !== -1) {
              // 更新现有月份数据
              if (updatedIndicatorData[monthIndex].value !== value) {
                updatedIndicatorData[monthIndex] = {
                  ...updatedIndicatorData[monthIndex],
                  value
                };
                hasChanges = true;
              }
            } else {
              // 如果月份数据不存在，创建它
              hasChanges = true;
              // 获取指标定义以确定单位
              const indicators = process.calculationMethod === 1 ? ELECTRICITY_INDICATORS_METHOD1 : ELECTRICITY_INDICATORS_METHOD2;
              const indicatorDefinition = indicators.find(ind => ind.key === indicatorKey);
              
              updatedIndicatorData.push({
                month,
                monthName: MONTHS[month - 1],
                value,
                unit: indicatorDefinition?.unit || 'MW·h'
              });
            }
            
            // 只有在有变化时才创建新对象
            if (hasChanges) {
              const updatedProcess = {
                ...process,
                electricityData: {
                  ...currentElectricityData,
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
    
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      if (Array.isArray(processes)) {
        processes.forEach(process => {
          if (process.electricityData && process.electricityData['emission']) {
            // 获取该月的排放数据
            const emissionData = process.electricityData['emission'];
            const emissionValue = emissionData[month]?.value || '';
            
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
    if (!process.electricityData) return null;
    
    const indicators = process.calculationMethod === 1 ? ELECTRICITY_INDICATORS_METHOD1 : ELECTRICITY_INDICATORS_METHOD2;
    
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
            {process.electricityData[indicator.key] && process.electricityData[indicator.key].map((monthData, monthIndex) => (
              <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {indicator.isCalculated ? (
                  <div style={{ backgroundColor: '#fafafa' }}>
                    {typeof monthData.value === 'number' && indicator.unit === 'tCO₂' 
                      ? monthData.value.toFixed(2) 
                      : typeof monthData.value === 'number' 
                        ? monthData.value.toFixed(3) 
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
              {calculateAnnualTotal(process.electricityData[indicator.key])}
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
        {/* 电网排放因子行 */}
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>电网排放因子</td>
          <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>tCO₂/MW·h</td>
          {MONTHS.map((month, index) => (
            <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#fafafa' }}>{gridEmissionFactor.toFixed(4)}</div>
            </td>
          ))}
          <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
            {gridEmissionFactor.toFixed(4)}
          </td>
          <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>固定值</td>
          <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
            <input
              type="text"
              placeholder="数据来源"
              style={{ width: '100%', textAlign: 'center' }}
            />
          </td>
          <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}></td>
        </tr>
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
    return unit === 'tCO₂' ? total.toFixed(2) : total.toFixed(3);
  };

  // 移除了ensureThreeDecimals函数，因为现在使用onChange直接处理输入值
  
  return (
    <div className="electricity-emission">
      <h2>工序消耗电力排放</h2>
      
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>工序消耗电力排放计算说明：</strong></p>
        <p><strong>计算公式：</strong></p>
        <p>1. <strong>方式1（有工序进出电量计量）</strong>：</p>
        <p>   工序消耗电量(G) = (进入工序的总电量(A) - 进入工序的直供非化石能源电量(B) - 进入工序的自发自用非化石能源电量(C)) - (输出工序的总电量(D) - 输出工序的直供非化石能源电量(E) - 输出工序的自发自用非化石能源电量(F))</p>
        <p>   工序消耗电力排放量(I) = 工序消耗电量(G) × 电网排放因子(H)</p>
        <p>2. <strong>方式2（无工序进出电量计量）</strong>：</p>
        <p>   工序消耗电量(N) = 工序总消耗电量(J) - 直供非化石能源电量(K) - 自发自用非化石能源电量(L) - 工序自产发电量(M)</p>
        <p>   工序消耗电力排放量(P) = 工序消耗电量(N) × 电网排放因子(O)</p>
        <p><strong>单位说明：</strong></p>
        <p>- 电量单位：MW·h（兆瓦时），四舍五入保留到小数点后三位</p>
        <p>- 排放量单位：tCO₂（吨二氧化碳），四舍五入保留到小数点后两位</p>
        <p>- 电网排放因子单位：tCO₂/MW·h（吨二氧化碳/兆瓦时）</p>
      </div>
      
      {/* 计算方式选择 */}
      <div className="calculation-method-selector" style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>选择计算方式：</label>
        <select
          value={calculationMethod}
          onChange={(e) => setCalculationMethod(parseInt(e.target.value))}
          style={{ padding: '5px' }}
        >
          <option value={1}>方式1：有工序进出电量计量</option>
          <option value={2}>方式2：无工序进出电量计量</option>
        </select>
      </div>
      
      {/* 电网排放因子设置 */}
      <div className="grid-emission-factor" style={{ marginBottom: '20px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
        <label style={{ marginRight: '10px' }}>电网排放因子 (tCO₂/MW·h)：</label>
        <input
          type="number"
          step="0.0001"
          value={gridEmissionFactor}
          onChange={(e) => setGridEmissionFactor(parseFloat(e.target.value) || 0)}
          style={{ padding: '5px', width: '150px' }}
          // 确保排放因子保留四位小数
          onBlur={(e) => {
            const inputValue = e.target.value;
            if (inputValue) {
              const numValue = parseFloat(inputValue);
              if (!isNaN(numValue)) {
                setGridEmissionFactor(parseFloat(numValue.toFixed(4)));
              }
            }
          }}
        />
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
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>总排放量 (tCO₂)</td>
                {(() => {
                  // 调用计算函数获取月度和年度排放总量
                  const { monthlyTotals, yearlyTotal } = calculateMonthlyEmissionTotals();
                  
                  // 渲染各月数据和总计
                  return [
                    ...monthlyTotals.map((total, index) => (
                      <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                        {total.toFixed(3)}
                      </td>
                    )),
                    <td key="total" style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                      {yearlyTotal.toFixed(3)}
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
            <h3 style={{ margin: '10px 0' }}>{process.processTypeName || process.name || `工序 ${processIndex + 1}`}</h3>
          </div>
          
          {/* 使用新的纵向布局表格渲染函数 */}
          {renderVerticalLayoutTable(process)}
        </div>
      ))}
      
      {/* 计算说明 */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4 style={{ marginBottom: '10px' }}>计算说明</h4>
        {calculationMethod === 1 ? (
          <div>
            <p><strong>方式1：有工序进出电量的计量</strong></p>
            <p>1. 工序消耗电量 = (进入工序的总电量 - 进入工序的非化石能源电量) - (输出工序的总电量 - 输出工序的非化石能源电量)</p>
            <p>2. 工序消耗电力产生的排放量 = 工序消耗电量 × 电网排放因子</p>
            <p>3. 电量单位：MW∙h（保留三位小数）</p>
            <p>4. 排放量单位：tCO₂（保留两位小数）</p>
          </div>
        ) : (
          <div>
            <p><strong>方式2：无工序进出电量的计量</strong></p>
            <p>1. 工序消耗电量 = 工序总消耗电量 - 非化石能源电量 - 工序自产发电量</p>
            <p>2. 工序消耗电力产生的排放量 = 工序消耗电量 × 电网排放因子</p>
            <p>3. 电量单位：MW∙h（保留三位小数）</p>
            <p>4. 排放量单位：tCO₂（保留两位小数）</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SteelElectricityEmission;