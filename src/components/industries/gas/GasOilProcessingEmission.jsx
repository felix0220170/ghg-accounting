import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, Typography, Table, InputNumber, Button, Divider, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const { Column } = Table;

// CH4的全球变暖潜能值（GWP）
const CH4_GWP = 21;

// 常量定义
const DEFAULT_CH4_EMISSION_FACTOR = 13.83; // 吨CH4/亿Nm3
const DEFAULT_CH4_ESCAPE_FACTOR = 40.34; // 吨CH4/亿Nm3

// 油气处理业务温室气体排放组件
const GasOilProcessingEmission = ({ onEmissionChange }) => {
  // 防止无限循环的ref
  const previousEmissionRef = useRef(null);
  
  // 天然气处理量（亿Nm3）
  const [gasProcessingVolume, setGasProcessingVolume] = useState(0);
  // 工艺放空CH4排放因子（吨CH4/亿Nm3）
  const [ch4EmissionFactor, setCh4EmissionFactor] = useState(DEFAULT_CH4_EMISSION_FACTOR);
  // CH4逃逸排放因子（吨CH4/亿Nm3）
  const [ch4EscapeFactor, setCh4EscapeFactor] = useState(DEFAULT_CH4_ESCAPE_FACTOR);
  
  // 酸气脱除设备列表
  const [acidGasRemovalDevices, setAcidGasRemovalDevices] = useState([
    {
      id: 1,
      name: '酸气脱除设备1',
      inletGasFlow: 0, // 进口气体流量（万Nm3）
      inletCo2Concentration: 0, // 进口气体中CO2体积浓度（%）
      outletGasFlow: 0, // 出口气体流量（万Nm3）
      outletCo2Concentration: 0, // 出口气体中CO2体积浓度（%）
    },
  ]);

  // 移除不再使用的计算函数，改为使用记忆化结果
  // 这些函数已被记忆化的表格数据和总排放计算结果替代

  // 计算总排放量 - 使用useMemo确保只有依赖项变化时才重新计算
  const calculateTotalEmission = useMemo(() => {
    // 工艺放空CH4排放（CO2当量）
    const ch4VentingEmission = gasProcessingVolume * ch4EmissionFactor * CH4_GWP;
    
    // 酸气脱除设备CO2排放
    const co2Emission = acidGasRemovalDevices.reduce((total, device) => {
      const inletCo2Mass = device.inletGasFlow * (device.inletCo2Concentration / 100) * (44 / 22.4) * 10;
      const outletCo2Mass = device.outletGasFlow * (device.outletCo2Concentration / 100) * (44 / 22.4) * 10;
      return total + (inletCo2Mass - outletCo2Mass);
    }, 0);
    
    // CH4逃逸排放（CO2当量）
    const ch4EscapeEmission = gasProcessingVolume * ch4EscapeFactor * CH4_GWP;
    
    return ch4VentingEmission + co2Emission + ch4EscapeEmission;
  }, [gasProcessingVolume, ch4EmissionFactor, acidGasRemovalDevices, ch4EscapeFactor]);

  // 移除不再需要的直接计算函数，使用记忆化结果代替
  // 注意：calculateCh4Emission、calculateSingleDeviceCo2Emission、calculateTotalCo2Emission、calculateCh4EscapeEmission
  // 这些函数已不再直接调用，而是使用记忆化的表格数据和总排放计算结果

  // 记忆化表格数据源，减少不必要的重新渲染
  const processVentingTableData = useMemo(() => [
    {
      key: 1,
      name: '天然气处理过程工艺放空CH4排放',
      description: '天然气处理过程工艺放空的CH4排放，主要发生在乙二醇脱水装置乙二醇的再生阶段',
      gasProcessingVolume,
      emissionFactor: ch4EmissionFactor,
      unit: '吨CH4/亿Nm3',
      ch4Emission: gasProcessingVolume * ch4EmissionFactor,
      co2Equivalent: gasProcessingVolume * ch4EmissionFactor * CH4_GWP,
    },
  ], [gasProcessingVolume, ch4EmissionFactor]);

  const acidGasDeviceTableData = useMemo(() => {
    return acidGasRemovalDevices.map(device => {
      const inletCo2Mass = device.inletGasFlow * (device.inletCo2Concentration / 100) * (44 / 22.4) * 10;
      const outletCo2Mass = device.outletGasFlow * (device.outletCo2Concentration / 100) * (44 / 22.4) * 10;
      return {
        ...device,
        co2Emission: inletCo2Mass - outletCo2Mass,
      };
    });
  }, [acidGasRemovalDevices]);

  const ch4EscapeTableData = useMemo(() => [
    {
      key: 1,
      name: '天然气处理过程CH4逃逸排放',
      description: '天然气处理过程中无组织泄漏的CH4气体排放',
      gasProcessingVolume,
      escapeFactor: ch4EscapeFactor,
      unit: '吨CH4/亿Nm3',
      escapeEmission: gasProcessingVolume * ch4EscapeFactor * CH4_GWP,
    },
  ], [gasProcessingVolume, ch4EscapeFactor]);

  // 记忆化总工艺放空CO2排放量，减少不必要的重新计算
  const totalCo2EmissionMemoized = useMemo(() => {
    return acidGasRemovalDevices.reduce((total, device) => {
      const inletCo2Mass = device.inletGasFlow * (device.inletCo2Concentration / 100) * (44 / 22.4) * 10;
      const outletCo2Mass = device.outletGasFlow * (device.outletCo2Concentration / 100) * (44 / 22.4) * 10;
      return total + (inletCo2Mass - outletCo2Mass);
    }, 0);
  }, [acidGasRemovalDevices]);

  // 当排放量变化时通知父组件
  useEffect(() => {
    const totalEmission = calculateTotalEmission;
    // 使用ref比较，只有当排放量真正变化时才通知父组件，避免无限循环
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(parseFloat(totalEmission.toFixed(2)));
    }
  }, [calculateTotalEmission, onEmissionChange]);

  // 更新酸气脱除设备数据
  const updateAcidGasDevice = useCallback((id, field, value) => {
    setAcidGasRemovalDevices(prev => {
      return prev.map(device => {
        if (device.id === id) {
          return { ...device, [field]: value };
        }
        return device;
      });
    });
  }, []);

  // 添加新的酸气脱除设备
  const addAcidGasDevice = useCallback(() => {
    setAcidGasRemovalDevices(prev => {
      const newId = Math.max(...prev.map(d => d.id)) + 1;
      return [
        ...prev,
        {
          id: newId,
          name: `酸气脱除设备${newId}`,
          inletGasFlow: 0,
          inletCo2Concentration: 0,
          outletGasFlow: 0,
          outletCo2Concentration: 0,
        },
      ];
    });
  }, []);

  // 删除酸气脱除设备
  const removeAcidGasDevice = useCallback((id) => {
    setAcidGasRemovalDevices(prev => {
      if (prev.length > 1) {
        return prev.filter(device => device.id !== id);
      }
      return prev;
    });
  }, []);

  return (
    <div>
      <Title level={4}>油气处理业务温室气体排放</Title>
      
      <Card>
        <Title level={5}>排放说明</Title>
        <ul style={{lineHeight: '2'}}>
          <li>油气处理业务工艺放空排放主要发生在天然气处理过程中，产生的温室气体包括CH4和CO2</li>
          <li>CH4排放主要发生在乙二醇脱水装置乙二醇的再生阶段</li>
          <li>CO2排放主要发生在酸气脱除（包括胺、膜和分子筛等工艺）和CO2脱除等工艺</li>
          <li>CH4逃逸排放是指天然气处理过程中无组织泄漏的CH4气体</li>
          <li style={{color: '#ff4d4f', fontWeight: 'bold'}}>重要提示：工艺放空CH4排放中的天然气处理量与逃逸排放中的天然气处理量需保持一致</li>
        </ul>
      </Card>

      <Divider />

      <Card>
        <Title level={3}>1. 油气处理业务工艺放空排放</Title>
        
        <Title level={4} style={{marginLeft: '20px'}}>天然气处理过程工艺放空CH4排放</Title>
        <Text type="secondary">天然气处理过程工艺放空CH4排放 = 天然气处理量（亿Nm3） * 工艺放空CH4排放因子（吨CH4/亿Nm3）</Text>
        
        <Table
          dataSource={processVentingTableData}
          columns={[
            {
              title: '排放源',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '说明',
              dataIndex: 'description',
              key: 'description',
            },
            {
              title: '天然气处理量（亿Nm3）',
              dataIndex: 'gasProcessingVolume',
              key: 'gasProcessingVolume',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  step={0.01}
                  value={gasProcessingVolume}
                  onChange={setGasProcessingVolume}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: '工艺放空CH4排放因子',
              dataIndex: 'emissionFactor',
              key: 'emissionFactor',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  step={0.01}
                  value={ch4EmissionFactor}
                  onChange={setCh4EmissionFactor}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: '单位',
              dataIndex: 'unit',
              key: 'unit',
            },
            {
              title: 'CH4排放量（吨CH4）',
              dataIndex: 'ch4Emission',
              key: 'ch4Emission',
              render: (text) => text.toFixed(2),
            },
            {
              title: 'CO2当量（吨CO2当量）',
              dataIndex: 'co2Equivalent',
              key: 'co2Equivalent',
              render: (text) => text.toFixed(2),
            },
            {
              title: '支撑材料',
              key: 'supportMaterial',
              render: () => (
                <Button icon={<UploadOutlined />} type="primary" ghost>
                  上传
                </Button>
              ),
            },
          ]}
          pagination={false}
          bordered
          style={{ marginTop: 16 }}
        />

        <Title level={4} style={{ marginTop: 32, marginLeft: '20px' }}>天然气处理过程工艺放空CO2排放</Title>
        <Text type="secondary">CO2排放量 = （酸气脱除设备进口气体流量 × 进口气体中CO2体积浓度 - 酸气脱除设备出口气体流量 × 出口气体中CO2体积浓度） × 44 / 22.4 × 10</Text>
        
        <Button 
          type="primary" 
          onClick={addAcidGasDevice} 
          style={{ marginTop: 16, marginBottom: 16, marginLeft: 16 }}
        >
          添加酸气脱除设备
        </Button>
        
        <Table key="acidGasRemovalDevicesTable"
          dataSource={acidGasDeviceTableData}
          columns={[
            {
              title: '设备名称',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '进口气体流量（万Nm3）',
              dataIndex: 'inletGasFlow',
              key: 'inletGasFlow',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  step={0.01}
                  value={record.inletGasFlow}
                  onChange={(value) => updateAcidGasDevice(record.id, 'inletGasFlow', value)}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: '进口气体中CO2体积浓度（%）',
              dataIndex: 'inletCo2Concentration',
              key: 'inletCo2Concentration',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  max={100}
                  step={0.01}
                  value={record.inletCo2Concentration}
                  onChange={(value) => updateAcidGasDevice(record.id, 'inletCo2Concentration', value)}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: '出口气体流量（万Nm3）',
              dataIndex: 'outletGasFlow',
              key: 'outletGasFlow',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  step={0.01}
                  value={record.outletGasFlow}
                  onChange={(value) => updateAcidGasDevice(record.id, 'outletGasFlow', value)}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: '出口气体中CO2体积浓度（%）',
              dataIndex: 'outletCo2Concentration',
              key: 'outletCo2Concentration',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  max={100}
                  step={0.01}
                  value={record.outletCo2Concentration}
                  onChange={(value) => updateAcidGasDevice(record.id, 'outletCo2Concentration', value)}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: 'CO2排放量（吨CO2）',
              dataIndex: 'co2Emission',
              key: 'co2Emission',
              render: (text) => text.toFixed(2),
            },
            {
              title: '支撑材料',
              key: 'supportMaterial',
              render: () => (
                <Button icon={<UploadOutlined />} type="primary" ghost>
                  上传
                </Button>
              ),
            },
            {title: '操作',
              key: 'action',
              render: (text, record) => (
                acidGasRemovalDevices.length > 1 && (
                  <Button 
                    danger 
                    onClick={() => removeAcidGasDevice(record.id)}
                  >
                    删除
                  </Button>
                )
              ),
            },
          ]}
          pagination={false}
          bordered
          style={{ marginTop: 16 }}
        />

        <Row style={{ marginTop: 16 }}>
          <Col span={12}>
            <Text strong>总工艺放空CO2排放量（吨CO2）：</Text>
            <Text type="danger" style={{ fontSize: 16, marginLeft: 10 }}>
              {totalCo2EmissionMemoized.toFixed(2)}
            </Text>
          </Col>
        </Row>
      </Card>

      <Divider />

      <Card>
        <Title level={3}>2. 油气处理业务CH4逃逸排放</Title>
        <Text type="secondary">天然气处理过程CH4逃逸排放 = 天然气处理量（亿Nm3） * 工艺放空CH4逃逸排放因子（吨CH4/亿Nm3） * {CH4_GWP}（CH4的GWP值）</Text>
        
        <Table
          dataSource={ch4EscapeTableData}
          columns={[
            {
              title: '排放源',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '说明',
              dataIndex: 'description',
              key: 'description',
            },
            {
              title: '天然气处理量（亿Nm3）',
              dataIndex: 'gasProcessingVolume',
              key: 'gasProcessingVolume',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  step={0.01}
                  value={gasProcessingVolume}
                  onChange={setGasProcessingVolume}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: 'CH4逃逸排放因子',
              dataIndex: 'escapeFactor',
              key: 'escapeFactor',
              render: (text, record) => (
                <InputNumber
                  min={0}
                  step={0.01}
                  value={ch4EscapeFactor}
                  onChange={setCh4EscapeFactor}
                  style={{ width: 150 }}
                />
              ),
            },
            {
              title: '单位',
              dataIndex: 'unit',
              key: 'unit',
            },
            {
              title: 'CH4逃逸排放量（吨CO2当量）',
              dataIndex: 'escapeEmission',
              key: 'escapeEmission',
              render: (text) => text.toFixed(2),
            },
            {
              title: '支撑材料',
              key: 'supportMaterial',
              render: () => (
                <Button icon={<UploadOutlined />} type="primary" ghost>
                  上传
                </Button>
              ),
            },
          ]}
          pagination={false}
          bordered
          style={{ marginTop: 16 }}
        />
      </Card>

      <Divider />

      <Card>
        <Title level={5}>排放总量</Title>
        <Row>
          <Col span={12}>
            <Text strong>总排放量（吨CO2当量/年）：</Text>
            <Text type="danger" style={{ fontSize: 20, marginLeft: 10 }}>
              {calculateTotalEmission.toFixed(2)}
            </Text>
          </Col>
        </Row>
        
        <Row style={{ marginTop: 16 }}>
          <Col span={8}>
            <Text>工艺放空CH4排放（CO2当量）：</Text>
            <Text type="danger"> {processVentingTableData[0].co2Equivalent.toFixed(2)} </Text>
          </Col>
          <Col span={8}>
            <Text>工艺放空CO2排放：</Text>
            <Text type="danger"> {totalCo2EmissionMemoized.toFixed(2)} </Text>
          </Col>
          <Col span={8}>
            <Text>CH4逃逸排放（CO2当量）：</Text>
            <Text type="danger"> {ch4EscapeTableData[0].escapeEmission.toFixed(2)} </Text>
          </Col>
        </Row>
      </Card>

      <Divider />

      <Card>
        <Title level={5}>计算说明</Title>
        <ul>
          <li>工艺放空CH4排放：根据天然气处理量和工艺放空CH4排放因子计算</li>
          <li>工艺放空CO2排放：根据酸气脱除设备的进口、出口气体流量及CO2体积浓度计算</li>
          <li>CH4逃逸排放：根据天然气处理量和CH4逃逸排放因子计算</li>
          <li>排放因子单位：吨CH4/亿Nm3，已提供默认值，可根据实际情况修改</li>
          <li>GWP值：CH4的全球变暖潜能值（GWP）取{CH4_GWP}</li>
          <li>支撑材料：请上传与排放计算相关的支撑资料</li>
        </ul>
      </Card>
    </div>
  );
};

export default GasOilProcessingEmission;