import { Table, Card, InputNumber, Button, Row, Col, Typography, Divider } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;

function SummaryTable({ data, industry, onOtherEmissionChange }) {
  // 其他显著存在的排放源状态
  const [otherEmissions, setOtherEmissions] = useState([]);
  
  // 计算其他排放源总量
  const calculateOtherEmissionTotal = () => {
    return otherEmissions.reduce((total, item) => total + (item.value || 0), 0);
  };

  // 计算基础排放量（不包括电力和热力排放）
  const calculateBaseTotal = () => {
    const baseTotal = (
      (data.fossilFuelEmission || 0) +
      (data.carbonateEmission || 0) +
      ((data.wastewaterTreatmentEmission || 0) - (data.methaneRecoveryEmission || 0)) * 21 -
      (data.co2RecyclingEmission || 0) +
      calculateOtherEmissionTotal() // 添加其他显著存在的排放源
    );
    return baseTotal;
  };

  // 计算总排放量（包括电力和热力排放）
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + (data.electricityHeatEmission || 0);
  };

  // 添加其他排放源
  const addOtherEmission = () => {
    const newOtherEmissions = [...otherEmissions, { id: Date.now(), name: '', value: 0 }];
    setOtherEmissions(newOtherEmissions);
    if (onOtherEmissionChange) {
      onOtherEmissionChange(calculateOtherEmissionTotal());
    }
  };

  // 移除其他排放源
  const removeOtherEmission = (id) => {
    const newOtherEmissions = otherEmissions.filter(item => item.id !== id);
    setOtherEmissions(newOtherEmissions);
    if (onOtherEmissionChange) {
      onOtherEmissionChange(calculateOtherEmissionTotal());
    }
  };

  // 更新其他排放源名称
  const updateOtherEmissionName = (id, name) => {
    const newOtherEmissions = otherEmissions.map(item => 
      item.id === id ? { ...item, name } : item
    );
    setOtherEmissions(newOtherEmissions);
  };

  // 更新其他排放源值
  const updateOtherEmissionValue = (id, value) => {
    const newOtherEmissions = otherEmissions.map(item => 
      item.id === id ? { ...item, value: Number(value) || 0 } : item
    );
    setOtherEmissions(newOtherEmissions);
    if (onOtherEmissionChange) {
      onOtherEmissionChange(calculateOtherEmissionTotal());
    }
  };

  // 格式化数字显示
  const formatNumber = (value) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value || 0);
  };

  // 根据排放类型计算温室气体排放量（CO2e）
  const calculateCO2e = (type, value) => {
    // CH4相关排放需要乘以21的全球变暖潜能值
    if (type.includes('废水厌氧处理 CH4 排放') || type.includes('CH4 回收与销毁量')) {
      return (value || 0) * 21;
    }
    // 其他类型直接使用原始值
    return value || 0;
  };

  // 表格数据
  const tableData = [
    { key: '1', type: '化石燃料燃烧 CO2 排放', value: data.fossilFuelEmission || 0 },
    { key: '2', type: '碳酸盐使用过程 CO2 排放', value: data.carbonateEmission || 0 },
    { key: '3', type: '废水厌氧处理 CH4 排放', value: data.wastewaterTreatmentEmission || 0 },
    { key: '4', type: 'CH4 回收与销毁量', value: data.methaneRecoveryEmission || 0 },
    { key: '5', type: '净购入电力和热力隐含的 CO2 排放', value: data.electricityHeatEmission || 0 },
    // 添加CO2回收利用量（为负值）
    { 
      key: '6', 
      type: 'CO2 回收利用量', 
      value: -(data.co2RecyclingEmission || 0), // 显示为负值
      isRecycling: true 
    },
    // 添加其他显著存在的排放源
    ...otherEmissions.map((item, index) => ({
      key: `other-${item.id}`,
      type: item.name || `其他显著存在的排放源 ${index + 1}`,
      value: item.value || 0,
      isOther: true
    }))
  ];

  // 计算两种总计
  const baseTotalEmission = calculateBaseTotal();
  const totalEmissionWithElectricity = calculateTotalWithElectricity();
  const otherEmissionTotal = calculateOtherEmissionTotal();

  // 添加总计行
  const summaryData = [
    ...tableData,
    // 不包括电力热力排放的总计
    { 
      key: 'total-without-electricity', 
      type: '企业温室气体排放总量（不包括净购入电力和热力隐含的 CO2 排放）', 
      value: baseTotalEmission,
      style: { fontWeight: 'bold', backgroundColor: '#f0f2f5' }
    },
    // 包括电力热力排放的总计
    { 
      key: 'total-with-electricity', 
      type: '企业温室气体排放总量（包括净购入电力和热力隐含的 CO2 排放）', 
      value: totalEmissionWithElectricity,
      style: { fontWeight: 'bold', backgroundColor: '#f0f2f5' }
    }
  ];

  // 定义表格列配置
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '排放量（吨）',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => {
        // 只有CH4相关排放需要显示在排放量列
        if (record.type.includes('废水厌氧处理 CH4 排放') || record.type.includes('CH4 回收与销毁量')) {
          return formatNumber(value);
        }
        // 其他类型排放量列留空
        return '-';
      }
    },
    {
      title: '温室气体排放量（单位：tCO₂e）',
      dataIndex: 'value',
      key: 'co2e',
      render: (value, record) => {
        const co2eValue = calculateCO2e(record.type, value);
        
        // 对CO2回收利用量使用蓝色显示
        if (record.isRecycling) {
          return <span style={{ color: '#1890ff' }}>{formatNumber(co2eValue)}</span>;
        }
        
        // 对其他排放源使用绿色显示
        if (record.isOther) {
          return <span style={{ color: '#52c41a' }}>{formatNumber(co2eValue)}</span>;
        }
        
        return formatNumber(co2eValue);
      }
    }
  ];

  return (
    <>
      {/* 计算公式显示区域 */}
      <Card title="计算公式" className="mb-4">
        <div style={{ lineHeight: 1.8 }}>
          <p><strong>排放量总计（不包括电力和热力） = </strong></p>
          <p style={{ marginLeft: '2em' }}>化石燃料燃烧 CO2 排放 + 碳酸盐使用过程 CO2 排放 + （废水厌氧处理 CH4 排放 - CH4 回收与销毁量） * 21 - CO2 回收利用量 + 其他显著存在的排放源</p>
          <Divider />
          <p><strong>排放量总计（包括电力和热力） = </strong></p>
          <p style={{ marginLeft: '2em' }}>排放量总计（不包括电力和热力） + 净购入电力和热力隐含的 CO2 排放</p>
        </div>
      </Card>
      
      {/* 其他显著存在的排放源添加区域 */}
      <div className="mb-4">
        <Title level={5}>其他显著存在的排放源（如果有）</Title>
        {otherEmissions.length === 0 ? (
          <Text type="secondary">暂无其他显著存在的排放源，点击添加按钮添加</Text>
        ) : (
          <div>
            {otherEmissions.map((emission, index) => (
              <Row key={emission.id} gutter={16} className="mb-2 items-center">
                <Col span={1}>
                  <Button 
                    type="text" 
                    danger 
                    icon={<MinusOutlined />} 
                    onClick={() => removeOtherEmission(emission.id)}
                    size="small"
                  />
                </Col>
                <Col span={10}>
                  <InputNumber 
                    placeholder={`排放源 ${index + 1}`}
                    onChange={(value) => updateOtherEmissionValue(emission.id, value)}
                    value={emission.value}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={12}>
                  <input 
                    type="text" 
                    className="ant-input" 
                    placeholder={`请输入排放源名称（如：${index + 1}）`}
                    value={emission.name}
                    onChange={(e) => updateOtherEmissionName(emission.id, e.target.value)}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
            ))}
          </div>
        )}
        <Button 
          type="dashed" 
          onClick={addOtherEmission} 
          block 
          icon={<PlusOutlined />}
          style={{ marginTop: 8 }}
        >
          添加其他显著存在的排放源
        </Button>
        {otherEmissionTotal > 0 && (
          <Text type="success" className="ml-2">
            其他排放源总计: {otherEmissionTotal.toFixed(4)} 吨
          </Text>
        )}
      </div>
      
      {/* 排放汇总表格 */}
      <Table 
        columns={columns} 
        dataSource={summaryData}
        pagination={false}
        size="small"
        rowStyle={(record) => record.style || {}}
        title={() => <Title level={4}>温室气体排放汇总表</Title>}
      />
    </>
  );
}

export default SummaryTable;