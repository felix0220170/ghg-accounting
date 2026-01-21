import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 定义行业类型
const INDUSTRIES = {
  FOOD_MANUFACTURING: 'FOOD_MANUFACTURING',
  TOBACCO_MANUFACTURING: 'TOBACCO_MANUFACTURING',
  BEVERAGE_MANUFACTURING: 'BEVERAGE_MANUFACTURING'
};

// 定义各行业的MCF推荐值和范围
const MCF_RECOMMENDATIONS = {
  [INDUSTRIES.FOOD_MANUFACTURING]: {
    name: '食品制造业（包括酒业生产）',
    recommended: 0.7,
    range: '0.6-0.8'
  },
  [INDUSTRIES.TOBACCO_MANUFACTURING]: {
    name: '烟草制造业',
    recommended: 0.3,
    range: '0.2-0.4'
  },
  [INDUSTRIES.BEVERAGE_MANUFACTURING]: {
    name: '酒、饮料和精制茶制造业',
    recommended: 0.5,
    range: '0.4-0.6'
  }
};

// 废水处理相关常量
const METHANE_PRODUCTION_CAPACITY = 0.25; // 甲烷最大生产能力 (千克 CH4/千克 COD)
const DEFAULT_MCF = 0.8; // 默认甲烷修正因子
const GWP_CH4 = 21; // 甲烷的全球变暖潜势 (GWP)
const DEFAULT_INDUSTRY = INDUSTRIES.FOOD_MANUFACTURING; // 默认行业

// 废水厌氧处理排放计算指标
const WASTEWATER_INDICATORS = [
  {
    key: 'wastewaterVolume',
    name: '厌氧处理的工业废水量',
    unit: 'm³',
    isCalculated: false,
    decimalPlaces: 1
  },
  {
    key: 'inletCOD',
    name: '进水 COD 浓度',
    unit: 'kg COD/m³',
    isCalculated: false,
    decimalPlaces: 3
  },
  {
    key: 'outletCOD',
    name: '出水 COD 浓度',
    unit: 'kg COD/m³',
    isCalculated: false,
    decimalPlaces: 3
  },
  {
    key: 'removedCOD',
    name: '厌氧处理系统去除的 COD 量',
    unit: '千克 COD',
    isCalculated: false,
    decimalPlaces: 1
  },
  {
    key: 'sludgeCOD',
    name: '以污泥方式清除掉的 COD 量',
    unit: '千克 COD',
    isCalculated: false,
    decimalPlaces: 1
  },
  {
    key: 'methaneProductionCapacity',
    name: '甲烷最大生产能力',
    unit: '千克 CH4/千克 COD',
    isCalculated: false,
    decimalPlaces: 2,
    defaultValue: METHANE_PRODUCTION_CAPACITY
  },
  {
    key: 'mcf',
    name: '甲烷修正因子 (MCF)',
    unit: '',
    isCalculated: false,
    decimalPlaces: 2,
    defaultValue: DEFAULT_MCF
  },
  {
    key: 'ch4Emission',
    name: 'CH4 排放量',
    unit: '千克 CH4',
    isCalculated: true,
    decimalPlaces: 4
  },
  {
    key: 'emission',
    name: 'CO₂ 排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2
  }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = (industry = DEFAULT_INDUSTRY) => {
  const indicators = WASTEWATER_INDICATORS;
  
  // 为每个指标创建包含12个月数据的对象
  return indicators.reduce((acc, indicator) => {
    let defaultValue = indicator.defaultValue;
    
    // 根据行业调整MCF的默认值
    if (indicator.key === 'mcf' && MCF_RECOMMENDATIONS[industry]) {
      defaultValue = MCF_RECOMMENDATIONS[industry].recommended;
    }
    
    acc[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: defaultValue || (indicator.isCalculated ? 0 : ''),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 为废水处理初始化数据（纵向布局）
const initializeWastewaterRecordData = (industry = DEFAULT_INDUSTRY) => {
  const initialData = createInitialIndicatorData(industry);
  
  // 为所有指标添加额外字段（数据来源、支撑材料）
  Object.keys(initialData).forEach(key => {
    initialData[key] = initialData[key].map(item => ({
      ...item,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  return {
    id: `wastewater-record-${Date.now()}`,
    name: '废水厌氧处理',
    data: initialData,
    files: {},
    isDefault: true
  };
};

function FoodWastewaterTreatmentEmission({ onEmissionChange, title='' }) {
  // 废水处理记录状态
  const [wastewaterRecords, setWastewaterRecords] = useState([]);

  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);

  // 行业选择状态
  const [selectedIndustry, setSelectedIndustry] = useState(DEFAULT_INDUSTRY);

  // 处理行业选择变化
  const handleIndustryChange = (e) => {
    const industry = e.target.value;
    setSelectedIndustry(industry);
  };
  
  // 初始化默认数据
  useEffect(() => {
    const initializedRecord = initializeWastewaterRecordData(selectedIndustry);
    setWastewaterRecords([initializedRecord]);
  }, [selectedIndustry]);
  
  // 添加新的废水处理记录
  const addNewWastewaterRecord = useCallback(() => {
    const newRecord = initializeWastewaterRecordData(selectedIndustry);
    setWastewaterRecords(prevRecords => [...prevRecords, newRecord]);
  }, [selectedIndustry]);
  
  // 移除废水处理记录
  const removeWastewaterRecord = useCallback((recordId) => {
    setWastewaterRecords(prevRecords => {
      const recordToRemove = prevRecords.find(record => record.id === recordId);
      // 只允许移除非默认记录
      if (recordToRemove) {
        return prevRecords.filter(record => record.id !== recordId);
      }
      return prevRecords;
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
    // 处理废水处理数据计算
    setWastewaterRecords(prevRecords => {
      let hasChanges = false;
      const updatedRecords = prevRecords.map(record => {
        if (!record.data) return record;
        
        let updatedRecord = { ...record, data: { ...record.data } };
        let recordChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的废水处理数据
          const wastewaterVolumeData = record.data.wastewaterVolume?.find(m => m.month === month);
          const wastewaterVolume = wastewaterVolumeData?.value ? parseFloat(wastewaterVolumeData.value) : 0;
          
          const inletCODData = record.data.inletCOD?.find(m => m.month === month);
          const inletCOD = inletCODData?.value ? parseFloat(inletCODData.value) : 0;
          
          const outletCODData = record.data.outletCOD?.find(m => m.month === month);
          const outletCOD = outletCODData?.value ? parseFloat(outletCODData.value) : 0;
          
          const removedCODData = record.data.removedCOD?.find(m => m.month === month);
          const removedCOD = removedCODData?.value ? parseFloat(removedCODData.value) : 0;
          
          const sludgeCODData = record.data.sludgeCOD?.find(m => m.month === month);
          const sludgeCOD = sludgeCODData?.value ? parseFloat(sludgeCODData.value) : 0;
          
          const methaneProductionCapacityData = record.data.methaneProductionCapacity?.find(m => m.month === month);
          const methaneProductionCapacity = methaneProductionCapacityData?.value ? parseFloat(methaneProductionCapacityData.value) : METHANE_PRODUCTION_CAPACITY;
          
          const mcfData = record.data.mcf?.find(m => m.month === month);
          const mcf = mcfData?.value ? parseFloat(mcfData.value) : DEFAULT_MCF;
          
          // 计算实际去除的COD量（如果没有直接提供的话）
          let actualRemovedCOD = removedCOD;
          if (!actualRemovedCOD && wastewaterVolume && inletCOD && outletCOD) {
            actualRemovedCOD = wastewaterVolume * (inletCOD - outletCOD);
          }
          
          // 计算甲烷排放量
          const emissionValue = Math.max(0, actualRemovedCOD - sludgeCOD) * methaneProductionCapacity * mcf;
          
          // 计算二氧化碳排放量 (tCO₂)
          const co2EmissionValue = emissionValue * GWP_CH4 / 1000;
          
          // 更新甲烷排放量数据
          const currentCh4EmissionData = updatedRecord.data.ch4Emission || [];
          const ch4EmissionMonthIndex = currentCh4EmissionData.findIndex(m => m.month === month);
          const newCh4EmissionData = [...currentCh4EmissionData];
          
          if (ch4EmissionMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newCh4EmissionData[ch4EmissionMonthIndex].value) !== emissionValue) {
              newCh4EmissionData[ch4EmissionMonthIndex] = {
                ...newCh4EmissionData[ch4EmissionMonthIndex],
                value: emissionValue,
                unit: '千克 CH4'
              };
              recordChanged = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newCh4EmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: '千克 CH4'
            });
            recordChanged = true;
          }
          
          // 更新二氧化碳排放量数据
          const currentEmissionData = updatedRecord.data.emission || [];
          const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
          const newEmissionData = [...currentEmissionData];
          
          if (emissionMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            if (parseFloat(newEmissionData[emissionMonthIndex].value) !== co2EmissionValue) {
              newEmissionData[emissionMonthIndex] = {
                ...newEmissionData[emissionMonthIndex],
                value: co2EmissionValue,
                unit: 'tCO₂'
              };
              recordChanged = true;
            }
          } else if (co2EmissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: co2EmissionValue,
              unit: 'tCO₂'
            });
            recordChanged = true;
          }
          
          // 应用更新
          updatedRecord = {
            ...updatedRecord,
            data: {
              ...updatedRecord.data,
              ch4Emission: newCh4EmissionData,
              emission: newEmissionData
            }
          };
        }
        
        if (recordChanged) {
          hasChanges = true;
          return updatedRecord;
        }
        
        return record;
      });
      
      return hasChanges ? updatedRecords : prevRecords;
    });
  }, [setWastewaterRecords]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, wastewaterRecords]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value) => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 使用废水处理相关设置
    const setState = setWastewaterRecords;
    const indicators = WASTEWATER_INDICATORS;
    
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
  }, [setWastewaterRecords]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file) => {
    if (!file) return;
    
    const setState = setWastewaterRecords;
    
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
            const indicatorDefinition = WASTEWATER_INDICATORS.find(ind => ind.key === indicatorKey);
            
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
  }, [setWastewaterRecords]);
  
  // 提示信息状态管理
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  
  // 处理鼠标悬停事件
  const handleTooltipHover = (indicatorKey) => {
    setHoveredTooltip(indicatorKey);
  };
  
  // 处理鼠标离开事件
  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    wastewaterRecords.forEach(record => {
      if (record.data && record.data['emission']) {
        record.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    return total;
  }, [wastewaterRecords]);
  
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
    
    const indicators = WASTEWATER_INDICATORS;
    
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
          // 进水COD、出水COD、甲烷最大生产能力和甲烷修正因子不显示全年值
          if (indicator.key === 'inletCOD' || indicator.key === 'outletCOD' || indicator.key === 'methaneProductionCapacity' || indicator.key === 'mcf') {
            yearlyValue = 0;
          } else if (indicator.isCalculated) {
            yearlyValue = indicatorData.reduce((sum, monthData) => {
              const value = parseFloat(monthData.value) || 0;
              return sum + value;
            }, 0);
          }
          
          return (
              <tr key={indicator.key}>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', position: 'relative' }}>
                  {indicator.name}
                  {indicator.key === 'removedCOD' && (
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                      <span 
                        style={{ display: 'inline-block', marginLeft: '8px', fontSize: '12px', color: '#1890ff', cursor: 'help' }}
                        onMouseEnter={() => setHoveredTooltip('removedCOD')}
                        onMouseLeave={() => setHoveredTooltip(null)}
                      >
                        ℹ️
                      </span>
                      {hoveredTooltip === 'removedCOD' && (
                        <div style={{ display: 'block', position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', zIndex: 10, width: '300px', whiteSpace: 'normal' }}>
                          提示：
                          <br />1. 若已填写废水量、进水COD和出水COD，系统会自动计算
                          <br />2. 也可直接输入该值覆盖自动计算结果
                        </div>
                      )}
                    </div>
                  )}
                </td>
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
                  {indicator.key === 'inletCOD' || indicator.key === 'outletCOD' || indicator.key === 'methaneProductionCapacity' || indicator.key === 'mcf' ? (
                    '-' // 进水COD、出水COD、甲烷最大生产能力和甲烷修正因子不显示全年值
                  ) : indicator.isCalculated ? (
                    formatValue(yearlyValue, indicator.decimalPlaces)
                  ) : (
                    '-' // 其他非计算值不显示全年值
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
    const totalCo2Emissions = [];
    
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      let monthCo2Total = 0;
      
      // 计算各废水处理记录的排放量
      wastewaterRecords.forEach(record => {
        if (record.data) {
          // 计算甲烷排放量
          if (record.data['ch4Emission']) {
            const ch4EmissionData = record.data['ch4Emission'];
            const monthData = ch4EmissionData.find(d => d.month === month + 1);
            const emissionValue = monthData?.value || 0;
            monthTotal += parseFloat(emissionValue) || 0;
          }
          
          // 计算二氧化碳排放量
          if (record.data['emission']) {
            const emissionData = record.data['emission'];
            const monthCo2Data = emissionData.find(d => d.month === month + 1);
            const co2EmissionValue = monthCo2Data?.value || 0;
            monthCo2Total += parseFloat(co2EmissionValue) || 0;
          }
        }
      });
      
      totalEmissions.push(monthTotal);
      totalCo2Emissions.push(monthCo2Total);
    }
    
    return { totalEmissions, totalCo2Emissions };
  };
  
  // 渲染总排放量统计表格
  const renderTotalEmissionTable = () => {
    const { totalEmissions, totalCo2Emissions } = calculateMonthlyEmissionTotals();
    
    // 计算全年总计
    const totalYear = totalEmissions.reduce((sum, value) => sum + value, 0);
    const totalCo2Year = totalCo2Emissions.reduce((sum, value) => sum + value, 0);
    
    return (
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '24px', backgroundColor: '#f9f9f9' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>指标</th>
            {MONTHS.map((month, index) => (
              <th key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>{month}</th>
            ))}
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>全年总计</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>废水厌氧处理CH4排放总量 (千克 CH4)</td>
            {totalEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 4)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {formatValue(totalYear, 4)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>废水厌氧处理CO₂排放总量 (tCO₂)</td>
            {totalCo2Emissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {formatValue(totalCo2Year, 2)}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>废水厌氧处理排放</h2>

      {/* 废水处理 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            {title && (
              <Fragment>
                <h3 style={{ marginBottom: '12px' }}>排放说明</h3> <p style={{ marginBottom: '12px' }}>{title}</p>
                </Fragment>)
            }

            <h3 style={{ marginBottom: '12px' }}>计算说明</h3>
            <p>废水厌氧处理CH4排放计算方法：</p>
            <p>CH4 排放量（千克 CH4） = (厌氧处理系统去除的 COD 量 - 以污泥方式清除掉的 COD 量) × 甲烷最大生产能力 × 甲烷修正因子 (MCF)</p>
            <p>CO₂ 排放量（tCO₂） = CH4 排放量（千克 CH4） × 甲烷的全球变暖潜势 (GWP) / 1000</p>
            <p>其中：</p>
            <p>- 厌氧处理系统去除的 COD 量可以通过以下两种方式获取：</p>
            <p>  1. 自动计算：厌氧处理的工业废水量 × (进水 COD 浓度 - 出水 COD 浓度)</p>
            <p>  2. 直接输入：用户可以根据实际情况直接输入去除的 COD 量</p>
            <p>- 厌氧处理的工业废水量单位为 m³/年，保留一位小数</p>
            <p>- 进水/出水 COD 浓度单位为 kg COD/m³，保留三位小数</p>
            <p>- 去除的 COD 量/污泥 COD 量单位为 千克 COD，保留一位小数</p>
            <p>- 甲烷最大生产能力单位为 千克 CH4/千克 COD，保留两位小数，默认值为 0.25</p>
            <p>- 甲烷修正因子 (MCF) 无单位，保留两位小数，默认值为 0.8</p>
            <p>- 甲烷的全球变暖潜势 (GWP) 无单位，值为 21</p>
            <p>- CH4 排放量单位为 千克 CH4，保留四位小数</p>
            <p>- CO₂ 排放量单位为 tCO₂，保留两位小数</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>行业选择</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>选择行业：</label>
            <select
              value={selectedIndustry}
              onChange={handleIndustryChange}
              style={{
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '14px',
                width: '300px'
              }}
            >
              <option value={INDUSTRIES.FOOD_MANUFACTURING}>食品制造业（包括酒业生产）</option>
              <option value={INDUSTRIES.TOBACCO_MANUFACTURING}>烟草制造业</option>
              <option value={INDUSTRIES.BEVERAGE_MANUFACTURING}>酒、饮料和精制茶制造业</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h4 style={{ marginBottom: '12px', fontWeight: 'bold' }}>MCF推荐值信息</h4>
            {selectedIndustry && MCF_RECOMMENDATIONS[selectedIndustry] && (
              <div>
                <p style={{ margin: '4px 0' }}><strong>行业：</strong>{MCF_RECOMMENDATIONS[selectedIndustry].name}</p>
                <p style={{ margin: '4px 0' }}><strong>建议MCF值：</strong>{MCF_RECOMMENDATIONS[selectedIndustry].recommended}</p>
                <p style={{ margin: '4px 0' }}><strong>MCF范围：</strong>{MCF_RECOMMENDATIONS[selectedIndustry].range}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加废水厌氧处理排放记录</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <button
                onClick={() => addNewWastewaterRecord()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                添加废水处理记录
              </button>
            </div>
            
          </div>
        </div>
        <div>
          {wastewaterRecords.map((record, index) => (
            <div key={record.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>废水处理记录({index + 1})</h3>
                </div>
                {(
                  <button
                    onClick={() => removeWastewaterRecord(record.id)}
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
              
              {renderVerticalLayoutTable(record)}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default FoodWastewaterTreatmentEmission;