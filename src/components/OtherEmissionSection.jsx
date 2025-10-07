import React, { useState, useEffect } from 'react';
import { InputNumber, Button, Row, Col, Typography } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * 其他显著存在的排放源添加区域组件
 * 用于在各行业汇总表中添加自定义排放源
 */
function OtherEmissionSection({ initialEmissions = [], onChange }) {
  // 其他显著存在的排放源状态
  const [otherEmissions, setOtherEmissions] = useState(initialEmissions);
  
  // 当initialEmissions变化时更新内部状态
  useEffect(() => {
    setOtherEmissions(initialEmissions);
  }, [initialEmissions]);
  
  // 计算其他排放源总量
  const calculateOtherEmissionTotal = () => {
    return otherEmissions.reduce((total, item) => total + (item.value || 0), 0);
  };

  // 添加其他排放源
  const addOtherEmission = () => {
    const newOtherEmissions = [...otherEmissions, { id: Date.now(), name: '', value: 0 }];
    setOtherEmissions(newOtherEmissions);
    if (onChange) {
      onChange(newOtherEmissions); // 返回完整的排放源数组
    }
  };

  // 移除其他排放源
  const removeOtherEmission = (id) => {
    const newOtherEmissions = otherEmissions.filter(item => item.id !== id);
    setOtherEmissions(newOtherEmissions);
    if (onChange) {
      onChange(newOtherEmissions); // 返回完整的排放源数组
    }
  };

  // 更新其他排放源名称
  const updateOtherEmissionName = (id, name) => {
    const newOtherEmissions = otherEmissions.map(item => 
      item.id === id ? { ...item, name } : item
    );
    setOtherEmissions(newOtherEmissions);
    if (onChange) {
      onChange(newOtherEmissions); // 返回完整的排放源数组
    }
  };

  // 更新其他排放源值
  const updateOtherEmissionValue = (id, value) => {
    const newOtherEmissions = otherEmissions.map(item => 
      item.id === id ? { ...item, value: Number(value) || 0 } : item
    );
    setOtherEmissions(newOtherEmissions);
    if (onChange) {
      onChange(newOtherEmissions); // 返回完整的排放源数组
    }
  };

  const otherEmissionTotal = calculateOtherEmissionTotal();

  return (
    <div className="mb-4" style={{ maxWidth: '900px', margin: '20px 0' }}>
      <Title level={5}>其他显著存在的排放源（如果有）</Title>
      {otherEmissions.length === 0 ? (
        <Text type="secondary">暂无其他显著存在的排放源，点击添加按钮添加</Text>
      ) : (
        <div>
          {otherEmissions.map((emission, index) => (
            <Row key={emission.id} gutter={16} className="mb-2 items-center">
              <Col xs={24} sm={24} md={1}>
                <Button 
                  type="primary" 
                  danger 
                  icon={<MinusOutlined />} 
                  onClick={() => removeOtherEmission(emission.id)}
                  size="small"
                  style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
                />
              </Col>
              {/* 将排放源名称输入框移到左侧 */}
              <Col xs={24} sm={24} md={14}>
                <input 
                  type="text" 
                  className="ant-input" 
                  placeholder={`请输入排放源名称（如：工艺排放源 ${index + 1}）`}
                  value={emission.name}
                  onChange={(e) => updateOtherEmissionName(emission.id, e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={24} md={9}>
                <InputNumber 
                  placeholder="请输入排放量（吨）"  // 添加提示文本
                  onChange={(value) => updateOtherEmissionValue(emission.id, value)}
                  value={emission.value}
                  style={{ width: '100%' }}
                  addonAfter="吨"
                />
              </Col>
            </Row>
          ))}
        </div>
      )}
      {/* 调整添加按钮样式，不再占满宽度 */}
      <div style={{ textAlign: 'left', marginTop: '16px' }}>
        <Button 
          type="primary" 
          onClick={addOtherEmission} 
          icon={<PlusOutlined />}
          style={{ 
            backgroundColor: '#52c41a', 
            borderColor: '#52c41a',
            fontSize: '14px',
            padding: '6px 16px'
          }}
        >
          添加其他显著存在的排放源
        </Button>
      </div>
      {otherEmissionTotal > 0 && (
        <Text type="success" className="ml-2">
          其他排放源总计: {otherEmissionTotal.toFixed(4)} 吨
        </Text>
      )}
    </div>
  );
}

export default OtherEmissionSection;