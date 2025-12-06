import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 默认碳酸盐配置
const DEFAULT_CARBONATE_PRODUCTS = [
  { id: 'product-1', name: 'place-holder', emissionFactor: 0.4400 },
];

// 碳酸盐分解排放计算指标
const CARBONATE_INDICATORS = [
  {
    key: 'recyclingSupplyAmount',
    name: 'CO2 回收外供量',
    unit: 'tCO₂',
    isCalculated: false,
    isFullYear: true,
    decimalPlaces: 2
  },
  {
    key: 'supplyGasCO2Concentration',
    name: '外供气体CO2 体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'recyclingRawMaterialAmount',
    name: 'CO2 回收作原料量',
    unit: 'tCO₂',
    isCalculated: false,
    isFullYear: true,
    decimalPlaces: 2
  },
  {
    key: 'rawMaterialGasCO2Concentration',
    name: '原料气CO2 体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'emission',
    name: '回收利用量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2
  }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = () => {
  const indicators = CARBONATE_INDICATORS;
  
  // 为每个指标创建包含12个月数据的对象
  return indicators.reduce((acc, indicator) => {
    acc[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: indicator.isCalculated ? 0 : (indicator.key === 'emissionFactor' ? 0 : ''),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 为碳酸盐初始化数据（纵向布局）
const initializeCarbonateProductData = (product) => {
  const initialData = createInitialIndicatorData();
  

  const indicators = CARBONATE_INDICATORS;
  
  // 为每个指标创建包含12个月数据的对象
  indicators.forEach((indicator) => {
    initialData[indicator.key] = initialData[indicator.key].map(item => ({
      ...item,
      value: indicator.isCalculated ? 0 : (indicator.key === 'emissionFactor' ? 0 : ''),
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  return {
    ...product,
    data: initialData,
    files: {},
    isDefault: product.id === 'product-1'
  };
};

function CO2RecyclingUtilization({ onEmissionChange }) {
  const [carbonateProducts, setCarbonateProducts] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 初始化默认数据
  useEffect(() => {
    const initializedProducts = DEFAULT_CARBONATE_PRODUCTS.map(product => initializeCarbonateProductData(product));
    setCarbonateProducts(initializedProducts);
  }, []);
  
  // 添加新的自定义carbonsite
  const addNewRecyclingMaterial = useCallback(() => {
    const newProductId = `product-${Date.now()}`;
    const newProduct = {
      id: newProductId,
      name: '新carbonsite',
      emissionFactor: 0
    };
    
    const initializedNewProduct = initializeCarbonateProductData(newProduct);
    setCarbonateProducts(prevProducts => [...prevProducts, initializedNewProduct]);
  }, []);
  
  // 移除碳酸盐（仅支持移除非默认产品）
  const removeRecyclingMaterial = useCallback((productId) => {
    setCarbonateProducts(prevProducts => {
      const productToRemove = prevProducts.find(product => product.id === productId);
      // 只允许移除非默认产品
      if (productToRemove && !productToRemove.isDefault) {
        return prevProducts.filter(product => product.id !== productId);
      }
      return prevProducts;
    });
  }, []);
  
  // 更新carbonsite名称
  const updateRecyclingMaterialName = useCallback((productId, newName) => {
    setCarbonateProducts(prevProducts => prevProducts.map(product => 
      product.id === productId ? { ...product, name: newName } : product
    ));
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
    // 处理碳酸盐数据计算
    setCarbonateProducts(prevProducts => {
      let hasChanges = false;
      const updatedProducts = prevProducts.map(product => {
        if (!product.data) return product;
        
        let updatedProduct = { ...product, data: { ...product.data } };
        let productChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的回收外供量
          const recyclingSupplyAmountData = product.data.recyclingSupplyAmount?.find(m => m.month === month);
          const recyclingSupplyAmountValue = recyclingSupplyAmountData?.value ? parseFloat(recyclingSupplyAmountData.value) : 0;
          
          // 获取当月的外供气体CO2 体积浓度
          const supplyGasCO2ConcentrationData = product.data.supplyGasCO2Concentration?.find(m => m.month === month);
          const supplyGasCO2ConcentrationValue = supplyGasCO2ConcentrationData?.value ? parseFloat(supplyGasCO2ConcentrationData.value) : 0;

          // 获取当月的CO2 回收作原料量
          const recyclingRawMaterialAmountData = product.data.recyclingRawMaterialAmount?.find(m => m.month === month);
          const recyclingRawMaterialAmountValue = recyclingRawMaterialAmountData?.value ? parseFloat(recyclingRawMaterialAmountData.value) : 0;

          // 获取当月的原料气CO2 体积浓度
          const rawMaterialGasCO2ConcentrationData = product.data.rawMaterialGasCO2Concentration?.find(m => m.month === month);
          const rawMaterialGasCO2ConcentrationValue = rawMaterialGasCO2ConcentrationData?.value ? parseFloat(rawMaterialGasCO2ConcentrationData.value) : 0;
          
          // 计算排放量：(回收外供量 * 外供气体CO2 体积浓度 + 回收作原料量 * 原料气CO2 体积浓度) * 19.7
          const emissionValue = Math.max(0, recyclingSupplyAmountValue * supplyGasCO2ConcentrationValue + recyclingRawMaterialAmountValue * rawMaterialGasCO2ConcentrationValue) / 100 * 19.7;
          
          // 更新排放量数据
          const currentEmissionData = updatedProduct.data.emission || [];
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
              productChanged = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂'
            });
            productChanged = true;
          }
          
          // 应用更新
          updatedProduct = {
            ...updatedProduct,
            data: {
              ...updatedProduct.data,
              emission: newEmissionData
            }
          };
        }
        
        if (productChanged) {
          hasChanges = true;
          return updatedProduct;
        }
        
        return product;
      });
      
      return hasChanges ? updatedProducts : prevProducts;
    });
  }, [setCarbonateProducts]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, carbonateProducts]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'carbonate-product') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 使用碳酸盐相关设置
    const setState = setCarbonateProducts;
    const indicators = CARBONATE_INDICATORS;
    
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
  }, [setCarbonateProducts]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'carbonate-product') => {
    if (!file) return;
    
    const setState = setCarbonateProducts;
    
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
            const indicatorDefinition = CARBONATE_INDICATORS.find(ind => ind.key === indicatorKey);
            
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
  }, [setCarbonateProducts]);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    carbonateProducts.forEach(product => {
      if (product.data && product.data['emission']) {
        product.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    return total;
  }, [carbonateProducts]);
  
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
    
    const indicators = CARBONATE_INDICATORS;
    
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
      
      // 计算各碳酸盐排放量
      carbonateProducts.forEach(product => {
        if (product.data && product.data['emission']) {
          const emissionData = product.data['emission'];
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>总量</td>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>企业CO2回收利用量(公用组件)</h2>
      
      {renderTotalEmissionTable()}

      {/* CO2回收材料 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>CO2回收利用计算说明</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
            <p>CO2回收利用量计算方法：回收利用量（tCO₂） = （CO2回收外供量（tCO₂）× 外供气体CO2体积浓度（%） + CO2回收作原料量（tCO₂）× 原料气CO2体积浓度（%）） × 19.7</p>
            <p>- CO2回收外供量单位为 tCO₂，保留两位小数</p>
            <p>- CO2回收作原料量单位为 tCO₂，保留两位小数</p>
            <p>- 气体CO2体积浓度单位为 %，保留整数</p>
            <p>- 回收利用量单位为 tCO₂，保留两位小数</p>
            <p>- 19.7 为标况下CO2 气体的密度，单位为tCO₂/10<sup>4</sup>Nm³, 可以考虑为系统配置或常量</p>
          </div>
        </div>

        <div>
          {carbonateProducts.map((material, index) => (
            <div key={material.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                {/* 
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>回收材料类型 {index + 1}</h3> 
                  <input
                    type="text"
                    value={material.name}
                    onChange={(e) => updateRecyclingMaterialName(material.id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>*/}
                {!material.isDefault && 1 == 2 && (
                  <button
                    onClick={() => removeRecyclingMaterial(material.id)}
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
              
              {renderVerticalLayoutTable(material)}
            </div>
          ))}
          
          
          <button
            onClick={addNewRecyclingMaterial}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '24px',
              display: 'none'
            }}
          >
            添加回收材料
          </button> 
          
        </div>
      </div>
    </div>
  );
}

export default CO2RecyclingUtilization;