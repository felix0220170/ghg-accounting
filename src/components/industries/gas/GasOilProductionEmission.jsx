import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Typography, Table, Button, InputNumber, Card, Divider, Upload, message } from 'antd';
import { UploadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 工艺放空排放装置类型及默认排放因子（吨CH4/(年·个)）
const PROCESS_VENTING_DEVICES = [
  // 原油开采装置
  { name: '原油开采-井口装置', factor: null },
  { name: '原油开采-单井储油装置', factor: 0.22 },
  { name: '原油开采-接转站', factor: 0.11 },
  { name: '原油开采-联合站', factor: 0.45 },
  // 天然气开采装置
  { name: '天然气开采-井口装置', factor: null },
  { name: '天然气开采-集气站', factor: 23.6 },
  { name: '天然气开采-计量/配气站', factor: null },
  { name: '天然气开采-储气站', factor: 10.0 },
];

// CH4逃逸排放装置类型及默认排放因子（吨CH4/(年·个)）
const METHANE_ESCAPE_DEVICES = [
  // 原油开采装置
  { name: '原油开采-井口装置', factor: 0.23 },
  { name: '原油开采-单井储油装置', factor: 0.38 },
  { name: '原油开采-接转站', factor: 0.18 },
  { name: '原油开采-联合站', factor: 1.40 },
  // 天然气开采装置
  { name: '天然气开采-井口装置', factor: 2.50 },
  { name: '天然气开采-集气站', factor: 27.9 },
  { name: '天然气开采-计量/配气站', factor: 8.47 },
  { name: '天然气开采-储气站', factor: 58.37 },
];

// CH4的全球变暖潜能值（GWP）
const CH4_GWP = 21;

function GasOilProductionEmission({ onEmissionChange }) {
  // 防止无限循环的ref
  const previousEmissionRef = useRef(null);
  
  // 工艺放空排放数据状态
  const [processVentingData, setProcessVentingData] = useState(
    PROCESS_VENTING_DEVICES.map(device => ({
      name: device.name,
      count: 0,
      factor: device.factor,
    }))
  );

  // CH4逃逸排放数据状态
  const [methaneEscapeData, setMethaneEscapeData] = useState(
    METHANE_ESCAPE_DEVICES.map(device => ({
      name: device.name,
      count: 0,
      factor: device.factor,
    }))
  );

  // 计算总排放量 - 使用useMemo记忆化计算结果而不是useCallback
  const calculateTotalEmission = useMemo(() => {
    // 计算工艺放空排放总量（吨CO2当量）
    const processVentingTotal = processVentingData.reduce((total, item) => {
      if (item.count > 0 && item.factor !== null) {
        return total + (item.count * item.factor * CH4_GWP);
      }
      return total;
    }, 0);

    // 计算CH4逃逸排放总量（吨CO2当量）
    const methaneEscapeTotal = methaneEscapeData.reduce((total, item) => {
      if (item.count > 0 && item.factor !== null) {
        return total + (item.count * item.factor * CH4_GWP);
      }
      return total;
    }, 0);

    // 总排放量
    return processVentingTotal + methaneEscapeTotal;
  }, [processVentingData, methaneEscapeData]);

  // 当排放量变化时通知父组件
  useEffect(() => {
    const totalEmission = calculateTotalEmission;
    // 使用ref比较，只有当排放量真正变化时才通知父组件，避免无限循环
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(parseFloat(totalEmission.toFixed(2)));
    }
  }, [calculateTotalEmission, onEmissionChange]);

  // 更新工艺放空排放数据
  const updateProcessVentingData = useCallback((index, field, value) => {
    setProcessVentingData(prev => {
      const newData = [...prev];
      newData[index][field] = value;
      return newData;
    });
  }, []);

  // 更新CH4逃逸排放数据
  const updateMethaneEscapeData = useCallback((index, field, value) => {
    setMethaneEscapeData(prev => {
      const newData = [...prev];
      newData[index][field] = value;
      return newData;
    });
  }, []);

  // 示例上传功能
  const handleUpload = () => {
    message.info('上传功能演示：实际项目中需要实现完整的文件上传逻辑');
  };

  // 工艺放空排放表格列配置
  const processVentingColumns = [
    {
      title: '装置类型',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: '装置数量（个）',
      dataIndex: 'count',
      key: 'count',
      render: (text, record, index) => (
        <InputNumber
          min={0}
          style={{ width: 120 }}
          value={record.count}
          onChange={(value) => updateProcessVentingData(index, 'count', value || 0)}
        />
      ),
    },
    {
      title: '工艺放空CH4排放因子（吨CH4/(年·个)）',
      dataIndex: 'factor',
      key: 'factor',
      render: (text, record, index) => (
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: 180 }}
          value={record.factor}
          onChange={(value) => updateProcessVentingData(index, 'factor', value)}
          placeholder={record.factor ? `${record.factor}` : '请输入'}
        />
      ),
    },
    {
      title: '排放量（吨CO2当量/年）',
      key: 'emission',
      render: (text, record) => {
        if (record.count > 0 && record.factor !== null) {
          return (record.count * record.factor * CH4_GWP).toFixed(2);
        }
        return '-';
      },
    },
    {
      title: '支撑材料',
      key: 'upload',
      render: () => (
        <Upload
          name="file"
          action="#"
          showUploadList={false}
          beforeUpload={() => {
            handleUpload();
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} size="small">上传</Button>
        </Upload>
      ),
    },
  ];

  // CH4逃逸排放表格列配置
  const methaneEscapeColumns = [
    {
      title: '装置类型',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: '装置数量（个）',
      dataIndex: 'count',
      key: 'count',
      render: (text, record, index) => (
        <InputNumber
          min={0}
          style={{ width: 120 }}
          value={record.count}
          onChange={(value) => updateMethaneEscapeData(index, 'count', value || 0)}
        />
      ),
    },
    {
      title: 'CH4逃逸排放因子（吨CH4/(年·个)）',
      dataIndex: 'factor',
      key: 'factor',
      render: (text, record, index) => (
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: 180 }}
          value={record.factor}
          onChange={(value) => updateMethaneEscapeData(index, 'factor', value)}
          placeholder={record.factor ? `${record.factor}` : '请输入'}
        />
      ),
    },
    {
      title: '排放量（吨CO2当量/年）',
      key: 'emission',
      render: (text, record) => {
        if (record.count > 0 && record.factor !== null) {
          return (record.count * record.factor * CH4_GWP).toFixed(2);
        }
        return '-';
      },
    },
    {
      title: '支撑材料',
      key: 'upload',
      render: () => (
        <Upload
          name="file"
          action="#"
          showUploadList={false}
          beforeUpload={() => {
            handleUpload();
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} size="small">上传</Button>
        </Upload>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>油气开采业务温室气体排放</Title>
      <Card>
        <Title level={5}>排放说明</Title>
        <ul>
          <li>油气开采业务工艺放空CH4 排放及CH4 逃逸排放主要发生于原油开采中的井口装置、单井储油装置、接转站、联合站及天然气开采中的井口装置、集气站、计量/配气站及储气站等</li>
        </ul>
        <Title level={5}>计算说明</Title>
        <ul>
          <li>工艺放空排放：根据油气开采环节各类设施的数量及不同设施的工艺放空排放因子进行计算</li>
          <li>CH4逃逸排放：根据油气开采环节各类设施的数量及不同设施的CH4逃逸排放因子进行计算</li>
          <li>排放因子单位：吨CH4/(年·个)，部分装置已提供默认值，可根据实际情况修改</li>
          <li>GWP值：CH4的全球变暖潜能值（GWP）取21</li>
          <li>支撑材料：请上传与排放计算相关的支撑资料</li>
        </ul>
      </Card>

      <Card>
        <Title level={5}>1. 油气开采业务工艺放空排放</Title>
        <Text type="secondary">油气开采工艺放空CH4排放 = 装置数量（个） * 工艺放空CH4排放因子（吨CH4/(年·个)） * 21（CH4的GWP值）</Text>
        
        <Table
          dataSource={processVentingData}
          columns={processVentingColumns}
          rowKey="name"
          pagination={false}
          style={{ marginTop: 16 }}
          bordered
        />
      </Card>

      <Divider />

      <Card>
        <Title level={5}>2. 油气开采业务CH4逃逸排放</Title>
        <Text type="secondary">油气开采业务CH4逃逸排放 = 装置数量（个） * CH4逃逸排放因子（吨CH4/(年·个)） * 21（CH4的GWP值）</Text>
        
        <Table
          dataSource={methaneEscapeData}
          columns={methaneEscapeColumns}
          rowKey="name"
          pagination={false}
          style={{ marginTop: 16 }}
          bordered
        />
      </Card>

      <Divider />

      <Card>
        <Title level={5}>排放总量</Title>
        <Row>
          <Col span={8}>
            <Text strong>总排放量（吨CO2当量/年）：</Text>
            <Text type="danger" style={{ fontSize: 20, marginLeft: 10 }}>
              {calculateTotalEmission.toFixed(2)}
            </Text>
          </Col>
        </Row>
      </Card>

      <Divider />

      
    </div>
  );
}

export default GasOilProductionEmission;
