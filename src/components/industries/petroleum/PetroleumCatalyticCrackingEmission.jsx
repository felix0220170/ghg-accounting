import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 催化裂化装置催化剂烧焦排放计算指标
const INDICATORS = [
  {
    key: 'catalyticCrackingRate',
    name: '催化裂化装置催化剂烧焦量',
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
      const { catalyticCrackingRate, carbonContent, carbonOxidationRate } = data;
      return catalyticCrackingRate * carbonContent / 100 * (carbonOxidationRate / 100) * 44 / 12;
    }
  }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = () => {
  const indicators = INDICATORS;
  
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

// 为催化裂化装置初始化数据（纵向布局）
const initializeCrackingUnitData = (unitNumber) => {
  const initialData = createInitialIndicatorData();
  
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
    id: `cracking-unit-${Date.now()}`,
    unitNumber: unitNumber,
    name: `催化裂化装置 ${unitNumber}`,
    data: initialData,
    files: {}
  };
};

function PetroleumCatalyticCrackingEmission({ onEmissionChange }) {
  // 催化裂化装置列表状态
  const [crackingUnits, setCrackingUnits] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 添加新的催化裂化装置
  const addNewCrackingUnit = useCallback(() => {
    const newUnitNumber = crackingUnits.length + 1;
    const newCrackingUnit = initializeCrackingUnitData(newUnitNumber);
    setCrackingUnits(prevUnits => [...prevUnits, newCrackingUnit]);
  }, [crackingUnits]);
  
  // 移除催化裂化装置
  const removeCrackingUnit = useCallback((unitId) => {
    setCrackingUnits(prevUnits => prevUnits.filter(unit => unit.id !== unitId));
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
    // 处理催化裂化装置数据计算
    setCrackingUnits(prevUnits => {
      let hasChanges = false;
      const updatedUnits = prevUnits.map(unit => {
        if (!unit.data) return unit;
        
        let updatedUnit = { ...unit, data: { ...unit.data } };
        let unitChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的催化裂化装置催化剂烧焦量
          const catalyticCrackingRateData = unit.data.catalyticCrackingRate?.find(m => m.month === month);
          const catalyticCrackingRateValue = catalyticCrackingRateData?.value ? parseFloat(catalyticCrackingRateData.value) : 0;
          
          // 获取当月的焦层中含碳量
          const carbonContentData = unit.data.carbonContent?.find(m => m.month === month);
          const carbonContentValue = carbonContentData?.value ? parseFloat(carbonContentData.value) : 0;

          // 获取当月的碳氧化率
          const carbonOxidationRateData = unit.data.carbonOxidationRate?.find(m => m.month === month);
          const carbonOxidationRateValue = carbonOxidationRateData?.value ? parseFloat(carbonOxidationRateData.value) : 100;
          
          // 计算排放量：催化裂化装置催化剂烧焦量 * 焦层中含碳量 / 100 * (碳氧化率/100) * 44 / 12
          const emissionValue = catalyticCrackingRateValue * carbonContentValue / 100 * (carbonOxidationRateValue / 100) * 44 / 12;
          
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
  }, [setCrackingUnits]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, crackingUnits]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'cracking-unit') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 使用催化裂化装置相关设置
    const setState = setCrackingUnits;
    const indicators = INDICATORS;
    
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
  }, [setCrackingUnits]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'cracking-unit') => {
    if (!file) return;
    
    const setState = setCrackingUnits;
    
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
            const indicatorDefinition = INDICATORS.find(ind => ind.key === indicatorKey);
            
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
  }, [setCrackingUnits]);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    crackingUnits.forEach(unit => {
      if (unit.data && unit.data['emission']) {
        unit.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    return total;
  }, [crackingUnits]);
  
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
    
    const indicators = INDICATORS;
    
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
      
      // 计算各催化裂化装置排放量
      crackingUnits.forEach(unit => {
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>催化裂化装置排放总量</td>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>催化裂化装置催化剂烧焦排放</h2>

      {/* 催化裂化装置 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '12px' }}>排放说明</h3>
            <p>催化裂化是石油炼制过程之一，是在热和催化剂的作用下使重质油发生裂化反应，转变为裂化气、汽油和柴油等的过程。在催化裂化工艺中，反应的副产物焦炭沉积在催化剂表面上，容易使催化剂失去活性，企业一般采用连续烧焦的方式来清除催化剂表面的结焦。</p>
            <p>对连续烧焦而言，烧焦产生的尾气有可能直接排放，也有可能通过CO 锅炉完全燃烧后再排放。后一种情况应把烧焦尾气视为一种燃料按照燃料燃烧排放核算方法进行计算并计入燃料燃烧排放。前一种情况则根据烧焦量计算连续烧焦的CO2 排放量并计入工业生产过程排放</p>
            <h3 style={{ marginBottom: '12px' }}>计算说明</h3>
            <p>催化裂化装置催化剂烧焦排放计算方法：排放量（tCO₂） = 催化裂化装置催化剂烧焦量（t） × 焦层中含碳量（%） × (碳氧化率（%）) × 44 / 12</p>
            <p>- 催化裂化装置催化剂烧焦量单位为 t，保留两位小数</p>
            <p>- 焦层中含碳量单位为 %, 含义为吨碳/吨焦 ,默认值为100%</p>
            <p>- 碳氧化率单位为 %, 默认值为98%</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>系数说明：</h4>
            <p>- 44 / 12：碳与CO₂的摩尔质量比，用于将碳排放量转换为CO₂排放量</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加催化裂化装置催化剂烧焦排放记录</h3>

          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '16px', alignItems: 'end' }}>
            <button
              onClick={addNewCrackingUnit}
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
              添加催化裂化装置
            </button>
          </div>
        </div>
        <div>
          {crackingUnits.map((unit, index) => (
            <div key={unit.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>催化裂化装置 {index + 1}</h3>
                </div>
                {(
                  <button
                    onClick={() => removeCrackingUnit(unit.id)}
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
              
              {renderVerticalLayoutTable(unit)}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default PetroleumCatalyticCrackingEmission;
