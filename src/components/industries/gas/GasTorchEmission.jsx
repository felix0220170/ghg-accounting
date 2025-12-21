import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 石油天然气企业火炬燃烧排放相关常量

// 正常火炬燃烧排放计算指标
const NORMAL_TORCH_INDICATORS = [
  {
    key: 'torchGasFlowRate',
    name: '火炬气流量',
    unit: '104Nm³',
    isCalculated: false,
    decimalPlaces: 2,
    isFullYear: true
  },
  {
    key: 'carbonOxidationRate',
    name: '火炬燃烧的碳氧化率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 98
  },
  {
    key: 'totalCarbonContent',
    name: '除CO2外其他含碳化合物的总含碳量',
    unit: '吨碳/104Nm³',
    isCalculated: false,
    decimalPlaces: 4
  },
  {
    key: 'co2VolumeConcentration',
    name: 'CO2 的体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'co2Emission',
    name: 'CO2 排放量',
    unit: '吨CO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true,
    getValue: (monthData) => {
      const { torchGasFlowRate, carbonOxidationRate, totalCarbonContent, co2VolumeConcentration } = monthData;
      return torchGasFlowRate * (totalCarbonContent *  carbonOxidationRate/100 * 44 /12 + co2VolumeConcentration/100 * 19.7);
    }
  },
  {
    key: 'ch4VolumeConcentration',
    name: 'CH4 的体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'ch4Emission',
    name: 'CH4 排放量',
    unit: '吨CO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true,
    getValue: (monthData) => {
      const { torchGasFlowRate, carbonOxidationRate, ch4VolumeConcentration } = monthData;
      return torchGasFlowRate * ch4VolumeConcentration /100 * ( 1- carbonOxidationRate/100) * 7.17 * 21
    }
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true,
    getValue: (monthData) => {
      const { co2Emission, ch4Emission } = monthData;
      return co2Emission + ch4Emission;
    }
  }
];

const ACCIDENT_TORCH_INDICATORS = [
  {
    key: 'accidentTorchGasFlowRate',
    name: '事故状态时的火炬气流速度',
    unit: '104Nm3/小时',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'accidentDuration',
    name: '事故持续时间',
    unit: '小时',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'carbonOxidationRate',
    name: '火炬燃烧的碳氧化率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 98
  },
  {
    key: 'totalCarbonContent',
    name: '除CO2外其他含碳化合物的总含碳量',
    unit: '吨碳/104Nm³',
    isCalculated: false,
    decimalPlaces: 4
  },
  {
    key: 'co2VolumeConcentration',
    name: 'CO2 的体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'co2Emission',
    name: 'CO2 排放量',
    unit: '吨CO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true,
    getValue: (monthData) => {
      const { accidentTorchGasFlowRate, accidentDuration, carbonOxidationRate, totalCarbonContent, co2VolumeConcentration } = monthData;
      return accidentTorchGasFlowRate * accidentDuration * (totalCarbonContent *  carbonOxidationRate/100 * 44 /12 + co2VolumeConcentration/100 * 19.7);
    }
  },
  {
    key: 'ch4VolumeConcentration',
    name: 'CH4 的体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'ch4Emission',
    name: 'CH4 排放量',
    unit: '吨CO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true,
    getValue: (monthData) => {
      const { accidentTorchGasFlowRate, accidentDuration, carbonOxidationRate, ch4VolumeConcentration } = monthData;
      return accidentTorchGasFlowRate * accidentDuration * ch4VolumeConcentration /100 * ( 1- carbonOxidationRate/100) * 7.17 * 21
    }
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true,
    getValue: (monthData) => {
      const { co2Emission, ch4Emission } = monthData;
      return co2Emission + ch4Emission;
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
      value: indicator.isCalculated ? 0 : (indicator.defaultValue !== undefined ? indicator.defaultValue : ''),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 为石油天然气火炬燃烧初始化数据（纵向布局）
const initializeTorchData = (torch) => {
  // 根据火炬类型选择对应的指标列表
  const indicators = torch.torchType === 'normal' ? NORMAL_TORCH_INDICATORS : ACCIDENT_TORCH_INDICATORS;
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
    ...torch,
    data: initialData,
    files: {},
    indicators: indicators,
    isDefault: false // 不再有默认的火炬
  };
};

function GasTorchEmission({ onEmissionChange }) {
  // 火炬燃烧列表状态
  const [torchEmissions, setTorchEmissions] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 添加火炬时的表单状态
  const [newTorch, setNewTorch] = useState({
    torchType: 'normal', // 默认正常工况
    name: '' // 火炬名称
  });
  
  // 处理气体浓度变化
  const handleGasConcentrationChange = (gasId, value) => {
    setGasConcentrations(prev => ({
      ...prev,
      [gasId]: value
    }));
  };
  
  // 初始化默认数据
  useEffect(() => {
    const initializedTorches = [];
    setTorchEmissions(initializedTorches);
  }, []);
  
  // 添加新的火炬燃烧记录
  const addNewTorch = useCallback(() => {
    // 验证火炬名称
    if (!newTorch.name.trim()) {
      alert('请输入火炬名称');
      return;
    }
    
    const newTorchId = `torch-${Date.now()}`;
    
    // 创建新的火炬对象
    const newTorchData = {
      id: newTorchId,
      name: newTorch.name.trim(),
      torchType: newTorch.torchType
    };
    
    const initializedTorch = initializeTorchData(newTorchData);
    setTorchEmissions(prevTorches => [...prevTorches, initializedTorch]);
    
    // 重置表单
    setNewTorch({
      torchType: 'normal',
      name: ''
    });
  }, [newTorch]);
  
  // 移除火炬燃烧记录
  const removeTorch = useCallback((torchId) => {
    setTorchEmissions(prevTorches => {
      return prevTorches.filter(torch => torch.id !== torchId);
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
    // 处理石油天然气火炬燃烧数据计算
    setTorchEmissions(prevTorches => {
      let hasChanges = false;
      const updatedTorches = prevTorches.map(torch => {
        if (!torch.data || !torch.indicators) return torch;
        
        let updatedTorch = { ...torch, data: { ...torch.data } };
        let torchChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的所有输入值
          const monthData = {};
          torch.indicators.forEach(indicator => {
            const indicatorData = torch.data[indicator.key]?.find(m => m.month === month);
            monthData[indicator.key] = indicatorData ? parseFloat(indicatorData.value) || 0 : 0;
          });
          
          // 更新所有计算指标
          torch.indicators.forEach(indicator => {
            if (indicator.isCalculated) {
              // 使用指标定义中的getValue函数计算值
              const calculatedValue = indicator.getValue ? indicator.getValue(monthData) : 0;
              
              // 更新计算指标的数据
              const currentIndicatorData = updatedTorch.data[indicator.key] || [];
              const indicatorMonthIndex = currentIndicatorData.findIndex(m => m.month === month);
              const newIndicatorData = [...currentIndicatorData];
              
              if (indicatorMonthIndex !== -1) {
                // 只有当值真正改变时才更新
                if (parseFloat(newIndicatorData[indicatorMonthIndex].value) !== calculatedValue) {
                  newIndicatorData[indicatorMonthIndex] = {
                    ...newIndicatorData[indicatorMonthIndex],
                    value: calculatedValue
                  };
                  torchChanged = true;
                }
              } else if (calculatedValue > 0) {
                // 确保计算值大于0时才添加新数据
                newIndicatorData.push({
                  month,
                  monthName: MONTHS[monthIndex],
                  value: calculatedValue,
                  unit: indicator.unit
                });
                torchChanged = true;
              }
              
              // 应用更新
              updatedTorch = {
                ...updatedTorch,
                data: {
                  ...updatedTorch.data,
                  [indicator.key]: newIndicatorData
                }
              };
            }
          });
        }
        
        if (torchChanged) {
          hasChanges = true;
          return updatedTorch;
        }
        
        return torch;
      });
      
      return hasChanges ? updatedTorches : prevTorches;
    });
  }, [setTorchEmissions]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, torchEmissions]);

  // 处理技术选择变化
  const handleTechChange = useCallback((torchId, selectedTech) => {
    setTorchEmissions(prevTorches => {
      return prevTorches.map(torch => {
        if (torch.id === torchId) {
          return {
            ...torch,
            selectedTech
          };
        }
        return torch;
      });
    });
  }, [setTorchEmissions]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'torch-emission') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    setTorchEmissions(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          // 确保data存在
          const currentData = item.data || {};
          const currentIndicatorData = currentData[indicatorKey] || [];
          
          // 根据火炬类型获取指标定义
          const indicators = item.torchType === 'normal' ? NORMAL_TORCH_INDICATORS : ACCIDENT_TORCH_INDICATORS;
          
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
  }, [setTorchEmissions]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'torch-emission') => {
    if (!file) return;
    
    setTorchEmissions(prevItems => {
      let hasChanges = false;
      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          // 确保data存在
          const currentData = item.data || {};
          const currentIndicatorData = currentData[indicatorKey] || [];
          
          //  根据火炬类型获取指标定义
          const indicators = item.torchType === 'normal' ? NORMAL_TORCH_INDICATORS : ACCIDENT_TORCH_INDICATORS;
          
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
  }, [setTorchEmissions]);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    torchEmissions.forEach(torch => {
      if (torch.data && torch.data['emission']) {
        torch.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    return total;
  }, [torchEmissions]);
  
  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);
  
  // 渲染纵向布局的表格
  const renderVerticalLayoutTable = (item) => {
    if (!item.data) return null;
    
    // 根据火炬类型获取指标定义
    const indicators = item.torchType === 'normal' ? NORMAL_TORCH_INDICATORS : ACCIDENT_TORCH_INDICATORS;
    
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
          if (indicator.isFullYear) {
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
                  {indicator.isFullYear ? (
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
                        // 为所有月份设置相同的支撑材料
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
  
  // 计算各月排放量
  const calculateMonthlyEmissionTotals = () => {
    const totalEmissions = [];
    
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      
      // 计算各火炬排放量
      torchEmissions.forEach(torch => {
        if (torch.data && torch.data['emission']) {
          const emissionData = torch.data['emission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          monthTotal += parseFloat(emissionValue) || 0;
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
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>全年总计 (tCO₂)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>石油天然气企业火炬燃烧的排放总量</td>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>石油天然气企业火炬燃烧排放</h2>
      {/* 石油天然气火炬燃烧 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '16px' }}>计算说明</h3>
            <p>石油天然气企业火炬燃烧过程中，含碳气体燃烧生成CO₂和CH₄，排放量根据火炬类型和相关指标计算。</p>
            <p>火炬燃烧可分为正常工况和事故工况两种类型，根据不同工况选择相应的计算指标。</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>正常工况火炬计算公式：</h4>
            <p>1. CO₂排放量（吨CO₂） = 火炬气流量（10⁴Nm³） × [除CO₂外其他含碳化合物的总含碳量（吨碳/10⁴Nm³） × 碳氧化率（%） × 44/12 + CO₂体积浓度（%） × 19.7]</p>
            <p>2. CH₄排放量（吨CO₂） = 火炬气流量（10⁴Nm³） × CH₄体积浓度（%） × (1 - 碳氧化率（%）) × 7.17 × 21</p>
            <p>3. 总排放量（吨CO₂） = CO₂排放量 + CH₄排放量</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>事故工况火炬计算公式：</h4>
            <p>1. CO₂排放量（吨CO₂） = 事故状态时的火炬气流速度（10⁴Nm³/小时） × 事故持续时间（小时） × [除CO₂外其他含碳化合物的总含碳量（吨碳/10⁴Nm³） × 碳氧化率（%） × 44/12 + CO₂体积浓度（%） × 19.7]</p>
            <p>2. CH₄排放量（吨CO₂） = 事故状态时的火炬气流速度（10⁴Nm³/小时） × 事故持续时间（小时） × CH₄体积浓度（%） × (1 - 碳氧化率（%）) × 7.17 × 21</p>
            <p>3. 总排放量（吨CO₂） = CO₂排放量 + CH₄排放量</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>系数说明：</h4>
            <p>1. 19.7：CO₂体积浓度转换系数，用于将CO₂体积浓度（%）转换为吨CO₂/10⁴Nm³</p>
            <p>2. 7.17：CH₄密度转换系数，用于将CH₄体积浓度（%）转换为吨CH₄/10⁴Nm³</p>
            <p>3. 21：CH₄的全球变暖潜势(GWP)值（100年时间尺度），用于将CH₄排放量转换为CO₂当量</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加火炬燃烧生产排放记录</h3>
            
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>工况类型</label>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                                type="radio"
                                id="normal-torch"
                                value="normal"
                                checked={newTorch.torchType === 'normal'}
                                onChange={(e) => setNewTorch(prev => ({ ...prev, torchType: e.target.value }))}
                            />
                            <label htmlFor="normal-torch" style={{ cursor: 'pointer', fontSize: '14px' }}>正常工况火炬</label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                                type="radio"
                                id="accident-torch"
                                value="accident"
                                checked={newTorch.torchType === 'accident'}
                                onChange={(e) => setNewTorch(prev => ({ ...prev, torchType: e.target.value }))}
                            />
                            <label htmlFor="accident-torch" style={{ cursor: 'pointer', fontSize: '14px' }}>事故工况火炬</label>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>火炬名称</label>
                    <input
                        type="text"
                        placeholder="请为火炬命名（如：原油稳定装置火炬）"
                        value={newTorch.name}
                        onChange={(e) => setNewTorch(prev => ({ ...prev, name: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                    />
                </div>
            </div>
            
            <button
                onClick={addNewTorch}
                disabled={!newTorch.torchType || !newTorch.name.trim()}
                style={{
                    padding: '10px 24px',
                    backgroundColor: !newTorch.torchType || !newTorch.name.trim() ? '#ccc' : '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !newTorch.torchType || !newTorch.name.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                    boxShadow: !newTorch.torchType || !newTorch.name.trim() ? 'none' : '0 2px 4px rgba(24, 144, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                    if (newTorch.torchType && newTorch.name.trim()) {
                        e.currentTarget.style.backgroundColor = '#40a9ff';
                    }
                }}
                onMouseLeave={(e) => {
                    if (newTorch.torchType && newTorch.name.trim()) {
                        e.currentTarget.style.backgroundColor = '#1890ff';
                    }
                }}
            >
                添加火炬排放记录
            </button>
        </div>

        <div>
          {/* 使用useMemo对火炬进行排序，将正常火炬放在前面，事故火炬放在后面 */}
          {(() => {
            // 排序火炬数组
            const sortedTorches = [...torchEmissions].sort((a, b) => {
              // 正常火炬排在前面，事故火炬排在后面
              if (a.torchType === 'normal' && b.torchType === 'accident') return -1;
              if (a.torchType === 'accident' && b.torchType === 'normal') return 1;
              return 0;
            });
            
            // 找到第一个事故火炬的索引
            const firstAccidentIndex = sortedTorches.findIndex(torch => torch.torchType === 'accident');
            
            // 渲染正常火炬
            const normalTorches = sortedTorches.slice(0, firstAccidentIndex === -1 ? sortedTorches.length : firstAccidentIndex);
            
            // 渲染事故火炬
            const accidentTorches = firstAccidentIndex === -1 ? [] : sortedTorches.slice(firstAccidentIndex);
            
            return (
              <>
                {/* 正常火炬部分 */}
                {normalTorches.map((torch) => (
                  <div key={torch.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>{torch.name}</h3>
                        <span style={{ fontSize: '14px', color: '#666', padding: '2px 8px', backgroundColor: torch.torchType === 'normal' ? '#e6f7ff' : '#fff7e6', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                          {torch.torchType === 'normal' ? '正常工况' : '事故工况'}
                        </span>
                      </div>
                      {!torch.isDefault && (
                        <button
                          onClick={() => removeTorch(torch.id)}
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
                    
                    {renderVerticalLayoutTable(torch)}
                  </div>
                ))}
                
                {/* 如果同时有正常和事故火炬，添加分隔线 */}
                {normalTorches.length > 0 && accidentTorches.length > 0 && (
                  <div style={{ 
                    height: '1px', 
                    backgroundColor: '#e8e8e8', 
                    margin: '40px 0', 
                    position: 'relative' 
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '50%', 
                      top: '-10px', 
                      backgroundColor: '#fff', 
                      padding: '0 10px', 
                      fontSize: '14px', 
                      color: '#999',
                      transform: 'translateX(-50%)' 
                    }}>
                      分隔线
                    </div>
                  </div>
                )}
                
                {/* 事故火炬部分 */}
                {accidentTorches.map((torch) => (
                  <div key={torch.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>{torch.name}</h3>
                        <span style={{ fontSize: '14px', color: '#666', padding: '2px 8px', backgroundColor: torch.torchType === 'normal' ? '#e6f7ff' : '#fff7e6', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                          {torch.torchType === 'normal' ? '正常工况' : '事故工况'}
                        </span>
                      </div>
                      {!torch.isDefault && (
                        <button
                          onClick={() => removeTorch(torch.id)}
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
                    
                    {renderVerticalLayoutTable(torch)}
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default GasTorchEmission;
