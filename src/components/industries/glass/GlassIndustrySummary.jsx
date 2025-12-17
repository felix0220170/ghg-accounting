import React from 'react';
import { Table } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

const GlassIndustrySummary = ({ emissionData }) => {
  // 确保data不为undefined
  const safeData = emissionData || {};
  
  // 计算各项排放量
  const calculateEmission = (key, conversionFactor = 1) => {
    // 从数据结构中获取排放量，确保不会因为undefined而报错
    return (emissionData[key] || 0) * conversionFactor;
  };

  // 计算基准年总排放量（不包括电力和热力）
  const calculateBaseTotal = () => {
    return (
      calculateEmission('fossilFuelEmission') + // 化石燃料燃烧排放
      calculateEmission('processEmission') + // 原料配料中碳粉氧化的排放
      calculateEmission('carbonateDecompositionEmission') // 原料分解产生的排放
    );
  };

  // 计算包含电力和热力的总排放量
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + calculateEmission('electricityHeatEmission');
  };



  // 表格数据
  const tableData = [
    {
      key: 'fossil-fuel',
      name: '化石燃料燃烧 CO2 排放',
      value: safeData.fossilFuelEmission || 0,
      co2e: safeData.fossilFuelEmission || 0
    },
    {
      key: 'process',
      name: '原料配料中碳粉氧化的排放',
      value: safeData.processEmission || 0,
      co2e: safeData.processEmission || 0
    },
    {
      key: 'carbonate-decomposition',
      name: '原料分解产生的排放',
      value: safeData.carbonateDecompositionEmission || 0,
      co2e: safeData.carbonateDecompositionEmission || 0
    },
    {
      key: 'electricity-heat',
      name: '购入净电（化石）和净热隐含的 CO2 排放',
      value: safeData.electricityHeatEmission || 0,
      co2e: safeData.electricityHeatEmission || 0
    },
    {
      key: 'total-base',
      name: '企业温室气体排放总量（不包括净购入电力和热力隐含的 CO2 排放）',
      value: '-',
      co2e: calculateBaseTotal(),
      isTotal: true
    },
    {
      key: 'total-all',
      name: '企业温室气体排放总量（包括净购入电力和热力隐含的 CO2 排放）',
      value: '-',
      co2e: calculateTotalWithElectricity(),
      isTotal: true
    }
  ];

  // 表格列定义
  const columns = [
    {
      title: '排放项',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ 
          fontWeight: record.isTotal ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      )
    },
    {
      title: '排放量（单位：吨）',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => {
        if (typeof text === 'number') {
          return text.toFixed(4);
        }
        return text;
      }
    },
    {
      title: '温室气体排放量（单位：吨 CO2e）',
      dataIndex: 'co2e',
      key: 'co2e',
      render: (text, record) => (
        <span style={{ 
          fontWeight: record.isTotal ? 'bold' : 'normal'
        }}>
          {typeof text === 'number' ? text.toFixed(4) : text}
        </span>
      )
    }
  ];

  return (
    <div className="summary-table-container">
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>计算公式</Title>
        <p><strong>基础排放量（不含电力和热力）</strong> = 化石燃料燃烧CO2排放 + 原料配料中碳粉氧化的排放 + 原料分解产生的排放</p>
        <p><strong>总排放量（含电力和热力）</strong> = 基础排放量（不含电力和热力） + 购入净电（化石）和净热隐含的CO2排放</p>
      </div>
      
      <Table 
        dataSource={tableData} 
        columns={columns} 
        pagination={false} 
        rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        style={{ marginBottom: '20px' }}
      />
    </div>
  );
};

export default GlassIndustrySummary;
