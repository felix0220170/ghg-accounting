import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Form, InputNumber, Input, Select, Row, Col, Typography, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { GREENHOUSE_GAS_GWP } from '../config/emissionConstants';

const { Title, Text } = Typography;
const { Option } = Select;

const HFCsPFCsSF6Emission = ({ industry, onEmissionChange }) => {
  // 固定产品列表
  const [fixedProducts] = useState([
    { id: 'hfc32', name: 'HFC-32', gasType: 'HFC-32', emissionFactor: 0.5 },
    { id: 'hfc125', name: 'HFC-125', gasType: 'HFC-125', emissionFactor: 0.5 },
    { id: 'hfc134a', name: 'HFC-134a', gasType: 'HFC-134a', emissionFactor: 0.5 },
    { id: 'hfc143a', name: 'HFC-143a', gasType: 'HFC-143a', emissionFactor: 0.5 },
    { id: 'hfc152a', name: 'HFC-152a', gasType: 'HFC-152a', emissionFactor: 0.5 },
    { id: 'hfc227ea', name: 'HFC-227ea', gasType: 'HFC-227ea', emissionFactor: 0.5 },
    { id: 'hfc236fa', name: 'HFC-236fa', gasType: 'HFC-236fa', emissionFactor: 0.5 },
    { id: 'hfc245fa', name: 'HFC-245fa', gasType: 'HFC-245fa', emissionFactor: 0.5 },
    { id: 'sf6HighPurity', name: '高纯 SF6 (≥99.999%)', gasType: 'SF6', emissionFactor: 8 },
    { id: 'sf6LowPurity', name: '非高纯 SF6 (＜99.999%)', gasType: 'SF6', emissionFactor: 0.2 },
  ]);

  // 用户自定义产品列表
  const [customProducts, setCustomProducts] = useState([]);
  
  // 产品产量数据
  const [productData, setProductData] = useState({});
  
  // 新增产品表单
  const [newProduct, setNewProduct] = useState({
    name: '',
    gasType: '',
    emissionFactor: 0,
  });
  
  // 获取温室气体的GWP值（从常量配置中获取，或使用默认值）
  const getGasGWP = (gasType) => {
    // 直接从导入的常量中获取，或使用默认值
    return GREENHOUSE_GAS_GWP[gasType] || 1; // 默认GWP为1
  };

  // 处理产量变化
  const handleProductionChange = (productId, value) => {
    setProductData(prev => ({
      ...prev,
      [productId]: value || 0
    }));
  };

  // 计算单个产品的排放量
  const calculateProductEmission = (product, production) => {
    const productionAmount = production || 0;
    const emissionAmount = (productionAmount * product.emissionFactor) / 100; // 排放因子是百分比
    const gwp = getGasGWP(product.gasType);
    return {
      emission: emissionAmount,
      co2e: emissionAmount * gwp
    };
  };

  // 计算总排放量
  const totalEmission = useMemo(() => {
    let totalCO2e = 0;
    
    // 计算固定产品排放量
    fixedProducts.forEach(product => {
      const { co2e } = calculateProductEmission(product, productData[product.id]);
      totalCO2e += co2e;
    });
    
    // 计算自定义产品排放量
    customProducts.forEach(product => {
      const { co2e } = calculateProductEmission(product, productData[product.id]);
      totalCO2e += co2e;
    });
    
    return totalCO2e;
  }, [fixedProducts, customProducts, productData]);

  // 当总排放量变化时通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);

  // 添加自定义产品
  const addCustomProduct = () => {
    if (!newProduct.name || !newProduct.gasType || newProduct.emissionFactor <= 0) {
      return;
    }
    
    const product = {
      id: `custom-${Date.now()}`,
      name: newProduct.name,
      gasType: newProduct.gasType,
      emissionFactor: newProduct.emissionFactor,
      isCustom: true
    };
    
    setCustomProducts(prev => [...prev, product]);
    setNewProduct({ name: '', gasType: '', emissionFactor: 0 });
  };

  // 删除自定义产品
  const deleteCustomProduct = (productId) => {
    setCustomProducts(prev => prev.filter(p => p.id !== productId));
    // 同时删除对应的产量数据
    setProductData(prev => {
      const newData = { ...prev };
      delete newData[productId];
      return newData;
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60
    },
    {
      title: '产品',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '排放的温室气体种类',
      dataIndex: 'gasType',
      key: 'gasType'
    },
    {
      title: '排放因子（单位：%）',
      dataIndex: 'emissionFactor',
      key: 'emissionFactor',
      render: (value) => `${value}%`
    },
    {
      title: '产量（单位：吨）',
      key: 'production',
      render: (_, record) => (
        <InputNumber
          min={0}
          placeholder="请输入产量"
          value={productData[record.id] || 0}
          onChange={(value) => handleProductionChange(record.id, value)}
          style={{ width: 150 }}
        />
      )
    },
    {
      title: '排放量（单位：tCO₂e）',
      key: 'emission',
      render: (_, record) => {
        const { co2e } = calculateProductEmission(record, productData[record.id]);
        return co2e.toFixed(4);
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => {
        if (record.isCustom) {
          return (
            <Button
              danger
              size="small"
              onClick={() => deleteCustomProduct(record.id)}
            >
              删除
            </Button>
          );
        }
        return null;
      }
    }
  ];

  // 合并所有产品数据
  const allProducts = [...fixedProducts, ...customProducts];

  return (
    <div className="hfc-pfc-sf6-emission">
      <Title level={4}>HFCs/PFCs/SF6 生产过程副产物及逃逸排放</Title>
      
      <Card style={{ marginBottom: 20 }}>
        <Title level={5}>计算公式</Title>
        <Text>
          排放量（tCO₂e）= 产量（吨）× 排放因子（%）/ 100 × 全球变暖潜能值（GWP）
        </Text>
      </Card>
      
      <Table
        columns={columns}
        dataSource={allProducts}
        pagination={false}
        rowKey="id"
        style={{ marginBottom: 20 }}
      />
      
      <Card title="添加自定义产品" style={{ marginBottom: 20 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Form.Item label="产品名称" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入产品名称"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="温室气体种类" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Input
                value={newProduct.gasType}
                onChange={(e) => setNewProduct(prev => ({ ...prev, gasType: e.target.value }))}
                placeholder="如：HFC-xxx, PFC-xxx, SF6"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="排放因子（%）" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <InputNumber
                min={0}
                max={100}
                value={newProduct.emissionFactor}
                onChange={(value) => setNewProduct(prev => ({ ...prev, emissionFactor: value }))}
                placeholder="请输入排放因子"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addCustomProduct}
              disabled={!newProduct.name || !newProduct.gasType || newProduct.emissionFactor <= 0}
            >
              添加产品
            </Button>
          </Col>
        </Row>
      </Card>
      
      <Card title="排放汇总" type="inner">
        <Row justify="end">
          <Col>
            <Text strong>总排放量：</Text>
            <Text strong style={{ color: '#ff4d4f' }}>{totalEmission.toFixed(4)} tCO₂e</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default HFCsPFCsSF6Emission;