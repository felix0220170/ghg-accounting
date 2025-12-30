import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, Table } from 'antd';
import { Button } from 'antd';
import { GREENHOUSE_GAS_GWP } from '../../../config/greenhouseGasConstants';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// HFCs/PFCs/SF6生产过程排放计算指标
const INDICATORS = [
  {
    key: 'productionAmount',
    name: '产量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2
  },
  {
    key: 'emissionFactor',
    name: '排放因子',
    unit: '%',
    isCalculated: false,
    decimalPlaces: 2,
    defaultValue: 0.5
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    getValue: (data) => {
      const { productionAmount, emissionFactor, gwpValue } = data;
      return productionAmount * emissionFactor / 100 * gwpValue;
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

// 产品类型选项（包含GWP值）
const PRODUCT_TYPES = [
  { value: 'HFC-32', label: 'HFC-32', gwp: GREENHOUSE_GAS_GWP['HFC-32'] || 650, defaultFactor: 0.5 },
  { value: 'HFC-125', label: 'HFC-125', gwp: GREENHOUSE_GAS_GWP['HFC-125'] || 2800, defaultFactor: 0.5 },
  { value: 'HFC-134a', label: 'HFC-134a', gwp: GREENHOUSE_GAS_GWP['HFC-134a'] || 1300, defaultFactor: 0.5 },
  { value: 'HFC-143a', label: 'HFC-143a', gwp: GREENHOUSE_GAS_GWP['HFC-143a'] || 3800, defaultFactor: 0.5 },
  { value: 'HFC-152a', label: 'HFC-152a', gwp: GREENHOUSE_GAS_GWP['HFC-152a'] || 140, defaultFactor: 0.5 },
  { value: 'HFC-227ea', label: 'HFC-227ea', gwp: GREENHOUSE_GAS_GWP['HFC-227ea'] || 2900, defaultFactor: 0.5 },
  { value: 'HFC-236fa', label: 'HFC-236fa', gwp: GREENHOUSE_GAS_GWP['HFC-236fa'] || 6300, defaultFactor: 0.5 },
  { value: 'HFC-245fa', label: 'HFC-245fa', gwp: GREENHOUSE_GAS_GWP['HFC-245fa'] || 1030, defaultFactor: 0.5 },
  { value: 'SF6-pure', label: 'SF6 (高纯度 ≥99.999%)', gwp: GREENHOUSE_GAS_GWP['SF6'] || 23900, defaultFactor: 8 },
  { value: 'SF6-impure', label: 'SF6 (非高纯度 <99.999%)', gwp: GREENHOUSE_GAS_GWP['SF6'] || 23900, defaultFactor: 0.2 }
];

// 为产品初始化数据（纵向布局）
const initializeProductData = (productType, customProductInfo = null) => {
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
  
  // 查找产品信息（优先使用自定义产品信息）
  const productInfo = customProductInfo || PRODUCT_TYPES.find(p => p.value === productType);
  
  return {
    id: `product-${Date.now()}`,
    productType: productType,
    productLabel: productInfo?.label || productType,
    gwpValue: productInfo?.gwp || 0,
    defaultEmissionFactor: productInfo?.defaultFactor || 0.5,
    isCustom: productInfo?.isCustom || false,
    data: initialData,
    files: {}
  };
};

function HFCsPFCsSF6Emission({ onEmissionChange }) {
  // 产品列表状态
  const [products, setProducts] = useState([]);
  // 选中的产品类型
  const [selectedProductType, setSelectedProductType] = useState('');
  // 自定义产品管理
  const [customProducts, setCustomProducts] = useState([]);
  // 自定义产品表单状态
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProductForm, setCustomProductForm] = useState({
    name: '',
    gwp: '',
    defaultFactor: '0.5'
  });
  // GWP值显示弹窗状态
  const [showGWPModal, setShowGWPModal] = useState(false);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 准备GWP值数据用于弹窗显示
  const gwpData = useMemo(() => {
    const standardProducts = PRODUCT_TYPES.map(product => ({
      type: '标准产品',
      name: product.label,
      gwp: product.gwp,
      defaultFactor: product.defaultFactor,
      category: product.value.startsWith('SF6') ? 'SF6' : 'HFCs/PFCs'
    }));
    
    const customProductsData = customProducts.map(custom => ({
      type: '自定义产品',
      name: custom.name,
      gwp: custom.gwp,
      defaultFactor: custom.defaultFactor,
      category: '自定义'
    }));
    
    return [...standardProducts, ...customProductsData];
  }, [customProducts]);
  
  // 获取所有产品类型（包括自定义产品）
  const getAllProductTypes = () => {
    const customTypes = customProducts.map(custom => ({
      value: `custom-${custom.id}`,
      label: custom.name,
      gwp: custom.gwp,
      defaultFactor: custom.defaultFactor,
      isCustom: true
    }));
    return [...PRODUCT_TYPES, ...customTypes];
  };

  // 保存自定义产品
  const saveCustomProduct = () => {
    const { name, gwp, defaultFactor } = customProductForm;
    
    if (!name.trim() || !gwp.trim()) {
      alert('请填写产品名称和GWP值');
      return;
    }

    const newCustomProduct = {
      id: Date.now(),
      name: name.trim(),
      gwp: parseFloat(gwp),
      defaultFactor: parseFloat(defaultFactor) || 0.5
    };

    setCustomProducts(prev => [...prev, newCustomProduct]);
    setCustomProductForm({ name: '', gwp: '', defaultFactor: '0.5' });
    setShowCustomForm(false);
  };

  // 删除自定义产品
  const removeCustomProduct = (customId) => {
    setCustomProducts(prev => prev.filter(p => p.id !== customId));
  };

  // 添加新产品
  const addNewProduct = useCallback(() => {
    if (!selectedProductType) return;
    
    // 检查该产品类型是否已存在
    const exists = products.some(product => product.productType === selectedProductType);
    if (exists) {
      alert('该产品类型已存在');
      return;
    }
    
    // 检查是否为自定义产品
    let customProductInfo = null;
    if (selectedProductType.startsWith('custom-')) {
      const customId = parseInt(selectedProductType.replace('custom-', ''));
      customProductInfo = customProducts.find(c => c.id === customId);
      if (customProductInfo) {
        customProductInfo = {
          value: selectedProductType,
          label: customProductInfo.name,
          gwp: customProductInfo.gwp,
          defaultFactor: customProductInfo.defaultFactor,
          isCustom: true
        };
      }
    }
    
    const newProduct = initializeProductData(selectedProductType, customProductInfo);
    setProducts(prevProducts => [...prevProducts, newProduct]);
    setSelectedProductType(''); // 重置选择
  }, [products, selectedProductType, customProducts]);
  
  // 移除产品
  const removeProduct = useCallback((productId) => {
    setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
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
    // 处理产品数据计算
    setProducts(prevUnits => {
      let hasChanges = false;
      const updatedUnits = prevUnits.map(unit => {
        if (!unit.data) return unit;
        
        let updatedUnit = { ...unit, data: { ...unit.data } };
        let unitChanged = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的产量
          const productionAmountData = unit.data.productionAmount?.find(m => m.month === month);
          const productionAmountValue = productionAmountData?.value ? parseFloat(productionAmountData.value) : 0;
          
          // 获取当月的排放因子
          const emissionFactorData = unit.data.emissionFactor?.find(m => m.month === month);
          const emissionFactorValue = emissionFactorData?.value ? parseFloat(emissionFactorData.value) : unit.defaultEmissionFactor || 0.5;
          
          // 计算排放量：产量 × 排放因子(%) × GWP值
          const emissionValue = productionAmountValue * emissionFactorValue / 100 * unit.gwpValue;
          
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
  }, [setProducts]);
  
  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, products]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'product') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 使用产品相关设置
    const setState = setProducts;
    const indicators = INDICATORS;
    
    setProducts(prevItems => {
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
            
            // 对于排放因子，设置默认值
            let defaultValue = '';
            if (indicatorKey === 'emissionFactor') {
              defaultValue = item.defaultEmissionFactor || 0.5;
            }
            
            updatedIndicatorData.push({
              month,
              monthName: MONTHS[month - 1],
              value: field === 'value' ? (formattedValue || defaultValue) : '',
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
  }, [setProducts]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'product') => {
    if (!file) return;
    
    const setState = setProducts;
    
    setProducts(prevItems => {
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
  }, [setProducts]);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    products.forEach(product => {
      if (product.data && product.data['emission']) {
        product.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    return total;
  }, [products]);
  
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
          if (indicator.isCalculated) {
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
                  let value = monthData?.value || '';
                  
                  // 为排放因子设置默认值显示
                  if (indicator.key === 'emissionFactor') {
                    if (!value || value === '') {
                      // 使用产品对象的defaultEmissionFactor
                      const defaultFactor = item.defaultEmissionFactor || 0.5;
                      value = defaultFactor;
                    }
                  }
                  
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
                  {indicator.isCalculated ? (
                    formatValue(yearlyValue, indicator.decimalPlaces)
                  ) : (
                    '-' // 非计算值不显示全年值
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
      
      // 计算各产品排放量
      products.forEach(product => {
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>HFCs/PFCs/SF6总排放量</td>
            {totalEmissions.map((value, index) => (
              <td key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                {formatValue(value, 2)}
              </td>
            ))}
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e6f7ff' }}>
              {formatValue(totalYear, 2)}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '16px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
        HFCs/PFCs/SF6 生产过程副产物及逃逸排放
      </h2>
      
      {/* 说明文字 */}
      <div style={{ 
        backgroundColor: '#e8f4fd', 
        border: '1px solid #b3d9ff', 
        borderRadius: '6px', 
        padding: '16px', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: '0', color: '#1976d2' }}>排放计算说明</h3>
          <button
            onClick={() => setShowGWPModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            查看GWP值
          </button>
        </div>
        <p style={{ margin: '12px 0 8px 0', lineHeight: '1.6' }}>
          本模块用于计算HFCs、PFCs和SF6等温室气体在生产过程中的副产物排放及逃逸排放。
        </p>
        <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }}>
          <strong>计算公式：</strong>排放量(tCO₂) = 产量(t) × 排放因子(%) × GWP值
        </p>
        <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }}>
          <strong>排放因子默认值：</strong>一般产品为0.5%，SF6高纯度产品为8%，SF6非高纯度产品为0.2%
        </p>
        <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }}>
          <strong>产品类型：</strong>支持标准HFCs/PFCs/SF6产品（HFC-32、HFC-125、HFC-134a等），以及用户自定义产品
        </p>
        <p style={{ margin: '0', lineHeight: '1.6' }}>
          <strong>自定义产品：</strong>用户可以添加自定义的HFCs/PFCs/SF6产品，指定产品名称、GWP值和默认排放因子
        </p>
      </div>
      
      {/* 产品管理区域 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '12px' }}>产品排放管理</h3>
        
        {/* 自定义产品管理 */}
        <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#495057' }}>自定义产品管理</h4>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showCustomForm ? '取消' : '添加自定义产品'}
            </button>
          </div>
          
          {/* 自定义产品列表 */}
          {customProducts.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>已创建的自定义产品：</p>
              {customProducts.map(custom => (
                <div key={custom.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '14px' }}>
                    {custom.name} (GWP: {custom.gwp}, 默认排放因子: {custom.defaultFactor}%)
                  </span>
                  <button
                    onClick={() => removeCustomProduct(custom.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* 自定义产品表单 */}
          {showCustomForm && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'white', 
              border: '1px solid #dee2e6', 
              borderRadius: '4px' 
            }}>
              <h5 style={{ margin: '0 0 12px 0', color: '#495057' }}>创建新自定义产品</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#495057' }}>
                    产品名称 *
                  </label>
                  <input
                    type="text"
                    value={customProductForm.name}
                    onChange={(e) => setCustomProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例：HFC-1234yf"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#495057' }}>
                    GWP值 *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customProductForm.gwp}
                    onChange={(e) => setCustomProductForm(prev => ({ ...prev, gwp: e.target.value }))}
                    placeholder="例：1300"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#495057' }}>
                    默认排放因子 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customProductForm.defaultFactor}
                    onChange={(e) => setCustomProductForm(prev => ({ ...prev, defaultFactor: e.target.value }))}
                    placeholder="例：0.5"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <button
                  onClick={saveCustomProduct}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  保存
                </button>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                * 必填项。默认排放因子不填写时默认为0.5%
              </p>
            </div>
          )}
        </div>
        
        {/* 添加产品选择器 */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <select 
            value={selectedProductType} 
            onChange={(e) => setSelectedProductType(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '300px'
            }}
          >
            <option value="">选择产品类型</option>
            <optgroup label="标准产品">
              {PRODUCT_TYPES.map(product => (
                <option key={product.value} value={product.value}>
                  {product.label} (GWP: {product.gwp})
                </option>
              ))}
            </optgroup>
            {customProducts.length > 0 && (
              <optgroup label="自定义产品">
                {customProducts.map(custom => (
                  <option key={`custom-${custom.id}`} value={`custom-${custom.id}`}>
                    {custom.name} (GWP: {custom.gwp}) [自定义]
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          
          <button
            onClick={addNewProduct}
            disabled={!selectedProductType}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedProductType ? '#3498db' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedProductType ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            添加{selectedProductType ? (getAllProductTypes().find(p => p.value === selectedProductType)?.label || '产品') : '产品'}
          </button>
        </div>
        
        {/* 产品列表 */}
        {products.map(product => (
          <div key={product.id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '20px', 
            marginBottom: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '16px',
              borderBottom: '1px solid #eee',
              paddingBottom: '12px'
            }}>
              <h4 style={{ margin: 0, color: '#2c3e50' }}>
                {product.productLabel} (GWP: {product.gwpValue})
              </h4>
              <button
                onClick={() => removeProduct(product.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                删除该产品
              </button>
            </div>
            
            {/* 产品数据表格 */}
            {renderVerticalLayoutTable(product)}
          </div>
        ))}
      </div>
      
      {/* 总排放量统计表格 */}
      {renderTotalEmissionTable()}
      
      {/* 总排放量信息 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        backgroundColor: '#d5f4e6', 
        border: '1px solid #2ecc71', 
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#27ae60' }}>
          当前HFCs/PFCs/SF6生产过程总排放量：{formatValue(totalEmission, 2)} tCO₂
        </p>
      </div>
      
      {/* GWP值显示弹窗 */}
      <Modal
        title="各产品类型GWP值"
        open={showGWPModal}
        onCancel={() => setShowGWPModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowGWPModal(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Table
          dataSource={gwpData.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
          scroll={{ y: 400 }}
        >
          <Table.Column 
            title="产品类型" 
            dataIndex="type" 
            key="type"
            width={100}
            render={(text) => (
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '12px',
                fontSize: '12px',
                backgroundColor: text === '标准产品' ? '#e3f2fd' : '#f3e5f5',
                color: text === '标准产品' ? '#1976d2' : '#7b1fa2'
              }}>
                {text}
              </span>
            )}
          />
          <Table.Column 
            title="产品名称" 
            dataIndex="name" 
            key="name"
            width={150}
          />
          <Table.Column 
            title="GWP值" 
            dataIndex="gwp" 
            key="gwp"
            width={80}
            render={(value) => <strong style={{ color: '#e74c3c' }}>{value}</strong>}
          />
          <Table.Column 
            title="默认排放因子 (%)" 
            dataIndex="defaultFactor" 
            key="defaultFactor"
            width={120}
            render={(value) => <span style={{ color: '#27ae60' }}>{value}%</span>}
          />
          <Table.Column 
            title="类别" 
            dataIndex="category" 
            key="category"
            width={100}
            render={(text) => (
              <span style={{ 
                padding: '2px 6px', 
                borderRadius: '8px',
                fontSize: '11px',
                backgroundColor: '#f8f9fa',
                color: '#495057'
              }}>
                {text}
              </span>
            )}
          />
        </Table>
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6c757d' }}>
            <strong>说明：</strong>
          </p>
          <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '12px', color: '#6c757d' }}>
            <li style={{display: 'none'}}>GWP值采用IPCC第五次评估报告(AR5)的100年时间尺度数据</li>
            <li>标准产品的GWP值基于国际标准设定，支持自定义调整</li>
            <li>排放因子默认值：一般产品为0.5%，SF6高纯度产品为8%，SF6非高纯度产品为0.2%</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}

export default HFCsPFCsSF6Emission;