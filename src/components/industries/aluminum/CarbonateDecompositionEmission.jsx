import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CustomCarbonateDecompositionForm from '../common/CustomCarbonateDecompositionForm';
import CustomCarbonateDecompositionList from '../common/CustomCarbonateDecompositionList';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 默认碳酸盐配置
const DEFAULT_CARBONATE_PRODUCTS = [
  { id: 'carbonate-product-1', name: '碳酸钙 (CaCO₃) - 俗称：石灰石', formula: 'CaCO₃', emissionFactor: 0.4400 },
  { id: 'carbonate-product-2', name: '碳酸镁 (MgCO₃) - 俗称：菱镁矿', formula: 'MgCO₃', emissionFactor: 0.5220 },
  { id: 'carbonate-product-3', name: '碳酸钠 (Na₂CO₃) - 俗称：纯碱、苏打', formula: 'Na₂CO₃', emissionFactor: 0.4149 },
  { id: 'carbonate-product-4', name: '碳酸氢钠 (NaHCO₃) - 俗称：小苏打', formula: 'NaHCO₃', emissionFactor: 0.5237 },
  { id: 'carbonate-product-5', name: '碳酸亚铁 (FeCO₃) - 俗称：菱铁矿', formula: 'FeCO₃', emissionFactor: 0.3799 },
  { id: 'carbonate-product-6', name: '碳酸锰 (MnCO₃) - 俗称：菱锰矿', formula: 'MnCO₃', emissionFactor: 0.3829 }, 
  { id: 'carbonate-product-7', name: '碳酸钡 (BaCO₃) - 俗称：碳酸钡矿', formula: 'BaCO₃', emissionFactor: 0.2230 },
  { id: 'carbonate-product-8', name: '碳酸锂 (Li₂CO₃) - 俗称：锂矿产品', formula: 'Li₂CO₃', emissionFactor: 0.5955 },
  { id: 'carbonate-product-9', name: '碳酸钾 (K₂CO₃) - 俗称：钾碱', formula: 'K₂CO₃', emissionFactor: 0.3184 },
  { id: 'carbonate-product-10', name: '碳酸锶 (SrCO₃) - 俗称：碳酸锶矿', formula: 'SrCO₃', emissionFactor: 0.2980 },
  { id: 'carbonate-product-11', name: '碳酸镁钙 (CaMg(CO₃)₂) - 俗称：白云石', formula: 'CaMg(CO₃)₂', emissionFactor: 0.4773 }
];

// 碳酸盐分解排放计算指标
const CARBONATE_INDICATORS = [
  {
    key: 'consumptionAmount',
    name: '碳酸盐消耗量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'emissionFactor',
    name: '碳酸盐分解的二氧化碳排放因子',
    unit: 'tCO₂/t',
    isCalculated: false,
    decimalPlaces: 4
  },
  {
    key: 'purity',
    name: '碳酸盐纯度',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 0,
    defaultValue: 100
  },
  {
    key: 'emission',
    name: '碳酸盐分解排放量',
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
      value: indicator.defaultValue || (indicator.isCalculated ? 0 : (indicator.key === 'emissionFactor' ? 0 : '')),
      unit: indicator.unit
    }));
    return acc;
  }, {});
};

// 为碳酸盐初始化数据（纵向布局）
const initializeCarbonateProductData = (product) => {
  const initialData = createInitialIndicatorData();
  
  // 为排放因子设置默认值和额外字段
  initialData.emissionFactor = initialData.emissionFactor.map(item => ({
    ...item,
    value: product.emissionFactor,
    dataSource: '', // 数据来源
    supportingMaterial: null // 支撑材料
  }));
  
  // 为消耗量初始化额外字段
  initialData.consumptionAmount = initialData.consumptionAmount.map(item => ({
    ...item,
    value: item.value,
    dataSource: '', // 数据来源
    supportingMaterial: null // 支撑材料
  }));
  
  return {
    ...product,
    data: initialData,
    files: {},
    isDefault: product.id === 'carbonate-product-1' || product.id === 'carbonate-product-2' // 标记默认碳酸盐
  };
};

function CarbonateDecompositionEmission({ onEmissionChange }) {
  // 碳酸盐列表状态
  const [carbonateProducts, setCarbonateProducts] = useState([]);

  const [customCarbonMaterials, setCustomCarbonMaterials] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 初始化默认数据
  useEffect(() => {
    const initializedProducts = [];
    setCarbonateProducts(initializedProducts);
  }, []);
  
  // 添加新的自定义碳酸盐
  const addNewCarbonateProduct = useCallback((id) => {
      //const newProductId = `carbonate-product-${Date.now()}`;
      const newProductId = `${id}`;
      const DEFAULT_CARBONATE_PRODUCT = [...DEFAULT_CARBONATE_PRODUCTS, ...customCarbonMaterials].find(product => product.id === id);
      const newProduct = {
        id: `${newProductId}-${Date.now()}`,
        name: DEFAULT_CARBONATE_PRODUCT?.name || '新碳酸盐',
        emissionFactor: DEFAULT_CARBONATE_PRODUCT?.emissionFactor || 0
      };
      
      const initializedNewProduct = initializeCarbonateProductData(newProduct);
      setCarbonateProducts(prevProducts => [...prevProducts, initializedNewProduct]);
    }, [customCarbonMaterials]);
  
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
  
  // 更新碳酸盐名称
  const updateCarbonateProductName = useCallback((productId, newName) => {
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
          
          // 获取当月的消耗量和排放因子
          const consumptionAmountData = product.data.consumptionAmount?.find(m => m.month === month);
          const consumptionAmountValue = consumptionAmountData?.value ? parseFloat(consumptionAmountData.value) : 0;
          
          const emissionFactorData = product.data.emissionFactor?.find(m => m.month === month);
          const emissionFactorValue = emissionFactorData?.value || product.emissionFactor || 0;

          // 获取当月的纯度
          const purityData = product.data.purity?.find(m => m.month === month);
          const purityValue = purityData?.value ? parseFloat(purityData.value) : 100;
          
          // 计算排放量：消耗量 * 排放因子 * 纯度%
          const emissionValue = Math.max(0, consumptionAmountValue) * emissionFactorValue * purityValue / 100;
          
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>碳酸盐分解排放总量</td>
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

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addCustomCarbonMaterial = useCallback((materialData) => {
        const customMaterial = {
          id: `custom-${generateId()}`,
          name: materialData.name,
          emissionFactor: parseFloat(materialData.emissionFactor) || 0,
          isCustom: true,
        };
        setCustomCarbonMaterials([...customCarbonMaterials, customMaterial]);
      }, [customCarbonMaterials]);

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>碳酸盐分解排放</h2>

      {/* 碳酸盐 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>计算说明</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
            <p>碳酸盐的排放计算方法：排放量（tCO₂） = 碳酸盐消耗量（t） × 碳酸盐排放因子（tCO₂/t） ×  纯度%</p>
            <p>- 产量单位为 t，保留两位小数</p>
            <p>- 排放因子单位为 tCO₂/t，保留四位小数</p>
            <p>- 纯度单位为 %，保留零位小数</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加碳酸盐分解排放记录</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label htmlFor="carbonateProductType" style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>添加碳酸盐 <span style={{ color: '#ff4d4f' }}>*</span></label>
            <select
              onChange={(e) => {
                const fuelId = e.target.value;
                if (fuelId) {
                  addNewCarbonateProduct(fuelId);
                  e.target.value = '';
                }
              }}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">请选择</option>
              {DEFAULT_CARBONATE_PRODUCTS.map(fuel => (
                <option key={fuel.id} value={fuel.id}>{fuel.name}</option>
              ))}
              {customCarbonMaterials && customCarbonMaterials.length > 0 && (
                    <>
                      <option disabled>--------------------</option>
                      {customCarbonMaterials.map(fuel => (
                        <option key={fuel.id} value={fuel.id}>{fuel.name}</option>
                      ))}
                    </>
                  )}
            </select>
            </div>
            
          </div>
        </div>

        <div>
          {carbonateProducts.map((product, index) => (
            <div key={product.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>碳酸盐({index + 1}):  {product.name}</h3>
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

        <div style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
          <CustomCarbonateDecompositionForm
            onAddCustomMaterial={addCustomCarbonMaterial}
            name="碳酸盐"
          />
          <CustomCarbonateDecompositionList
            customCarbonMaterials={customCarbonMaterials}
            setCustomCarbonMaterials={setCustomCarbonMaterials}
            name="碳酸盐"
          />
        </div>
      </div>
    </div>
  );
}

export default CarbonateDecompositionEmission;