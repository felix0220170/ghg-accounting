import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, InputNumber, Input, Form, Button, Table, Card, Typography, message } from 'antd';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 天然气井无阻放空排放计算指标
const GAS_INDICATORS = [
  {
    key: 'initialStock',
    name: '期初库存量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2,
    isFullYear: true
  },
  {
    key: 'finalStock',
    name: '期末库存量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2,
    isFullYear: true
  },
  {
    key: 'purchaseAmount',
    name: '购入量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2,
    isFullYear: true
  },
  {
    key: 'saleAmount',
    name: '向外售出量',
    unit: 't',
    isCalculated: false,
    decimalPlaces: 2,
    isFullYear: true
  },
  {
    key: 'emissionFactor',
    name: 'CO₂质量排放系数',
    unit: 'CO₂/t',
    isCalculated: false,
    decimalPlaces: 4,
    readOnly: true
  },
  {
    key: 'emission',
    name: '排放量',
    unit: 'tCO₂',
    isCalculated: true,
    decimalPlaces: 2,
    isFullYear: true,
    getValue: (data) => {
      const { initialStock, finalStock, saleAmount, emissionFactor, purchaseAmount } = data;
      return ((initialStock + purchaseAmount - finalStock - saleAmount) * emissionFactor).toFixed(2);
    }
  }
];

// 创建初始的指标数据（纵向布局）
const createInitialIndicatorData = () => {
  const indicators = GAS_INDICATORS;
  
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

// 为天然气井初始化数据（纵向布局）
const initializeGasData = (wellNumber, gasInfo = null) => {
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
  
  // 如果提供了气体信息，设置默认的排放因子值
  if (gasInfo && gasInfo.emissionFactor) {
    // 为每个月的排放因子设置默认值
    initialData.emissionFactor = initialData.emissionFactor.map(item => ({
      ...item,
      value: gasInfo.emissionFactor
    }));
  }
  
  return {
    id: `gas-${Date.now()}`,
    wellNumber: wellNumber,
    name: `保护气 ${wellNumber}`,
    // 存储气体信息
    gasInfo: gasInfo ? {
      co2VolumePercentage: gasInfo.co2VolumePercentage,
      components: gasInfo.components || [],
      emissionFactor: gasInfo.emissionFactor
    } : null,
    data: initialData,
    files: {}
  };
};

function MachineryWeldingCO2Emission({ onEmissionChange }) {
  // 保护气列表状态
  const [gasProtections, setGasProtections] = useState([]);
  
  // 保存上一次的总排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 弹出框相关状态
  const [isAddGasModalVisible, setIsAddGasModalVisible] = useState(false);
  const [modalComponents, setModalComponents] = useState([]);
  const [co2VolumePercentage, setCo2VolumePercentage] = useState(null);
  const [calculatedEmissionFactor, setCalculatedEmissionFactor] = useState(null);
  const [modalForm] = Form.useForm();
  
  // 添加新的保护气
  const addNewGasProtection = useCallback((newRecord) => {
    const newProtectionNumber = gasProtections.length + 1;
    
    const newGasProtection = initializeGasData(newProtectionNumber, newRecord);
    setGasProtections(prevProtections => [...prevProtections, newGasProtection]);
  }, [gasProtections]);
  
  // 移除保护气
  const removeGasProtection = useCallback((protectionId) => {
    setGasProtections(prevProtections => prevProtections.filter(protection => protection.id !== protectionId));
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
    // 处理保护气数据计算
    setGasProtections(prevProtections => {
      let hasChanges = false;
      const updatedProtections = prevProtections.map(protection => {
        if (!protection.data) return protection;
        
        let updatedProtection = { ...protection, data: { ...protection.data } };
        let changed = false;
        
        // 计算各月份的排放量
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = monthIndex + 1;
          
          // 获取当月的初始库存
          const initialStockData = protection.data.initialStock?.find(m => m.month === month);
          const initialStockValue = initialStockData?.value ? parseFloat(initialStockData.value) : 0;

          // 获取当月的期末库存
          const finalStockData = protection.data.finalStock?.find(m => m.month === month);
          const finalStockValue = finalStockData?.value ? parseFloat(finalStockData.value) : 0;

          // 获取当月的采购量
          const purchaseAmountData = protection.data.purchaseAmount?.find(m => m.month === month);
          const purchaseAmountValue = purchaseAmountData?.value ? parseFloat(purchaseAmountData.value) : 0;

          const saleAmountData = protection.data.saleAmount?.find(m => m.month === month);
          const saleAmountValue = saleAmountData?.value ? parseFloat(saleAmountData.value) : 0;

          const emissionFactorData = protection.data.emissionFactor?.find(m => m.month === month);
          const emissionFactorValue = emissionFactorData?.value ? parseFloat(emissionFactorData.value) : 0;
          
          // 计算排放量：采购量 + 期初库存 - 期末库存 - 销售量 * 排放系数
          const emissionValue = (purchaseAmountValue + initialStockValue - finalStockValue - saleAmountValue) * emissionFactorValue;
          
          // 更新排放量数据
          const currentEmissionData = updatedProtection.data.emission || [];
          const emissionMonthIndex = currentEmissionData.findIndex(m => m.month === month);
          const newEmissionData = [...currentEmissionData];
          
          if (emissionMonthIndex !== -1) {
            // 只有当值真正改变时才更新
            const currentValue = newEmissionData[emissionMonthIndex].value;
            if (parseFloat(currentValue) !== emissionValue) {
              newEmissionData[emissionMonthIndex] = {
                ...newEmissionData[emissionMonthIndex],
                value: emissionValue,
                unit: 'tCO₂'
              };
              changed = true;
            }
          } else if (emissionValue > 0) {
            // 确保排放量大于0时才添加新数据
            newEmissionData.push({
              month,
              monthName: MONTHS[monthIndex],
              value: emissionValue,
              unit: 'tCO₂'
            });
            changed = true;
          }
          
          // 应用更新
          updatedProtection = {
            ...updatedProtection,
            data: {
              ...updatedProtection.data,
              emission: newEmissionData
            }
          };
        }
        
        if (changed) {
          hasChanges = true;
          return updatedProtection;
        }
        
        return protection;
      });
      
      return hasChanges ? updatedProtections : prevProtections;
    });
  }, [setGasProtections]);

  // 计算CO2质量排放系数
  const calculateCO2EmissionFactor = useCallback(() => {
    if (co2VolumePercentage === null || co2VolumePercentage === undefined || modalComponents.length === 0) {
      return;
    }

    // 计算所有气体体积百分比 * 摩尔质量的总和
    let totalWeight = 0;
    
    // 添加CO2本身的部分 (CO2摩尔质量 = 44 g/mol)
    totalWeight += co2VolumePercentage * 44;
    
    // 添加其他气体成分
    modalComponents.forEach(component => {
      if (component.volumePercentage && component.molarMass) {
        totalWeight += component.volumePercentage * component.molarMass;
      }
    });

    // 计算CO2质量排放系数
    if (totalWeight > 0) {
      const emissionFactor = parseFloat(((co2VolumePercentage * 44) / totalWeight).toFixed(4));

      // 创建新记录
      setCalculatedEmissionFactor(emissionFactor);
    }
  }, [co2VolumePercentage, modalComponents]);

  // 计算单个保护气CO2排放量
  const calculateEmission = useCallback((netUsage, emissionFactor) => {
    return netUsage * emissionFactor;
  }, []);

  // 显示添加保护气弹出框
  const showAddGasModal = useCallback(() => {
    setIsAddGasModalVisible(true);
    // 重置表单和相关状态
    modalForm.resetFields();
    setModalComponents([]);
    setCo2VolumePercentage(null);
    setCalculatedEmissionFactor(null);
  }, [modalForm]);

  // 关闭添加保护气弹出框
  const handleCancelAddGas = useCallback(() => {
    setIsAddGasModalVisible(false);
    modalForm.resetFields();
    setModalComponents([]);
    setCo2VolumePercentage(null);
    setCalculatedEmissionFactor(null);
  }, [modalForm]);

  // 在弹出框中添加气体成分
  const handleAddModalComponent = useCallback(() => {
    const newComponent = {
      id: Date.now(),
      gasName: '',
      volumePercentage: null,
      molarMass: null
    };
    setModalComponents(prev => [...prev, newComponent]);
  }, []);

  // 更新弹出框中气体成分
  const handleUpdateModalComponent = useCallback((id, field, value) => {
    setModalComponents(prev => 
      prev.map(component => 
        component.id === id 
          ? { ...component, [field]: value }
          : component
      )
    );
  }, []);

  // 删除弹出框中气体成分
  const handleDeleteModalComponent = useCallback((id) => {
    setModalComponents(prev => prev.filter(component => component.id !== id));
  }, []);

  // 提交添加保护气记录
  const handleSubmitAddGas = useCallback(async () => {
    try {
      const values = await modalForm.validateFields();
      const { co2VolumePercentage } = values;

      // 计算CO2质量排放系数
      let totalWeight = 0;
      
      // 添加CO2本身的部分 (CO2摩尔质量 = 44 g/mol)
      totalWeight += co2VolumePercentage * 44;
      
      // 添加其他气体成分
      modalComponents.forEach(component => {
        if (component.volumePercentage && component.molarMass) {
          totalWeight += component.volumePercentage * component.molarMass;
        }
      });

      if (totalWeight <= 0) {
        message.error('请至少输入一个有效的气体成分');
        return;
      }

      const emissionFactor = parseFloat(((co2VolumePercentage * 44) / totalWeight).toFixed(4));
      

      // 创建新记录
      const newRecord = {
        co2VolumePercentage,
        components: [...modalComponents],
        emissionFactor
      };

      addNewGasProtection(newRecord);

      // 这里可以添加将记录保存到状态的逻辑
      message.success('保护气记录添加成功');
      handleCancelAddGas();
    } catch (error) {
      console.log('表单验证失败:', error);
    }
  }, [modalForm, modalComponents, handleCancelAddGas, addNewGasProtection]);

  // 监听CO2体积百分比和气体成分变化，自动计算排放系数
  useEffect(() => {
    if (co2VolumePercentage !== null && co2VolumePercentage !== undefined && modalComponents.length > 0) {
      calculateCO2EmissionFactor();
    }
  }, [co2VolumePercentage, modalComponents, calculateCO2EmissionFactor]);

  // 当数据变化时，更新计算值
  useEffect(() => {
    updateCalculatedValues();
  }, [updateCalculatedValues, gasProtections]);
  
  // 处理数据变化（纵向布局）
  const handleDataChange = useCallback((id, indicatorKey, month, field, value, type = 'gas-protection') => {
    // 不进行格式化，直接使用原始输入值
    const formattedValue = value || '';
    
    // 使用保护气相关设置
    const setState = setGasProtections;
    const indicators = GAS_INDICATORS;
    
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
  }, [setGasProtections]);
  
  // 处理文件上传
  const handleFileUpload = useCallback((id, indicatorKey, month, file, type = 'carbonate-product') => {
    if (!file) return;
    
    const setState = setGasProtections;
    
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
            const indicatorDefinition = GAS_INDICATORS.find(ind => ind.key === indicatorKey);
            
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
  }, [setGasProtections]);
  
  // 计算总排放量（全年）
  const totalEmission = useMemo(() => {
    let total = 0;
    
    gasProtections.forEach(protection => {
      if (protection.data && protection.data['emission']) {
        protection.data['emission'].forEach(monthData => {
          total += parseFloat(monthData.value) || 0;
        });
      }
    });
    
    return total;
  }, [gasProtections]);
  
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
    
    const indicators = GAS_INDICATORS;
    
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
      
      // 计算各天然气保护措施排放量
      gasProtections.forEach(protection => {
        if (protection.data && protection.data['emission']) {
          const emissionData = protection.data['emission'];
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
            <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>排放总量</td>
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
      <h2 style={{ marginBottom: '24px', fontSize: '20px', color: '#333' }}>二氧化碳气体保护焊产生的CO₂排放</h2>

      {/* 添加保护气弹出框 */}
      <Modal
        title="添加保护气记录"
        visible={isAddGasModalVisible}
        onCancel={handleCancelAddGas}
        width={'800px'}
        footer={[
          <Button key="cancel" onClick={handleCancelAddGas}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitAddGas}>
            确认添加
          </Button>
        ]}
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item
            name="co2VolumePercentage"
            label="CO₂体积浓度 (%)"
            rules={[{ required: true, message: '请输入CO₂体积浓度' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入CO₂体积百分比"
              min={0}
              max={100}
              precision={2}
              onChange={(value) => setCo2VolumePercentage(value)}
            />
          </Form.Item>
        </Form>

        <div style={{ marginTop: '20px' }}>
          <h4>混合气体成分</h4>
          <Button type="dashed" onClick={handleAddModalComponent} style={{ marginBottom: '16px' }}>
            添加其他气体成分
          </Button>

          {modalComponents.map((component, index) => (
            <div key={component.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '4px' }}>气体名称</label>
                  <Input
                    placeholder="请输入气体名称"
                    value={component.gasName}
                    onChange={(e) => handleUpdateModalComponent(component.id, 'gasName', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px' }}>体积百分比 (%)</label>
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="体积百分比"
                    min={0}
                    max={100}
                    precision={2}
                    value={component.volumePercentage}
                    onChange={(value) => handleUpdateModalComponent(component.id, 'volumePercentage', value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px' }}>摩尔质量 (g/mol)</label>
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="摩尔质量"
                    min={0}
                    precision={2}
                    value={component.molarMass}
                    onChange={(value) => handleUpdateModalComponent(component.id, 'molarMass', value)}
                  />
                </div>
                <div>
                  <Button
                    type="text"
                    danger
                    onClick={() => handleDeleteModalComponent(component.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h4>CO₂质量排放系数计算结果：</h4>
            <p><strong>公式：</strong> (CO₂体积百分比 × 44) / Σ(各气体体积百分比 × 摩尔质量)</p>
            <p><strong>CO₂质量排放系数：</strong> {calculatedEmissionFactor ? calculatedEmissionFactor.toFixed(4) : '0'} CO₂/t</p>
          </div>
        </div>
      </Modal>

      {/* 天然气井 */}
      <div style={{ marginTop: '20px',marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.2' }}>
            <h3 style={{ marginBottom: '12px' }}>排放说明</h3>
            <p>企业工业生产中，使用二氧化碳气体保护焊焊接过程中CO2保护气直接排放到空气中</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>需要上传的数据列表：</h4>
            <p>- 期初库存量（t）：来自企业台账记录</p>
            <p>- 期末库存量（t）：来自企业台账记录</p>
            <p>- 购入量（t）：来自电焊保护气购售结算凭证</p>
            <p>- 向外售出量（t）：来自电焊保护气购售结算凭证</p>
            <p>- CO₂体积百分比（%）：来自保护气瓶标识或供应商提供</p>
            <p>- 其他气体成分及摩尔质量：来自保护气瓶标识或供应商提供</p>
            <h3 style={{ marginBottom: '12px' }}>计算说明</h3>
            <p>气体保护焊的CO₂排放计算方法：排放量（tCO₂） = 保护气用量（t） × CO₂质量排放系数（tCO₂/t）</p>
            <p>- 保护气用量单位为 t，保留两位小数</p>
            <p>- CO₂质量排放系数单位为 tCO₂/t，保留四位小数</p>
            <p>- 排放量单位为 tCO₂，保留两位小数</p>
            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>系数说明：</h4>
            <p>- 44：CO₂的摩尔质量（g/mol），用于CO₂质量转换</p>
            <p>- CO₂质量排放系数 = (CO₂体积百分比 × 44) ÷ Σ(各气体体积百分比 × 各气体摩尔质量)</p>
            <p>- 保护气用量 = 期初库存 + 购入量 - 期末库存 - 向外售出量</p>
          </div>
        </div>

        {renderTotalEmissionTable()}

        <div style={{ marginTop: '24px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>添加电焊保护气排放记录</h3>

          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '16px', alignItems: 'end' }}>
            <button
              onClick={showAddGasModal}
              style={{
                padding: '8px 16px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              添加保护气记录
            </button>
          </div>
        </div>
        <div>
          {gasProtections.map((item, index) => (
            <div key={item.id} style={{ marginBottom: '32px', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', marginRight: '16px' }}>电焊保护气 {index + 1}</h3>
                  {item.gasInfo?.co2VolumePercentage && (
                    <div style={{ fontSize: '12px', color: '#666', marginRight: '12px' }}>
                      CO₂体积百分比: {item.gasInfo.co2VolumePercentage}%
                    </div>
                  )}
                  {item.gasInfo?.components?.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      气体成分: {item.gasInfo.components.map(comp => `${comp.gasName}(${comp.volumePercentage}%)`).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeGasProtection(item.id)}
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
              
              {renderVerticalLayoutTable(item)}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default MachineryWeldingCO2Emission;