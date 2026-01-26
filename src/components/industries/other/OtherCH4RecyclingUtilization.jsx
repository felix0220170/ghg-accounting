import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 默认CH4回收利用配置
const DEFAULT_CH4_RECYCLING_PRODUCTS = [
  { id: 'product-1', name: 'place-holder', emissionFactor: 0.4400 },
];

// CH4回收利用计算指标
const CH4_RECYCLING_INDICATORS = [
  {
    key: 'recyclingSupplyAmount',
    name: '回收外供第三方的甲烷气量',
    unit: '10⁴Nm³',
    isCalculated: false,
    isFullYear: true,
    decimalPlaces: 2
  },
  {
    key: 'supplyGasCH4Concentration',
    name: '回收外供甲烷气中CH₄ 体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'recyclingRawMaterialAmount',
    name: '甲烷气回收现场自用量',
    unit: '10⁴Nm³',
    isCalculated: false,
    isFullYear: true,
    decimalPlaces: 2
  },
  {
    key: 'rawMaterialGasCH4Concentration',
    name: '回收自用甲烷气中CH₄ 体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'ch4OxidizingCoefficient',
    name: '回收自用过程的甲烷氧化系数',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 99
  },
  {
    key: 'emission',
    name: '回收利用量',
    unit: 'tCO₂e',
    isCalculated: true,
    decimalPlaces: 2
  }
];

// CH4火炬销毁计算指标
const TORCH_DESTRUCTION_INDICATORS = [
  {
    key: 'gasFlowRate',
    name: '进入火炬销毁装置的甲烷气流量',
    unit: 'Nm³/h',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'ch4Concentration',
    name: '进入火炬销毁装置的甲烷气小时平均 CH₄ 体积浓度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'destructionEfficiency',
    name: 'CH₄ 火炬销毁装置的平均销毁效率',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'operationTime',
    name: '火炬销毁装置运行时间',
    unit: 'h',
    isCalculated: false,
    decimalPlaces: 0
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂e',
    isCalculated: true,
    decimalPlaces: 2
  }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = () => {
  const indicators = CH4_RECYCLING_INDICATORS;
  
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

// 为CH4回收利用初始化数据（纵向布局）
const initializeCH4RecyclingProductData = (product) => {
  const initialData = createInitialIndicatorData();
  

  const indicators = CH4_RECYCLING_INDICATORS;
  
  // 为每个指标创建包含12个月数据的对象
  indicators.forEach((indicator) => {
    initialData[indicator.key] = initialData[indicator.key].map(item => ({
      ...item,
      value: indicator.isCalculated ? 0 : (indicator.defaultValue !== undefined ? indicator.defaultValue : ''),
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

// 创建火炬销毁的初始指标数据
const createTorchDestructionIndicatorData = () => {
  const indicators = TORCH_DESTRUCTION_INDICATORS;
  
  return indicators.reduce((acc, indicator) => {
    acc[indicator.key] = MONTHS.map((month, index) => ({
      month: index + 1,
      monthName: month,
      value: indicator.isCalculated ? 0 : '',
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 为火炬销毁初始化数据
const initializeTorchDestructionData = (torch) => {
  const initialData = createTorchDestructionIndicatorData();
  
  const indicators = TORCH_DESTRUCTION_INDICATORS;
  
  indicators.forEach((indicator) => {
    initialData[indicator.key] = initialData[indicator.key].map(item => ({
      ...item,
      value: indicator.isCalculated ? 0 : '',
      dataSource: '',
      supportingMaterial: null
    }));
  });
  
  return {
    ...torch,
    data: initialData,
    files: {},
    isDefault: false
  };
};

function CH4RecyclingUtilization({ onEmissionChange }) {
  const [ch4RecyclingProducts, setCH4RecyclingProducts] = useState([]);
  const [torchDestructionRecords, setTorchDestructionRecords] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 初始化默认数据
  useEffect(() => {
    const initializedProducts = DEFAULT_CH4_RECYCLING_PRODUCTS.map(product => initializeCH4RecyclingProductData(product));
    setCH4RecyclingProducts(initializedProducts);
  }, []);
  
  // 添加新的CH4回收利用项目
  const addNewRecyclingMaterial = useCallback(() => {
    const newProductId = `product-${Date.now()}`;
    const newProduct = {
      id: newProductId,
      name: '新回收利用项目',
      emissionFactor: 0
    };
    
    const initializedNewProduct = initializeCH4RecyclingProductData(newProduct);
    setCH4RecyclingProducts(prevProducts => [...prevProducts, initializedNewProduct]);
  }, []);
  
  // 移除CH4回收利用项目（仅支持移除非默认产品）
  const removeRecyclingMaterial = useCallback((productId) => {
    setCH4RecyclingProducts(prevProducts => {
      const productToRemove = prevProducts.find(product => product.id === productId);
      // 只允许移除非默认产品
      if (productToRemove && !productToRemove.isDefault) {
        return prevProducts.filter(product => product.id !== productId);
      }
      return prevProducts;
    });
  }, []);
  
  // 添加新的火炬销毁记录
  const addNewTorchDestructionRecord = useCallback(() => {
    const newRecordId = `torch-${Date.now()}`;
    const newRecord = {
      id: newRecordId,
      name: '火炬销毁装置'
    };
    
    const initializedNewRecord = initializeTorchDestructionData(newRecord);
    setTorchDestructionRecords(prevRecords => [...prevRecords, initializedNewRecord]);
  }, []);
  
  // 移除火炬销毁记录
  const removeTorchDestructionRecord = useCallback((recordId) => {
    setTorchDestructionRecords(prevRecords => {
      return prevRecords.filter(record => record.id !== recordId);
    });
  }, []);
  
  // 更新CH4回收利用项目名称
  const updateRecyclingMaterialName = useCallback((productId, newName) => {
    setCH4RecyclingProducts(prevProducts => prevProducts.map(product => 
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
  
  // 更新计算值 - 实现CH4回收利用量计算逻辑
  const updateCalculatedValues = useCallback(() => {
    // 处理CH4回收利用数据计算
    setCH4RecyclingProducts(prevProducts => {
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
          
          // 获取当月的外供气体CH4 体积浓度
          const supplyGasCH4ConcentrationData = product.data.supplyGasCH4Concentration?.find(m => m.month === month);
          const supplyGasCH4ConcentrationValue = supplyGasCH4ConcentrationData?.value ? parseFloat(supplyGasCH4ConcentrationData.value) : 0;

          // 获取当月的CH4 回收作原料量
          const recyclingRawMaterialAmountData = product.data.recyclingRawMaterialAmount?.find(m => m.month === month);
          const recyclingRawMaterialAmountValue = recyclingRawMaterialAmountData?.value ? parseFloat(recyclingRawMaterialAmountData.value) : 0;

          // 获取当月的原料气CH4 体积浓度
          const rawMaterialGasCH4ConcentrationData = product.data.rawMaterialGasCH4Concentration?.find(m => m.month === month);
          const rawMaterialGasCH4ConcentrationValue = rawMaterialGasCH4ConcentrationData?.value ? parseFloat(rawMaterialGasCH4ConcentrationData.value) : 0;

          // 获取当月的回收自用过程的甲烷氧化系数
          const ch4OxidizingCoefficientData = product.data.ch4OxidizingCoefficient?.find(m => m.month === month);
          const ch4OxidizingCoefficientValue = (ch4OxidizingCoefficientData?.value ? parseFloat(ch4OxidizingCoefficientData.value) : 99) / 100;
          
          // 计算排放量：(回收外供量 * 外供气体CH4 体积浓度 + 回收自用量 * 回收自用甲烷气中CH4体积浓度 * 回收自用过程的甲烷氧化系数) / 100 * 7.17 * 21
          const emissionValue = Math.max(0, recyclingSupplyAmountValue * supplyGasCH4ConcentrationValue + recyclingRawMaterialAmountValue * rawMaterialGasCH4ConcentrationValue * ch4OxidizingCoefficientValue) / 100 * 7.17 * 21;
          
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
                unit: 'tCO₂e'
              };
              productChanged = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂e'
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

    // 处理火炬销毁数据计算
    setTorchDestructionRecords(prevRecords => {
      let hasChanges = false;
      const updatedRecords = prevRecords.map(record => {
        if (!record.data) return record;
        
        let updatedRecord = { ...record, data: { ...record.data } };
        let recordChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的甲烷气流量
          const gasFlowRateData = record.data.gasFlowRate?.find(m => m.month === month);
          const gasFlowRateValue = gasFlowRateData?.value ? parseFloat(gasFlowRateData.value) : 0;
          
          // 获取当月的CH4体积浓度
          const ch4ConcentrationData = record.data.ch4Concentration?.find(m => m.month === month);
          const ch4ConcentrationValue = (ch4ConcentrationData?.value ? parseFloat(ch4ConcentrationData.value) : 0) / 100;
          
          // 获取当月的销毁效率
          const destructionEfficiencyData = record.data.destructionEfficiency?.find(m => m.month === month);
          const destructionEfficiencyValue = (destructionEfficiencyData?.value ? parseFloat(destructionEfficiencyData.value) : 0) / 100;
          
          // 获取当月的运行时间
          const operationTimeData = record.data.operationTime?.find(m => m.month === month);
          const operationTimeValue = operationTimeData?.value ? parseFloat(operationTimeData.value) : 0;
          
          // 计算排放量：平均销毁效率 * 甲烷气流量 * 运行时间 * 体积浓度 * 16 * 0.001 / 22.4 * 21 (GWP)
          const emissionValue = Math.max(0, destructionEfficiencyValue * gasFlowRateValue * operationTimeValue * ch4ConcentrationValue * 16 * 0.001 / 22.4 * 21);
          
          // 更新排放量数据
          const currentEmissionData = updatedRecord.data.emission || [];
          const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
          const newEmissionData = [...currentEmissionData];
          
          if (emissionMonthIndex !== -1) {
            if (parseFloat(newEmissionData[emissionMonthIndex].value) !== emissionValue) {
              newEmissionData[emissionMonthIndex] = {
                ...newEmissionData[emissionMonthIndex],
                value: emissionValue,
                unit: 'tCO₂e'
              };
              recordChanged = true;
            }
          } else if (emissionValue > 0) {
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂e'
            });
            recordChanged = true;
          }
          
          updatedRecord = {
            ...updatedRecord,
            data: {
              ...updatedRecord.data,
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
  }, [setCH4RecyclingProducts, setTorchDestructionRecords]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, ch4RecyclingProducts, torchDestructionRecords]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'ch4-recycling-product') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 根据类型选择对应的状态和指标
    const setState = type === 'torch-destruction' ? setTorchDestructionRecords : setCH4RecyclingProducts;
    const indicators = type === 'torch-destruction' ? TORCH_DESTRUCTION_INDICATORS : CH4_RECYCLING_INDICATORS;
    
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
  }, [setCH4RecyclingProducts, setTorchDestructionRecords]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'ch4-recycling-product') => {
    if (!file) return;
    
    const setState = type === 'torch-destruction' ? setTorchDestructionRecords : setCH4RecyclingProducts;
    const indicators = type === 'torch-destruction' ? TORCH_DESTRUCTION_INDICATORS : CH4_RECYCLING_INDICATORS;
    
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
  }, [setCH4RecyclingProducts, setTorchDestructionRecords]);
  
  // 计算总回收利用量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    // 计算CH4回收利用量
    ch4RecyclingProducts.forEach(product => {
      if (product.data && product.data['emission']) {
        product.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    // 计算火炬销毁排放量
    torchDestructionRecords.forEach(record => {
      if (record.data && record.data['emission']) {
        record.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    return total;
  }, [ch4RecyclingProducts, torchDestructionRecords]);
  
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
    
    const indicators = CH4_RECYCLING_INDICATORS;
    
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
  
  // 渲染火炬销毁的表格
  const renderTorchDestructionTable = (record) => {
    if (!record.data) return null;
    
    const indicators = TORCH_DESTRUCTION_INDICATORS;
    
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
          const indicatorData = record.data[indicator.key] || [];
          
          // 计算全年值
          let yearlyValue = 0;
          if (!indicator.isCalculated) {
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
                        <span>{formatValue(value, indicator.decimalPlaces)}</span>
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleDataChange(record.id, indicator.key, monthNum, 'value', e.target.value, 'torch-destruction')}
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
                  {!indicator.isCalculated ? (
                    formatValue(yearlyValue, indicator.decimalPlaces)
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                  {indicator.isCalculated ? '计算值' : ''}
                </td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                  {indicator.isCalculated ? (
                    '-'
                  ) : (
                    <input
                      type="text"
                      placeholder="输入数据来源"
                      value={indicatorData[0]?.dataSource || ''}
                      onChange={(e) => {
                        MONTHS.forEach((_, idx) => {
                          handleDataChange(record.id, indicator.key, idx + 1, 'dataSource', e.target.value, 'torch-destruction');
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
                    '-'
                  ) : (
                    <input
                      type="file"
                      onChange={(e) => {
                        MONTHS.forEach((_, idx) => {
                          handleFileUpload(record.id, indicator.key, idx + 1, e.target.files[0], 'torch-destruction');
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
  
  // 计算各月回收利用量
  const calculateMonthlyEmissionTotals = () => {
    const totalEmissions = [];
    
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      
      // 计算各CH4回收利用量
      ch4RecyclingProducts.forEach(product => {
        if (product.data && product.data['emission']) {
          const emissionData = product.data['emission'];
          const monthData = emissionData.find(d => d.month === month + 1);
          const emissionValue = monthData?.value || 0;
          monthTotal += parseFloat(emissionValue) || 0;
        }
      });
      
      // 计算各火炬销毁排放量
      torchDestructionRecords.forEach(record => {
        if (record.data && record.data['emission']) {
          const emissionData = record.data['emission'];
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
            <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>全年总计 (tCO₂e)</th>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>CH₄回收利用与火炬销毁</h2>
      
      {renderTotalEmissionTable()}

      {/* CH4回收利用 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>CH₄回收利用排放记录</h3>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>CH₄回收利用计算说明</h3>
            <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
              <p>CH₄回收利用量计算方法：回收利用量（tCO₂e） = （CH₄回收外供量（10⁴Nm³）× 外供气体CH₄体积浓度（%） + 甲烷气回收现场自用量（10⁴Nm³）× 回收自用甲烷气中CH₄体积浓度（%）× 回收自用过程的甲烷氧化系数（%）） × 7.17 × 21</p>
              <p>- CH₄回收外供量单位为 10⁴Nm³，保留两位小数</p>
              <p>- 甲烷气回收现场自用量单位为 10⁴Nm³，保留两位小数</p>
              <p>- 气体CH₄体积浓度单位为 %，保留整数</p>
              <p>- 回收自用过程的甲烷氧化系数单位为 %，保留整数，默认值为 99%</p>
              <p>- 回收利用量单位为 tCO₂e，保留两位小数</p>
              <p>- 7.17 为标况下CH₄气体的密度，单位为tCH₄/10<sup>4</sup>Nm³</p>
              <p>- 21 为CH₄的全球变暖潜能值（GWP）</p>
            </div>
          </div>
        </div>

        <div>
          {ch4RecyclingProducts.map((material, index) => (
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
      
      {/* CH4火炬销毁 */}
      <div style={{ marginTop: '40px', marginBottom: '40px', borderTop: '2px solid #d9d9d9', paddingTop: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>CH₄火炬销毁计算说明</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
            <p>CH₄火炬销毁排放量计算方法：排放量（tCO₂e） = 平均销毁效率（%） × 甲烷气流量（Nm³/h） × 运行时间（h） × 体积浓度（%） × 16 × 0.001 / 22.4 × 21（GWP）</p>
            <p>- 进入火炬销毁装置的甲烷气流量单位为 Nm³/h，保留两位小数（非标准状况下的流量需根据温度、压力转化成标准状况（0℃、101.325 KPa）下的流量）</p>
            <p>- 进入火炬销毁装置的甲烷气小时平均 CH₄ 体积浓度单位为 %，保留整数</p>
            <p>- CH₄ 火炬销毁装置的平均销毁效率单位为 %，保留整数</p>
            <p>- 火炬销毁装置运行时间单位为 h，保留整数</p>
            <p>- 排放量单位为 tCO₂e，保留两位小数</p>
            <p>- 16 为 CH₄ 的分子量</p>
            <p>- 22.4 为标准状况下1摩尔气体的体积（L/mol）</p>
            <p>- 21 为 CH₄ 的全球变暖潜能值（GWP）</p>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加火炬销毁排放记录</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end', marginBottom: '24px' }}>
            <div></div>
            <div>
              <button
                onClick={addNewTorchDestructionRecord}
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
                添加火炬销毁记录
              </button>
            </div>
          </div>
          
          {torchDestructionRecords.map((record, index) => (
            <div key={record.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>火炬销毁记录({index + 1})</h3>
                <button
                  onClick={() => removeTorchDestructionRecord(record.id)}
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
              </div>
              
              {renderTorchDestructionTable(record)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CH4RecyclingUtilization;
