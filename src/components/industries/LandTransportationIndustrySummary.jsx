import { Table, Typography } from 'antd';
import { useState } from 'react';

const { Title } = Typography;

function LandTransportationIndustrySummary({ data, industry, onDataChange }) {
  // 计算基础排放量（不包括电力和热力排放）
  const calculateBaseTotal = () => {
    const baseTotal = (
      (data.fossilFuelEmission || 0) +
      (data.methaneN2OEmission || 0) + // 包含甲烷和氧化亚氮排放量
      (data.tailGasPurificationEmission || 0) // 添加尾气净化过程排放量
    );
    return baseTotal;
  };

  // 计算总排放量（包括电力和热力排放）
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + (data.electricityHeatEmission || 0);
  };

  // 格式化数字显示
  const formatNumber = (value) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value || 0);
  };

  // 表格数据
  const tableData = [
    { key: '1', type: '化石燃料燃烧 CO2 排放', value: data.fossilFuelEmission || 0 },
    { key: '2', type: '化石燃料燃烧甲烷和氧化亚氮排放量', value: data.methaneN2OEmission || 0 },
    { key: '3', type: '尾气净化过程排放量', value: data.tailGasPurificationEmission || 0 },
    { key: '4', type: '净购入电力和热力隐含的 CO2 排放', value: data.electricityHeatEmission || 0 },
  ];

  // 计算两种总计
  const baseTotalEmission = calculateBaseTotal();
  const totalEmissionWithElectricity = calculateTotalWithElectricity();

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
      title: '排放类型',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => <div style={record.style || {}}>{text}</div>,
    },
    {
      title: '排放量（tCO₂e）',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => <div style={record.style || {}}>{formatNumber(text)}</div>,
    },
  ];

  return (
    <div className="industry-summary">
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={4}>计算公式</Title>
        <p><strong>基础排放量（不含电力和热力） = 化石燃料燃烧 CO2 排放 + 化石燃料燃烧甲烷和氧化亚氮排放量 + 尾气净化过程排放量</strong></p>
        <p><strong>总排放量（含电力和热力） = 基础排放量（不含电力和热力） + 净购入电力和热力隐含的 CO2 排放</strong></p>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={summaryData} 
        pagination={false} 
        size="middle"
        className="emission-summary-table"
      />
    </div>
  );
}

export default LandTransportationIndustrySummary;