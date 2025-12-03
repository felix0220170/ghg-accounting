import React, { useState, useEffect, useCallback, useRef } from 'react';

// 平均供电排放因子（tCO₂/MW·h）
const AVERAGE_EMISSION_FACTOR = 0.5366;

const TransmissionDistributionEmission = ({ onEmissionChange, industryType }) => {
  // 状态管理 - 使用数字类型存储
  const [formData, setFormData] = useState({
    powerPlantGridAmount: 0, // 电厂上网电量 MW·h
    importedPower: 0, // 自外省输入电量 MW·h
    exportedPower: 0, // 向外省输出电量 MW·h
    soldPower: 0, // 售电量(即终端用户用电量) MW·h
    transmissionDistributionAmount: 0, // 输配电量
    totalEmission: 0 // 总排放量
  });
  
  // 错误状态管理
  const [errors, setErrors] = useState({});
  // 输入焦点状态
  const [focusedField, setFocusedField] = useState(null);

  // 简化的验证逻辑
  const validateInput = (field, value) => {
    const error = {};
    
    // 验证是否为有效数字且非负数
    if (value !== '' && value !== null && (isNaN(Number(value)) || Number(value) < 0)) {
      error[field] = '请输入有效的非负数';
    }
    
    setErrors(prev => ({ ...prev, ...error }));
    return Object.keys(error).length === 0;
  };

  // 计算输配电量 - 不依赖formData整体，而是依赖具体字段
  const calculateTransmissionDistributionAmount = useCallback((
    powerPlantGridAmount,
    importedPower,
    exportedPower,
    soldPower
  ) => {
    const ppgAmount = parseFloat(powerPlantGridAmount) || 0;
    const impPower = parseFloat(importedPower) || 0;
    const expPower = parseFloat(exportedPower) || 0;
    const sPower = parseFloat(soldPower) || 0;
    
    // 输配电量 = 电厂上网电量 + 自外省输入电量 - 向外省输出电量 - 售电量
    const amount = ppgAmount + impPower - expPower - sPower;
    return Math.max(0, amount); // 确保结果不为负
  }, []);

  // 计算总排放量 - 不直接更新formData，而是返回计算结果
  const calculateTotalEmission = useCallback((transmissionDistributionAmount) => {
    // 输配电引起的二氧化碳排放总量 = 输配电量 * 平均供电排放因子(系统配置 0.5366 tCO₂/MW·h)
    return transmissionDistributionAmount * AVERAGE_EMISSION_FACTOR;
  }, []);

  // 简化的表单输入处理 - 直接处理数字并在一个地方更新所有相关状态
  const handleInputChange = (field, value) => {
    // 空值处理
    let numValue = 0;
    if (value !== '' && value !== null) {
      numValue = Number(value);
      
      // 验证
      if (isNaN(numValue) || numValue < 0) {
        setErrors(prev => ({ ...prev, [field]: '请输入有效的非负数' }));
        return;
      }
    }
    
    // 更新表单数据并清除错误
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: numValue
      };
      
      // 计算输配电量和排放量
      const transmissionDistributionAmount = calculateTransmissionDistributionAmount(
        newFormData.powerPlantGridAmount,
        newFormData.importedPower,
        newFormData.exportedPower,
        newFormData.soldPower
      );
      const totalEmission = calculateTotalEmission(transmissionDistributionAmount);
      
      return {
        ...newFormData,
        transmissionDistributionAmount,
        totalEmission
      };
    });
    
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // 为了避免无限循环，我们使用useRef来追踪上一次的排放量
  const previousTotalEmission = useRef(null);
  
  // 使用单独的effect来监听表单数据变化并更新父组件，但只在排放量实际变化时才更新
  useEffect(() => {
    // 仅在排放量实际变化时才更新父组件，避免无限循环
    if (onEmissionChange && previousTotalEmission.current !== formData.totalEmission) {
      // 更新ref以记录当前排放量
      previousTotalEmission.current = formData.totalEmission;
      
      // 回调更新父组件 - 只在组件渲染完成后执行
      onEmissionChange({
        transmissionDistributionEmission: formData.totalEmission,
        ...formData
      });
    }
  }, [formData.totalEmission, onEmissionChange]); // 只监听排放量和回调函数变化

  // 初始化计算
  useEffect(() => {
    // 初始计算一次
    const transmissionDistributionAmount = calculateTransmissionDistributionAmount(
      formData.powerPlantGridAmount,
      formData.importedPower,
      formData.exportedPower,
      formData.soldPower
    );
    const totalEmission = calculateTotalEmission(transmissionDistributionAmount);
    
    setFormData(prev => ({
      ...prev,
      transmissionDistributionAmount,
      totalEmission
    }));
  }, []); // 只在组件挂载时执行一次

  // 输入框样式 - 简化版本
  const getInputStyle = (field) => ({
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${errors[field] ? '#ff4d4f' : '#d9d9d9'}`,
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none'
  });

  // 输入框悬停样式
  const inputHoverStyle = {
    borderColor: '#40a9ff'
  };

  // 计算说明区块样式
  const calculationDescriptionStyle = {
    marginBottom: '24px',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
  };

  // 输入表单区块样式
  const formSectionStyle = {
    marginBottom: '24px',
    padding: '20px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    backgroundColor: '#ffffff'
  };

  // 结果显示区块样式
  const resultSectionStyle = {
    marginBottom: '24px',
    padding: '20px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    backgroundColor: '#ffffff'
  };

  // 结果卡片样式
  const resultCardStyle = {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #d0e9ff',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  return (
    <div className="transmission-distribution-emission" style={{ margin: '0 auto' }}>
      <h3 style={{ 
        marginBottom: '24px', 
        color: '#262626', 
        fontSize: '20px', 
        fontWeight: '600',
        textAlign: 'left'
      }}>输配电引起的二氧化碳排放</h3>

      {/* 计算说明 */}
      <div className="calculation-description" style={calculationDescriptionStyle}>
        <h4 style={{ 
          marginBottom: '16px', 
          color: '#1890ff', 
          fontSize: '16px',
          fontWeight: '600'
        }}>计算说明</h4>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '6px', 
          lineHeight: '1.8',
          fontSize: '14px',
          borderLeft: '4px solid #1890ff'
        }}>
          <p style={{ margin: '8px 0', color: '#333' }}><strong>输配电量计算方法：</strong>输配电量 = 电厂上网电量 + 自外省输入电量 - 向外省输出电量 - 售电量</p>
          <p style={{ margin: '8px 0', color: '#333' }}><strong>排放量计算方法：</strong>总排放量（tCO₂） = 输配电量 × 平均供电排放因子</p>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>- 所有电量单位为兆瓦时（MW·h）</p>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>- 平均供电排放因子为0.5366 tCO₂/MW·h</p>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>- 总排放量单位为吨二氧化碳当量（tCO₂），保留两位小数</p>
        </div>
      </div>

      {/* 输入表单 */}
      <div style={formSectionStyle}>
        <h4 style={{ 
          marginBottom: '16px', 
          color: '#262626', 
          fontSize: '16px',
          fontWeight: '600'
        }}>电量数据输入</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              fontWeight: '500',
              color: '#333'
            }}>电厂上网电量（MW·h）</label>
            <input
              type="number"
              step="any"
              value={formData.powerPlantGridAmount || ''}
              onChange={(e) => handleInputChange('powerPlantGridAmount', e.target.value)}
              placeholder="请输入电厂上网电量"
              style={getInputStyle('powerPlantGridAmount')}
              min="0"
            />
            {errors.powerPlantGridAmount && (
              <div style={{ 
                color: '#ff4d4f', 
                fontSize: '12px', 
                marginTop: '4px'
              }}>
                {errors.powerPlantGridAmount}
              </div>
            )}
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              fontWeight: '500',
              color: '#333'
            }}>自外省输入电量（MW·h）</label>
            <input
              type="number"
              step="any"
              value={formData.importedPower || ''}
              onChange={(e) => handleInputChange('importedPower', e.target.value)}
              placeholder="请输入自外省输入电量"
              style={getInputStyle('importedPower')}
              min="0"
            />
            {errors.importedPower && (
              <div style={{ 
                color: '#ff4d4f', 
                fontSize: '12px', 
                marginTop: '4px'
              }}>
                {errors.importedPower}
              </div>
            )}
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              fontWeight: '500',
              color: '#333'
            }}>向外省输出电量（MW·h）</label>
            <input
              type="number"
              step="any"
              value={formData.exportedPower || ''}
              onChange={(e) => handleInputChange('exportedPower', e.target.value)}
              placeholder="请输入向外省输出电量"
              style={getInputStyle('exportedPower')}
              min="0"
            />
            {errors.exportedPower && (
              <div style={{ 
                color: '#ff4d4f', 
                fontSize: '12px', 
                marginTop: '4px'
              }}>
                {errors.exportedPower}
              </div>
            )}
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              fontWeight: '500',
              color: '#333'
            }}>售电量(即终端用户用电量)（MW·h）</label>
            <input
              type="number"
              step="any"
              value={formData.soldPower || ''}
              onChange={(e) => handleInputChange('soldPower', e.target.value)}
              placeholder="请输入售电量"
              style={getInputStyle('soldPower')}
              min="0"
            />
            {errors.soldPower && (
              <div style={{ 
                color: '#ff4d4f', 
                fontSize: '12px', 
                marginTop: '4px'
              }}>
                {errors.soldPower}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 计算结果显示 */}
      <div style={resultSectionStyle}>
        <h4 style={{ 
          marginBottom: '16px', 
          color: '#1890ff', 
          fontSize: '16px',
          fontWeight: '600'
        }}>计算结果</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div 
            style={{ 
              ...resultCardStyle,
              backgroundColor: '#e6f7ff'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#1890ff',
              fontSize: '14px'
            }}>输配电量（MW·h）</label>
            <div style={{ 
              fontSize: '18px', 
              textAlign: 'center',
              fontWeight: '600',
              color: '#333'
            }}>
              {formData.transmissionDistributionAmount.toFixed(2)}
            </div>
          </div>
          
          <div 
            style={{ 
              ...resultCardStyle,
              backgroundColor: '#fff7e6'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(250, 173, 20, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#fa8c16',
              fontSize: '14px'
            }}>平均供电排放因子（tCO₂/MW·h）</label>
            <div style={{ 
              fontSize: '18px', 
              textAlign: 'center',
              fontWeight: '600',
              color: '#333'
            }}>
              {AVERAGE_EMISSION_FACTOR.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* 排放量汇总 */}
      <div style={{ 
        marginTop: '30px', 
        padding: '24px', 
        border: '2px solid #52c41a', 
        borderRadius: '12px', 
        textAlign: 'center',
        backgroundColor: '#f6ffed',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = '0 8px 24px rgba(82, 196, 26, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = 'none';
      }}>
        <h3 style={{ 
          marginBottom: '16px', 
          color: '#52c41a', 
          fontSize: '18px',
          fontWeight: '600'
        }}>排放量汇总</h3>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#262626' }}>
          输配电引起的二氧化碳排放总量：
          <span style={{ 
            color: '#1890ff', 
            marginLeft: '12px',
            fontSize: '24px'
          }}>
            {formData.totalEmission.toFixed(2)} tCO₂
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransmissionDistributionEmission;
