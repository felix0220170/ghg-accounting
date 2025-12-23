import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 催化裂化装置催化剂烧焦排放计算指标
const INDICATORS = [
  {
    key: 'materialAmount',
    name: '生焦的质量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'carbonContent',
    name: '生焦的平均含碳量',
    unit: '吨碳/吨生焦',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'productAmount',
    name: '石油焦成品的质量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'dustAmount',
    name: '石油焦粉尘的质量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'productCarbonContent',
    name: '石油焦成品的平均含碳量',
    unit: '吨碳/吨石油焦',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'carbonOxidationRate',
    name: '碳氧化率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 100
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    getValue: (data) => {
      const { materialAmount, carbonContent, productAmount, dustAmount, productCarbonContent, carbonOxidationRate } = data;
      return (materialAmount * carbonContent - (productAmount + dustAmount) * productCarbonContent) * 44 / 12 * carbonOxidationRate / 100;
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
    name: `石油焦煅烧装置 ${unitNumber}`,
    data: initialData,
    files: {}
  };
};

function PetroleumCokeCalciningEmission({ onEmissionChange }) {
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
          
          // 获取当月的生焦质量
          const materialAmountData = unit.data.materialAmount?.find(m => m.month === month);
          const materialAmountValue = materialAmountData?.value ? parseFloat(materialAmountData.value) : 0;
          
          // 获取当月的生焦平均含碳量
          const carbonContentData = unit.data.carbonContent?.find(m => m.month === month);
          const carbonContentValue = carbonContentData?.value ? parseFloat(carbonContentData.value) : 0;

          // 获取当月的石油焦成品质量
          const productAmountData = unit.data.productAmount?.find(m => m.month === month);
          const productAmountValue = productAmountData?.value ? parseFloat(productAmountData.value) : 0;

          // 获取当月的石油焦粉尘质量
          const dustAmountData = unit.data.dustAmount?.find(m => m.month === month);
          const dustAmountValue = dustAmountData?.value ? parseFloat(dustAmountData.value) : 0;

          // 获取当月的石油焦成品平均含碳量
          const productCarbonContentData = unit.data.productCarbonContent?.find(m => m.month === month);
          const productCarbonContentValue = productCarbonContentData?.value ? parseFloat(productCarbonContentData.value) : 0;

          // 获取当月的碳氧化率
          const carbonOxidationRateData = unit.data.carbonOxidationRate?.find(m => m.month === month);
          const carbonOxidationRateValue = carbonOxidationRateData?.value ? parseFloat(carbonOxidationRateData.value) : 100;
          
          // 计算排放量：(生焦质量 * 生焦平均含碳量 - (石油焦成品质量 + 石油焦粉尘质量) * 石油焦成品平均含碳量) * 44 / 12 * 碳氧化率 / 100
          const emissionValue = (materialAmountValue * carbonContentValue - (productAmountValue + dustAmountValue) * productCarbonContentValue) * 44 / 12 * carbonOxidationRateValue / 100;
          
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>焦化装置排放总量</td>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>石油焦煅烧装置排放</h2>
      
      {/* 石油焦煅烧装置 */}  
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '12px' }}>排放说明</h3>
            <p>石油焦煅烧装置在煅烧过程中，生焦中的碳元素与氧气反应生成CO₂排放。</p>
            <h3 style={{ marginBottom: '12px' }}>计算说明</h3>
            <p>排放量（tCO₂） = (生焦质量（t） × 生焦平均含碳量（吨碳/吨生焦） - (石油焦成品质量（t） + 石油焦粉尘质量（t）) × 石油焦成品平均含碳量（吨碳/吨石油焦）) × 44 / 12 × 碳氧化率（%）/100</p>
            <p>- 生焦质量单位为 t，保留两位小数</p>
            <p>- 生焦平均含碳量单位为 吨碳/吨生焦，默认值为100%</p>
            <p>- 石油焦成品质量单位为 t，保留两位小数</p>
            <p>- 石油焦粉尘质量单位为 t，保留两位小数</p>
            <p>- 石油焦成品平均含碳量单位为 吨碳/吨石油焦，默认值为100%</p>
            <p>- 碳氧化率单位为 %, 默认值为100%</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>系数说明：</h4>
            <p>- 44 / 12：碳与CO₂的摩尔质量比，用于将碳排放量转换为CO₂排放量</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加石油焦煅烧装置排放记录</h3>

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
              添加石油焦煅烧装置
            </button>
          </div>
        </div>
        <div>
          {crackingUnits.map((unit, index) => (
            <div key={unit.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>石油焦煅烧装置 {index + 1}</h3>
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

export default PetroleumCokeCalciningEmission;
