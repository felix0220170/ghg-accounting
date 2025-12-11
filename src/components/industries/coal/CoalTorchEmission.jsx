import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 默认煤矿瓦斯气体成分列表
const DEFAULT_GAS_COMPONENTS = [
  { id: 'gas-1', name: '一氧化碳', formula: 'CO', carbonAtoms: 1 },
  { id: 'gas-2', name: '甲烷', formula: 'CH4', carbonAtoms: 1 },
  { id: 'gas-3', name: '乙烷', formula: 'C2H6', carbonAtoms: 2 },
  { id: 'gas-4', name: '丙烷', formula: 'C3H8', carbonAtoms: 3 },
];

// 煤矿瓦斯火炬燃烧排放计算指标
const CARBONATE_INDICATORS = [
  {
    key: 'torchBurningAmount',
    name: '煤矿瓦斯的火炬燃烧量',
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
    isCalculated: true,
    decimalPlaces: 4
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true
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
      value: indicator.isCalculated ? 0 : (indicator.defaultValue !== undefined ? indicator.defaultValue : ''),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 为煤矿瓦斯火炬燃烧初始化数据（纵向布局）
const initializeCarbonateProductData = (product) => {
  const initialData = createInitialIndicatorData();
  
  // 为每个指标添加额外字段
  Object.keys(initialData).forEach(indicatorKey => {
    initialData[indicatorKey] = initialData[indicatorKey].map(item => ({
      ...item,
      dataSource: '', // 数据来源
      supportingMaterial: null // 支撑材料
    }));
  });
  
  return {
    ...product,
    data: initialData,
    files: {},
    gasComponents: product.gasComponents || [],
    gasConcentrations: product.gasConcentrations || {},
    isDefault: false // 不再有默认的产品
  };
};

function CoalTorchEmission({ onEmissionChange }) {
  // 火炬燃烧列表状态
  const [carbonateProducts, setCarbonateProducts] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 气体成分状态
  const [gasComponents, setGasComponents] = useState(DEFAULT_GAS_COMPONENTS);
  
  // 体积浓度状态
  const [gasConcentrations, setGasConcentrations] = useState({
    'gas-1': '', // CO
    'gas-2': '', // CH4
    'gas-3': '', // C2H6
    'gas-4': '', // C3H8
  });
  
  // 自定义气体状态
  const [customGas, setCustomGas] = useState({
    name: '',
    formula: '',
    carbonAtoms: '',
    concentration: ''
  });
  
  // 处理气体浓度变化
  const handleGasConcentrationChange = (gasId, value) => {
    setGasConcentrations(prev => ({
      ...prev,
      [gasId]: value
    }));
  };
  
  // 添加自定义气体
  const addCustomGas = () => {
    if (!customGas.name || !customGas.formula || !customGas.carbonAtoms || !customGas.concentration) return;
    
    const newGasId = `gas-custom-${Date.now()}`;
    const newGas = {
      id: newGasId,
      name: customGas.name,
      formula: customGas.formula,
      carbonAtoms: parseInt(customGas.carbonAtoms)
    };
    
    setGasComponents(prev => [...prev, newGas]);
    setGasConcentrations(prev => ({
      ...prev,
      [newGasId]: customGas.concentration
    }));
    
    // 重置自定义气体表单
    setCustomGas({
      name: '',
      formula: '',
      carbonAtoms: '',
      concentration: ''
    });
  };
  
  // 初始化默认数据
  useEffect(() => {
    const initializedProducts = [];
    setCarbonateProducts(initializedProducts);
  }, []);
  
  // 添加新的煤矿瓦斯火炬燃烧记录
  const addNewCarbonateProduct = useCallback(() => {
    // 验证至少有一种气体浓度大于0
    const hasValidGasConcentration = gasComponents.some(gas => gasConcentrations[gas.id] !== '' && parseFloat(gasConcentrations[gas.id]) > 0);
    
    if (!hasValidGasConcentration) {
      alert('请至少输入一种气体的体积浓度（大于0）');
      return;
    }
    
    const newProductId = `torch-burning-${Date.now()}`;
    
    // 创建新的产品对象，包含气体成分和浓度数据
    const newProduct = {
      id: newProductId,
      name: '煤矿瓦斯火炬燃烧',
      gasComponents: gasComponents.filter(gas => gasConcentrations[gas.id] !== '' && parseFloat(gasConcentrations[gas.id]) > 0),
      gasConcentrations: gasConcentrations
    };
    
    const initializedNewProduct = initializeCarbonateProductData(newProduct);
    setCarbonateProducts(prevProducts => [...prevProducts, initializedNewProduct]);
  }, [gasComponents, gasConcentrations]);
  
  // 移除碳酸盐（仅支持移除非默认产品）
  const removeCarbonateProduct = useCallback((productId) => {
    setCarbonateProducts(prevProducts => {
      const productToRemove = prevProducts.find(product => product.id === productId);
      // 只允许移除非默认产品
      if (productToRemove) {
        return prevProducts.filter(product => product.id !== productId);
      }
      return prevProducts;
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
    // 处理煤矿瓦斯火炬燃烧数据计算
    setCarbonateProducts(prevProducts => {
      let hasChanges = false;
      const updatedProducts = prevProducts.map(product => {
        if (!product.data) return product;
        
        let updatedProduct = { ...product, data: { ...product.data } };
        let productChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的煤矿瓦斯燃烧量
          const torchBurningAmountData = product.data.torchBurningAmount?.find(m => m.month === month);
          const torchBurningAmountValue = torchBurningAmountData?.value ? parseFloat(torchBurningAmountData.value) : 0;

          // 获取碳氧化率
          const carbonOxidationRateData = product.data.carbonOxidationRate?.find(m => m.month === month);
          const carbonOxidationRateValue = carbonOxidationRateData?.value || 98;
          
          // 计算总含碳量：Sum(12 * 气体碳原子数量 * 浓度 * 10 / 22.4)
          let totalCarbonContentValue = 0;
          product.gasComponents?.forEach(gas => {
            const concentration = product.gasConcentrations?.[gas.id] || 0;
            if (concentration > 0) {
              totalCarbonContentValue += (12 * gas.carbonAtoms * concentration * 10) / 22.4;
            }
          });
          
          // 计算排放量：煤矿瓦斯燃烧量 * 含碳量 * 碳氧化率 * 44/12
          const emissionValue = Math.max(0, torchBurningAmountValue) * totalCarbonContentValue * (carbonOxidationRateValue / 100) * (44 / 12);
          
          // 更新总含碳量数据
          const currentTotalCarbonContentData = updatedProduct.data.totalCarbonContent || [];
          const totalCarbonContentMonthIndex = currentTotalCarbonContentData.findIndex(m => m.month === month);
          const newTotalCarbonContentData = [...currentTotalCarbonContentData];
          
          if (totalCarbonContentMonthIndex !== -1) {
            if (parseFloat(newTotalCarbonContentData[totalCarbonContentMonthIndex].value) !== totalCarbonContentValue) {
              newTotalCarbonContentData[totalCarbonContentMonthIndex] = {
                ...newTotalCarbonContentData[totalCarbonContentMonthIndex],
                value: totalCarbonContentValue,
                unit: 't碳/104Nm³'
              };
              productChanged = true;
            }
          }
          
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
              totalCarbonContent: newTotalCarbonContentData,
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

  // 处理技术选择变化
  const handleTechChange = useCallback((productId, selectedTech) => {
    setCarbonateProducts(prevProducts => {
      return prevProducts.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            selectedTech
          };
        }
        return product;
      });
    });
  }, [setCarbonateProducts]);
  
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>煤矿瓦斯火炬燃烧的排放总量</td>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>煤矿瓦斯火炬燃烧排放</h2>
      {/* 煤矿瓦斯火炬燃烧 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '16px' }}>计算说明</h3>
            <p>煤矿瓦斯火炬燃烧过程中，含碳气体（如CO、CH₄、C₂H₆、C₃H₈等）燃烧生成CO₂，排放量根据瓦斯燃烧量、气体成分、碳氧化率等计算。</p>
            <p>煤矿瓦斯火炬燃烧排放量 = 煤矿瓦斯燃烧量 × 除CO₂外其他含碳化合物的总含碳量 × 碳氧化率 × 44/12</p>
            <p>除CO₂外其他含碳化合物的总含碳量 = Sum(12 × 气体碳原子数量 × 浓度 × 10 / 22.4)</p>
            <p>其中：12为碳的摩尔质量（12 g/mol），22.4为标准状况下的摩尔体积（0.022414 Nm³/mol）</p>
            <p>- 煤矿瓦斯燃烧量单位为 10<sup>4</sup>Nm³，保留两位小数</p>
            <p>- 碳氧化率单位为 %，默认值为98%</p>
            <p>- 除CO₂外其他含碳化合物的总含碳量单位为 t碳/10<sup>4</sup>Nm³，保留两位小数</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加火炬燃烧生产排放记录</h3>
            
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px', color: '#333' }}>煤矿瓦斯气体成分（体积浓度%）</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {gasComponents.map((gas) => (
                        <div key={gas.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', padding: '8px 0' }}>
                            <label style={{ flex: 1, fontWeight: 'bold', color: '#555', fontSize: '14px' }}>{gas.name} ({gas.formula})</label>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    placeholder="请输入"
                                    value={gasConcentrations[gas.id] || ''}
                                    onChange={(e) => handleGasConcentrationChange(gas.id, e.target.value)}
                                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px', minWidth: '100px' }}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <span style={{ color: '#888', fontSize: '14px' }}>%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h4 style={{ marginBottom: '12px', color: '#333' }}>添加自定义气体</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>气体名称</label>
                        <input
                            type="text"
                            placeholder="如：丁烷"
                            value={customGas.name}
                            onChange={(e) => setCustomGas(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>化学式</label>
                        <input
                            type="text"
                            placeholder="如：C4H10"
                            value={customGas.formula}
                            onChange={(e) => setCustomGas(prev => ({ ...prev, formula: e.target.value }))}
                            style={{ width: '100%', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>碳原子数目</label>
                        <input
                            type="number"
                            placeholder="如：4"
                            value={customGas.carbonAtoms}
                            onChange={(e) => setCustomGas(prev => ({ ...prev, carbonAtoms: e.target.value }))}
                            style={{ width: '100%', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            min="1"
                            step="1"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>体积浓度%</label>
                        <input
                            type="number"
                            placeholder="如：5"
                            value={customGas.concentration}
                            onChange={(e) => setCustomGas(prev => ({ ...prev, concentration: e.target.value }))}
                            style={{ width: '100%', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            min="0"
                            max="100"
                            step="0.1"
                        />
                    </div>
                    <button
                        onClick={addCustomGas}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#52c41a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            alignSelf: 'end'
                        }}
                    >
                        添加气体
                    </button>
                </div>
            </div>
            
            <button
                onClick={addNewCarbonateProduct}
                style={{
                    padding: '10px 24px',
                    backgroundColor: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
            >
                添加排放记录
            </button>
        </div>

        <div>
          {carbonateProducts.map((product, index) => (
            <div key={product.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>{product.name}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {product.gasComponents.map((gas, idx) => {
                      const concentration = product.gasConcentrations[gas.id];
                      return (
                        <span key={gas.id} style={{ fontSize: '14px', color: '#666' }}>
                          {gas.name}({gas.formula}): {concentration}%{idx < product.gasComponents.length - 1 ? '，' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {!product.isDefault && (
                  <button
                    onClick={() => removeCarbonateProduct(product.id)}
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
              
              {renderVerticalLayoutTable(product)}
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}

export default CoalTorchEmission;