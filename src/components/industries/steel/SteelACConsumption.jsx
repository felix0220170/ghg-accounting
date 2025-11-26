import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 交流电耗相关配置
const DEFAULT_AC_CONSUMPTION = 0; // 默认交流电耗值

// 交流电耗排放计算指标
const AC_CONSUMPTION_INDICATORS = [
  {
    key: 'acConsumption',
    name: '消耗电量 ',
    unit: 'MW·h',
    isCalculated: false,
    precision: 2, // 四舍五入保留到小数点后两位
    description: '用户输入值，表示工序消耗电量'
  },
  {
    key: 'heatConsumption',
    name: '消耗热量  ',
    unit: 'GJ',
    isCalculated: false,
    precision: 2, // 四舍五入保留到小数点后两位
    description: '用户输入值，表示工序地'
  }
];

// 创建初始的指标数据
const createInitialIndicatorData = (indicator) => {
  return MONTHS.map((month, index) => ({
    month: index + 1,
    monthName: month,
    value: indicator.defaultValue !== undefined ? indicator.defaultValue : DEFAULT_AC_CONSUMPTION,
    unit: indicator.unit,
  }));
};

// 为工序初始化交流电耗数据
const initializeACConsumptionDataForProcess = (process) => {
  const acConsumptionData = {};
  
  AC_CONSUMPTION_INDICATORS.forEach(indicator => {
    acConsumptionData[indicator.key] = createInitialIndicatorData(indicator);
  });
  
  return {
    ...process,
    acConsumptionData,
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

function AluminumACConsumption({ onEmissionChange, productionLines = [], onProductionLinesChange }) {
  // 将productionLines重命名为processes以符合工序驱动的概念
  const processes = productionLines;
  
  // 格式化数值显示，根据指标类型使用不同的小数位数
  const formatValue = (value, indicatorKey = '') => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    
    // 解析为浮点数
    const numValue = parseFloat(value);
    // 确保是有效数字
    if (isNaN(numValue)) return '';
    
    // 交流电耗使用两位小数
    if (indicatorKey === 'acConsumption') {
      return numValue.toFixed(2);
    }
    
    // 其他指标使用默认两位小数
    return numValue.toFixed(2);
  };
  
  // 初始化工序的交流电耗数据 - 仅在组件首次挂载时执行一次，避免无限循环
  useEffect(() => {
    if (onProductionLinesChange) {
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          // 只有在需要修改时才创建新对象
          if (!process.acConsumptionData) {
            hasChanges = true;
            return initializeACConsumptionDataForProcess(process);
          }
          
          // 没有变化，直接返回原对象
          return process;
        });
        
        // 只有在有实际变化时才返回新数组
        return hasChanges ? updatedProcesses : prevProcesses;
      });
    }
  }, []); // 空依赖数组，确保只在组件挂载时执行一次
  
  // 处理数据变化
  const handleDataChange = useCallback((processId, indicatorKey, month, value) => {
    if (onProductionLinesChange) {
      // 获取指标定义以确定单位和精度
      const indicatorDefinition = AC_CONSUMPTION_INDICATORS.find(ind => ind.key === indicatorKey);
      
      // 不进行格式化，直接使用用户输入值，仅在展示时格式化
      let formattedValue = value;
      
      // 使用函数式更新获取最新的processes
      onProductionLinesChange(prevProcesses => {
        if (!Array.isArray(prevProcesses)) return prevProcesses;
        
        let hasChanges = false;
        const updatedProcesses = prevProcesses.map(process => {
          if (process.id === processId) {
            // 确保acConsumptionData存在
            const currentACConsumptionData = process.acConsumptionData || {};
            const currentIndicatorData = currentACConsumptionData[indicatorKey] || [];
            
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
                acConsumptionData: {
                  ...currentACConsumptionData,
                  [indicatorKey]: updatedIndicatorData
                }
              };
              
              return updatedProcess;
            }
          }
          return process;
        });
        
        return hasChanges ? updatedProcesses : prevProcesses;
      });
    }
  }, [onProductionLinesChange]);
  
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

  // 计算各月交流电耗总量的函数
  const calculateMonthlyConsumptionTotals = useCallback(() => {
    const monthlyTotals = [];
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const month = monthIndex + 1; // 将索引转换为月份（1-12）
      let monthTotal = 0;
      if (Array.isArray(processes)) {
        processes.forEach(process => {
          if (process.acConsumptionData && process.acConsumptionData['acConsumption']) {
            // 获取该月的交流电耗数据
            const consumptionData = process.acConsumptionData['acConsumption'];
            const monthData = consumptionData.find(m => m.month === month);
            const consumptionValue = monthData ? parseFloat(monthData.value) || 0 : 0;
            monthTotal += consumptionValue;
          }
        });
      }
      monthlyTotals.push(monthTotal);
    }
    
    return monthlyTotals;
  }, [processes]);

  // 计算总交流电耗和工序详细数据
  const { totalConsumption, processConsumptions } = useMemo(() => {
    if (!Array.isArray(processes)) return { totalConsumption: 0, processConsumptions: {} };
    
    let total = 0;
    const consumptionsByProcess = {};
    
    processes.forEach(process => {
      if (!process.acConsumptionData || !process.acConsumptionData.acConsumption) return;
      
      // 初始化该工序的交流电耗数据
      consumptionsByProcess[process.id] = {
        monthlyData: [],
        yearlyTotal: 0
      };
      
      let processTotal = 0;
      
      // 遍历所有月份的交流电耗量
      for (let i = 0; i < 12; i++) {
        const monthData = process.acConsumptionData.acConsumption.find(m => m.month === i + 1);
        const consumption = monthData ? parseFloat(monthData.value) || 0 : 0;
        total += consumption;
        processTotal += consumption;
        
        // 存储月度数据
        consumptionsByProcess[process.id].monthlyData[i] = consumption;
      }
      
      // 存储工序全年总计
      consumptionsByProcess[process.id].yearlyTotal = processTotal;
    });
    
    return { totalConsumption: total, processConsumptions: consumptionsByProcess };
  }, [processes]);

  // 渲染工序表格的函数
  const renderProcessTable = (process) => {
    // 检查process和相关数据是否存在
    if (!process || !process.acConsumptionData) {
      return null;
    }

    // 计算工序的全年总交流电耗
    const calculateYearlyTotal = (indicatorKey) => {
      const indicatorData = process.acConsumptionData[indicatorKey] || [];
      return indicatorData.reduce((total, monthData) => {
        return total + (parseFloat(monthData.value) || 0);
      }, 0);
    };

    return AC_CONSUMPTION_INDICATORS.map(indicator => (
      <tr key={`${process.id}-${indicator.key}`}>
        {/* 指标名称列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{indicator.name}</td>
        
        {/* 单位列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{indicator.unit}</td>
        
        {/* 12个月份列 */}
        {MONTHS.map((month, monthIndex) => {
          const monthNum = monthIndex + 1;
          const monthData = process.acConsumptionData[indicator.key]?.find(m => m.month === monthNum);
          const currentValue = monthData?.value || 0;
          
          return (
            <td key={`${process.id}-${indicator.key}-${monthNum}`} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              <input
                      type="number"
                      step="0.001"
                      value={currentValue || ''}
                      style={{ width: '100%', textAlign: 'center' }}
                      onChange={(e) => {
                        // 直接传递输入值，不进行任何格式化处理
                        handleDataChange(process.id, indicator.key, monthNum, e.target.value);
                      }}
                    />
            </td>
          );
        })}
        
        {/* 全年值列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
          {formatValue(calculateYearlyTotal(indicator.key), indicator.key)}
        </td>
        
        {/* 获取方式列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
          {indicator.isCalculated ? '计算' : '填写'}
        </td>
        
        {/* 数据来源列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="数据来源"
            style={{
              width: '100%',
              padding: '2px 4px',
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              fontSize: '12px'
            }}
          />
        </td>
        
        {/* 支撑材料列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                updateFile(process.id, indicator.key, e.target.files[0]);
                e.target.value = ''; // 重置input以允许再次选择同一文件
              }
            }}
            style={{ fontSize: '12px' }}
          />
          {process.files && process.files[indicator.key] && (
            <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
              {process.files[indicator.key].name}
            </div>
          )}
        </td>
      </tr>
    ));
  };

  // 渲染纵向布局表格
  const renderVerticalLayoutTable = () => {
    // 检查processes是否存在且为数组
    if (!Array.isArray(processes) || processes.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无工序数据</div>;
    }

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

    return (
      <div style={{ overflowX: 'auto' }}>
        {processes.map((process, processIndex) => (
          <div key={process.id} className="process-section" style={{ marginBottom: '30px', padding: '20px', border: '2px solid #2196F3', borderRadius: '8px', backgroundColor: '#f0f8ff' }}>
            <div className="process-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: '10px 0' }}>{process.processTypeName || process.name || `工序 ${processIndex + 1}`}</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              {tableHeaders}
              <tbody>
                {renderProcessTable(process)}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>辅助参数报告项 1：工序电力热力</h2>
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>单位为 MW∙h，四舍五入保留到小数点后三位</strong></p>
      </div>
      
      {/* 月度电耗总量表格 */}
        <div className="calculation-section" style={{ marginTop: '20px' }}>
          <h3 className="section-title">月度电耗总量汇总表</h3>
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
                {/* 为每个指标单独显示汇总行 */}
                {AC_CONSUMPTION_INDICATORS.map((indicator) => (
                  <tr key={indicator.key}>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {indicator.name}总量 ({indicator.unit})
                    </td>
                    {(() => {
                      // 计算特定指标的月度和年度总量
                      const calculateMonthlyIndicatorTotals = () => {
                        const monthlyTotals = Array(12).fill(0);
                         
                        processes.forEach(process => {
                          if (!process.acConsumptionData) return;
                          
                          const monthData = process.acConsumptionData[indicator.key] || [];
                          monthData.forEach(m => {
                            if (m.month >= 1 && m.month <= 12) {
                              monthlyTotals[m.month - 1] += parseFloat(m.value) || 0;
                            }
                          });
                        });
                         
                        const yearlyTotal = monthlyTotals.reduce((sum, total) => sum + total, 0);
                        return { monthlyTotals, yearlyTotal };
                      };
                      
                      // 调用计算函数获取特定指标的月度和年度总量
                      const { monthlyTotals, yearlyTotal } = calculateMonthlyIndicatorTotals();
                      
                      // 渲染各月数据和总计
                      return [
                        ...monthlyTotals.map((total, index) => (
                          <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                            {total.toFixed(indicator.precision || 2)}
                          </td>
                        )),
                        <td key="total" style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                          {yearlyTotal.toFixed(indicator.precision || 2)}
                        </td>
                      ];
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


      {/* 纵向布局表格 */}
      {renderVerticalLayoutTable()}

      {/* 删除底部汇总数据部分 */}
    </div>
  );
};

export default AluminumACConsumption;