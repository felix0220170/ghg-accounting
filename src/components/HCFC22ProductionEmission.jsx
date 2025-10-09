import React, { useState, useEffect, useMemo } from 'react';
import { Form, InputNumber, Table, Button, Typography, Row, Col, Card, Input, Space } from 'antd';
import { GREENHOUSE_GAS_GWP, MOLECULAR_WEIGHT } from '../config/emissionConstants';

const { Title, Text } = Typography;

// 使用从常量文件导入的值
const HFC23_GWP = GREENHOUSE_GAS_GWP['HFC-23'];
const HFC23_MOLECULAR_WEIGHT = MOLECULAR_WEIGHT['HFC-23'];
const CO2_MOLECULAR_WEIGHT = MOLECULAR_WEIGHT['CO2'];

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

function HCFC22ProductionEmission({ industry = '氟化工企业', onEmissionChange }) {
  // 生产线条目
  const [productionLines, setProductionLines] = useState([
    { id: generateId(), production: 0, generationFactor: 0 }
  ]);
  
  // 总体回收量
  const [recoveryAmount, setRecoveryAmount] = useState(0);
  
  // 销毁装置列表
  const [destructionUnits, setDestructionUnits] = useState([
    { id: generateId(), inputAmount: 0, outputAmount: 0 }
  ]);
  
  // 使用useMemo优化计算函数，避免重复计算
  const calculateLineEmission = useMemo(() => {
    return (line) => line.production * line.generationFactor;
  }, []);
  
  // 计算所有生产线HFC-23排放总量
  const totalHFC23Emission = useMemo(() => {
    return productionLines.reduce((total, line) => {
      return total + line.production * line.generationFactor;
    }, 0);
  }, [productionLines]);
  
  // 计算总销毁量
  const totalDestruction = useMemo(() => {
    return destructionUnits.reduce((total, unit) => {
      return total + (unit.inputAmount - unit.outputAmount);
    }, 0);
  }, [destructionUnits]);
  
  // 计算净HFC-23排放量
  const netHFC23Emission = useMemo(() => {
    return totalHFC23Emission - recoveryAmount - totalDestruction;
  }, [totalHFC23Emission, recoveryAmount, totalDestruction]);
  
  // 计算HFC-23转化的CO2排放量
  const hfc23ToCO2Emission = useMemo(() => {
    return totalDestruction * (CO2_MOLECULAR_WEIGHT / HFC23_MOLECULAR_WEIGHT);
  }, [totalDestruction]);
  
  // 计算最终CO2排放量
  const totalCO2Emission = useMemo(() => {
    return (netHFC23Emission * HFC23_GWP) + hfc23ToCO2Emission;
  }, [netHFC23Emission, hfc23ToCO2Emission]);
  
  // 添加生产线条目
  const handleAddProductionLine = () => {
    setProductionLines([...productionLines, { id: generateId(), production: 0, generationFactor: 0 }]);
  };
  
  // 更新生产线条目
  const handleUpdateProductionLine = (id, field, value) => {
    setProductionLines(productionLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };
  
  // 删除生产线条目
  const handleDeleteProductionLine = (id) => {
    if (productionLines.length > 1) {
      setProductionLines(productionLines.filter(line => line.id !== id));
    }
  };
  
  // 添加销毁装置
  const handleAddDestructionUnit = () => {
    setDestructionUnits([...destructionUnits, { id: generateId(), inputAmount: 0, outputAmount: 0 }]);
  };
  
  // 更新销毁装置
  const handleUpdateDestructionUnit = (id, field, value) => {
    setDestructionUnits(destructionUnits.map(unit => 
      unit.id === id ? { ...unit, [field]: value } : unit
    ));
  };
  
  // 删除销毁装置
  const handleDeleteDestructionUnit = (id) => {
    if (destructionUnits.length > 1) {
      setDestructionUnits(destructionUnits.filter(unit => unit.id !== id));
    }
  };
  
  // 当排放量变化时，通知父组件 - 只在排放量实际变化时才通知
  useEffect(() => {
    if (onEmissionChange) {
      // 避免不必要的更新，只有当排放量大于0或曾经大于0时才更新
      onEmissionChange(totalCO2Emission);
    }
  }, [totalCO2Emission, onEmissionChange]);
  
  // 生产线表格列配置
  const productionLineColumns = useMemo(() => [
    {
      title: 'HCFC-22 产量 (吨)',
      dataIndex: 'production',
      key: 'production',
      render: (_, record) => (
        <InputNumber
          style={{ width: 150 }}
          min={0}
          step={0.01}
          value={record.production}
          onChange={(value) => handleUpdateProductionLine(record.id, 'production', value || 0)}
        />
      )
    },
    {
      title: 'HFC-23 生成因子 (吨HFC-23/吨HCFC-22)',
      dataIndex: 'generationFactor',
      key: 'generationFactor',
      render: (_, record) => (
        <InputNumber
          style={{ width: 200 }}
          min={0}
          step={0.0001}
          value={record.generationFactor}
          onChange={(value) => handleUpdateProductionLine(record.id, 'generationFactor', value || 0)}
        />
      )
    },
    {
      title: 'HFC-23 排放量 (吨)',
      key: 'emission',
      render: (_, record) => (record.production * record.generationFactor).toFixed(4)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        productionLines.length > 1 && (
          <Button danger size="small" onClick={() => handleDeleteProductionLine(record.id)}>删除</Button>
        )
      )
    }
  ], [productionLines]);
  
  // 销毁装置表格列配置
  const destructionUnitColumns = useMemo(() => [
    {
      title: '进入装置HFC-23量 (吨)',
      dataIndex: 'inputAmount',
      key: 'inputAmount',
      render: (_, record) => (
        <InputNumber
          style={{ width: 180 }}
          min={0}
          step={0.01}
          value={record.inputAmount}
          onChange={(value) => handleUpdateDestructionUnit(record.id, 'inputAmount', value || 0)}
        />
      )
    },
    {
      title: '排出的HFC-23量 (吨)',
      dataIndex: 'outputAmount',
      key: 'outputAmount',
      render: (_, record) => (
        <InputNumber
          style={{ width: 180 }}
          min={0}
          step={0.01}
          value={record.outputAmount}
          onChange={(value) => handleUpdateDestructionUnit(record.id, 'outputAmount', value || 0)}
        />
      )
    },
    {
      title: '该装置销毁量 (吨)',
      key: 'destructionAmount',
      render: (_, record) => (record.inputAmount - record.outputAmount).toFixed(4)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        destructionUnits.length > 1 && (
          <Button danger size="small" onClick={() => handleDeleteDestructionUnit(record.id)}>删除</Button>
        )
      )
    }
  ], [destructionUnits]);
  
  return (
    <div className="hcfc22-production-emission">
      <Title level={4}>{industry} - HCFC-22 生产过程 HFC-23 排放</Title>
      
      <Card className="calculation-formula" style={{ marginBottom: 20 }}>
        <Title level={5}>计算公式</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <p><strong>生产线的 HFC-23 排放量 = 生产线的 HCFC-22 产量 × 生产线的 HFC-23 生成因子</strong></p>
          </Col>
          <Col xs={24}>
            <p><strong>总HFC-23 排放量 = 所有生产线HFC-23 排放量总和 - 产品形式回收的HFC-23 量 - HFC-23 销毁装置实际销毁的HFC-23 的量</strong></p>
          </Col>
          <Col xs={24}>
            <p><strong>销毁装置的销毁量 = 进入该销毁装置HFC-23量 - 从该销毁装置出口排出的HFC-23量</strong></p>
          </Col>
          <Col xs={24}>
            <p><strong>最终的CO2排放 = 总HFC-23 排放量 × GWP + 销毁的HFC-23 转化成CO2的排放量</strong></p>
          </Col>
          <Col xs={24}>
            <p><strong>销毁的HFC-23 转化成CO2的排放量 = HFC-23 销毁装置实际销毁的HFC-23 的量 × 44/70</strong></p>
          </Col>
          <Col xs={24}>
            <p>注：HFC-23的GWP值为11700，44为CO2的分子量，70为HFC-23的分子量</p>
          </Col>
        </Row>
      </Card>
      
      {/* 生产线数据表格 */}
      <Card title="HCFC-22 生产线数据" style={{ marginBottom: 20 }}>
        <div className="add-record-section" style={{ marginBottom: 20 }}>
          <Button type="primary" onClick={handleAddProductionLine}>添加生产线</Button>
        </div>
        <Table
          columns={productionLineColumns}
          dataSource={productionLines}
          rowKey="id"
          pagination={false}
          size="small"
        />
        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f5f5f5' }}>
          <Text strong>所有生产线HFC-23排放总量：{totalHFC23Emission.toFixed(4)} 吨</Text>
        </div>
      </Card>
      
      {/* 回收和销毁数据 */}
      <Card title="HFC-23 回收与销毁数据" style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item label="产品形式回收的 HFC-23 量 (吨)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                value={recoveryAmount}
                onChange={(value) => setRecoveryAmount(value || 0)}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Title level={5}>销毁装置数据</Title>
        <div className="add-record-section" style={{ marginBottom: 20 }}>
          <Button type="primary" onClick={handleAddDestructionUnit}>添加销毁装置</Button>
        </div>
        <Table
          columns={destructionUnitColumns}
          dataSource={destructionUnits}
          rowKey="id"
          pagination={false}
          size="small"
        />
        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f5f5f5' }}>
          <Text strong>HFC-23 销毁装置实际销毁总量：{totalDestruction.toFixed(4)} 吨</Text>
        </div>
      </Card>
      
      {/* 排放结果汇总 */}
      <Card title="排放结果汇总">
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <p><strong>总HFC-23排放量（未考虑GWP）：{netHFC23Emission.toFixed(4)} 吨</strong></p>
          </Col>
          <Col xs={24}>
            <p><strong>HFC-23转化为CO2的排放量：{hfc23ToCO2Emission.toFixed(4)} 吨</strong></p>
          </Col>
          <Col xs={24}>
            <div style={{ padding: 15, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
              <Text strong style={{ fontSize: '16px' }}>最终CO2排放量：{totalCO2Emission.toFixed(4)} 吨</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default HCFC22ProductionEmission;