import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Typography, Table, Button, InputNumber, Card, Divider, Upload, message } from 'antd';
import { UploadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 工艺放空排放装置类型及默认排放因子（吨CH4/(年·个)）
const PROCESS_VENTING_DEVICES = [
  // 天然气装置
  { name: '天然气输送-压气站/增压站', factor: 10.05 },
  { name: '天然气输送-计量站/分输站', factor: 13.52 },
  { name: '天然气输送-管线(逆止阀) ', factor: 5.49 },
  { name: '天然气输送-清管站', factor: 0.001 },
];

// CH4逃逸排放装置类型及默认排放因子
// type: 'count'表示按设备个数计算，'volume'表示按输送量计算
const METHANE_ESCAPE_DEVICES = [
  // 原油储运装置
  { name: '原油输送-原油输送管道', factor: 753.29, type: 'volume', unit: '亿吨', factorUnit: '吨CH4/亿吨' },
  // 天然气装置
  { name: '天然气输送-压气站/增压站', factor: 85.05, type: 'count', unit: '个', factorUnit: '吨CH4/(年·个)' },
  { name: '天然气输送-计量站/分输站', factor: 31.5, type: 'count', unit: '个', factorUnit: '吨CH4/(年·个)' },
  { name: '天然气输送-管线(逆止阀) ', factor: 0.85, type: 'count', unit: '个', factorUnit: '吨CH4/(年·个)' },
  { name: '天然气输送-清管站', factor: 0, type: 'count', unit: '个', factorUnit: '吨CH4/(年·个)' },
];

// CH4的全球变暖潜能值（GWP）
const CH4_GWP = 21;

function GasOilStorageEmission({ onEmissionChange }) {
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
      type: device.type,
      count: 0,
      volume: 0,
      factor: device.factor,
      unit: device.unit,
      factorUnit: device.factorUnit,
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
      let emission = 0;
      if (item.factor !== null) {
        if (item.type === 'volume') {
          // 按输送量计算
          emission = item.volume * item.factor * CH4_GWP;
        } else {
          // 按设备个数计算
          emission = item.count * item.factor * CH4_GWP;
        }
      }
      return total + emission;
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
        title: '数量/输送量',
        key: 'quantity',
        render: (text, record, index) => (
          <div>
            <InputNumber
              min={0}
              step={record.type === 'volume' ? 0.01 : 1}
              style={{ width: 120 }}
              value={record.type === 'volume' ? record.volume : record.count}
              onChange={(value) => {
                if (record.type === 'volume') {
                  updateMethaneEscapeData(index, 'volume', value || 0);
                } else {
                  updateMethaneEscapeData(index, 'count', value || 0);
                }
              }}
            />
            <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
              ({record.type === 'volume' ? '亿吨' : '个'})
            </span>
          </div>
        ),
      },
      {
        title: 'CH4逃逸排放因子',
        dataIndex: 'factor',
        key: 'factor',
        render: (text, record, index) => (
          <div>
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: 140 }}
              value={record.factor}
              onChange={(value) => updateMethaneEscapeData(index, 'factor', value)}
              placeholder={record.factor ? `${record.factor}` : '请输入'}
            />
            <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
              ({record.factorUnit})
            </span>
          </div>
        ),
      },
    {
      title: '排放量（吨CO2当量/年）',
      key: 'emission',
      render: (text, record) => {
        let emission = 0;
        if (record.factor !== null) {
          if (record.type === 'volume') {
            // 按输送量计算
            emission = record.volume * record.factor * CH4_GWP;
          } else {
            // 按设备个数计算
            emission = record.count * record.factor * CH4_GWP;
          }
        }
        return emission > 0 ? emission.toFixed(2) : '-';
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
          <li>油气储运环节的工艺放空排放主要源于压气站/增压站、管线（逆止阀） 、计量站/分输站、清管站等的放空活动。</li>
          <li>CH4逃逸排放主要来自原油和天然气输送过程中的逸散和泄漏损失。成品油输送过程中逸散损失很低，因此不要求计算成品油输送的CH4 逃逸排放。</li>
        </ul>
        <Title level={5}>计算说明</Title>
        <ul>
          <li>工艺放空排放：根据油气储运环节各类设施的数量及不同设施的工艺放空排放因子进行计算</li>
          <li>CH4逃逸排放：
            <ul>
              <li>天然气输送设施：根据各类设施的数量及不同设施的CH4逃逸排放因子进行计算</li>
              <li>原油输送管道：根据输送量（亿吨）及排放因子（吨CH4/亿吨）进行计算</li>
            </ul>
          </li>
          <li>排放因子单位：
            <ul>
              <li>天然气输送设施：吨CH4/(年·个)</li>
              <li>原油输送管道：吨CH4/亿吨</li>
            </ul>
            部分装置已提供默认值，可根据实际情况修改
          </li>
          <li>GWP值：CH4的全球变暖潜能值（GWP）取21</li>
          <li>支撑材料：请上传与排放计算相关的支撑资料</li>
        </ul>
      </Card>

      <Card>
        <Title level={5}>1. 油气储运环节工艺放空排放</Title>
        <Text type="secondary">油气储运环节工艺放空CH4排放 = 装置数量（个） * 工艺放空CH4排放因子（吨CH4/(年·个)） * 21（CH4的GWP值）</Text>
        
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
        <Title level={5}>2. 油气储运业务CH4逃逸排放</Title>
        <Text type="secondary">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>天然气输送设施CH4逃逸排放 = 装置数量（个） * CH4逃逸排放因子（吨CH4/(年·个)） * 21（CH4的GWP值）</li>
            <li>原油输送管道CH4逃逸排放 = 输送量（亿吨） * CH4逃逸排放因子（吨CH4/亿吨） * 21（CH4的GWP值）</li>
          </ul>
        </Text>
        
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

export default GasOilStorageEmission;
