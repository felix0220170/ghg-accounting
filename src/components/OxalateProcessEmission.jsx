import React, { useState, useEffect } from 'react';
import { Card, InputNumber, Typography, Form, Row, Col } from 'antd';

const { Title, Paragraph } = Typography;

// 工业生产过程中的草酸的CO2排放组件
function OxalateProcessEmission({ industry, onEmissionChange }) {
  // 草酸消耗量（吨）和浓度（%）
  const [oxalateQuantity, setOxalateQuantity] = useState(0);
  const [oxalatePurity, setOxalatePurity] = useState(99.6); // 默认浓度99.6%
  
  // 计算草酸分解的CO2排放量
  const calculateEmission = () => {
    // EF 草酸 = 0.349 × PUR 草酸
    const emissionFactor = 0.349 * (oxalatePurity / 100);
    // E 草酸 = AD 草酸 × EF 草酸
    return oxalateQuantity * emissionFactor;
  };

  // 当输入值变化时，更新排放量并通知父组件
  useEffect(() => {
    const totalEmission = calculateEmission();
    if (onEmissionChange) {
      onEmissionChange({ totalEmission });
    }
  }, [oxalateQuantity, oxalatePurity, onEmissionChange]);

  return (
    <Card title="工业生产过程中的草酸的CO2排放" className="emission-card">
      {/* 计算说明部分 */}
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={4}>计算说明</Title>
        <Paragraph><strong>总排放量计算公式：E 草酸 = AD 草酸 × EF 草酸</strong></Paragraph>
        <Paragraph>其中：</Paragraph>
        <ul>
          <li>E 草酸：草酸分解所导致的过程排放量，单位为吨二氧化碳（tCO2）</li>
          <li>AD 草酸：核算和报告年度内的草酸消耗量，单位为吨（t）</li>
          <li>EF 草酸：草酸分解的二氧化碳排放因子，单位为吨二氧化碳／吨草酸（tCO2／t草酸）</li>
          <li>EF 草酸 = 0.349 × PUR 草酸</li>
          <li>0.349 是二氧化碳与工业草酸的分子量之比</li>
          <li>PUR 草酸：草酸的浓度（含量），采用供货方提供的标称值；如标称值不可得，则采用默认值 <strong>99.6%</strong></li>
        </ul>
      </div>

      {/* 输入表单部分 */}
      <Form layout="vertical">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item 
              label="草酸消耗量（吨）" 
              name="oxalateQuantity"
              tooltip="核算和报告年度内的草酸消耗量"
            >
              <InputNumber
                placeholder="请输入草酸消耗量"
                value={oxalateQuantity}
                onChange={(value) => setOxalateQuantity(value || 0)}
                style={{ width: '100%' }}
                min={0}
                step={0.0001}
                precision={4}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              label="草酸浓度（%）" 
              name="oxalatePurity"
              tooltip="草酸的浓度（含量），默认值为99.6%"
            >
              <InputNumber
                placeholder="请输入草酸浓度，默认99.6%"
                value={oxalatePurity}
                onChange={(value) => setOxalatePurity(value || 99.6)}
                style={{ width: '100%' }}
                min={0}
                max={100}
                step={0.1}
                precision={1}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* 计算结果部分 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
        <Title level={4}>计算结果</Title>
        <Row gutter={[16, 8]}>
          <Col xs={24}>
            <Paragraph>
              <strong>排放因子（EF 草酸）：</strong>
              {((0.349 * (oxalatePurity / 100))).toFixed(6)} tCO2/t草酸
            </Paragraph>
          </Col>
          <Col xs={24}>
            <Paragraph style={{ fontSize: '16px' }}>
              <strong>总排放量（E 草酸）：</strong>
              {calculateEmission().toFixed(4)} tCO₂e
            </Paragraph>
          </Col>
        </Row>
      </div>
    </Card>
  );
}

export default OxalateProcessEmission;