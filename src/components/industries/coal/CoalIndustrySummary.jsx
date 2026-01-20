import React from 'react';
import { Table } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

const CoalIndustrySummary = ({ emissionData, industry, onDataChange }) => {
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
      calculateEmission('fossilFuelEmission') +
      calculateEmission('torchEmission') + // 煤矿瓦斯火炬燃烧排放
      calculateEmission('mineCH4Emission') + // 井工开采的CH4逃逸排放
      calculateEmission('mineCO2Emission') + // 井工开采的CO2逃逸排放
      calculateEmission('activityCH4Emission') // 露天煤矿和矿后活动的CH4逃逸排放
    );
  };

  // 计算包含电力和热力的总排放量
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + calculateEmission('electricityHeatEmission');
  };

  // 计算CO2e值（用于温室气体排放量列）
  // 注意：在实际组件中，各排放项可能已经是换算后的CO2e值
  const calculateCO2e = (type, value) => {
    return value; // 假设所有值已经是CO2e值
  };

  // 表格数据
  const tableData = [
    {
      key: 'fossil-fuel',
      name: '企业级化石燃料燃烧 CO2 排放',
      value: safeData.fossilFuelEmission || 0,
      co2e: calculateCO2e('fossilFuelEmission', safeData.fossilFuelEmission || 0)
    },
    {
      key: 'torch-emission',
      name: '煤矿瓦斯火炬燃烧排放',
      value: safeData.torchEmission || 0,
      co2e: calculateCO2e('torchEmission', safeData.torchEmission || 0)
    },
    {
      key: 'mine-ch4',
      name: '井工开采的CH4 逃逸排放',
      value: safeData.mineCH4Emission || 0,
      co2e: calculateCO2e('mineCH4Emission', safeData.mineCH4Emission || 0)
    },
    {
      key: 'mine-co2',
      name: '井工开采的CO2 逃逸排放',
      value: safeData.mineCO2Emission || 0,
      co2e: calculateCO2e('mineCO2Emission', safeData.mineCO2Emission || 0)
    },
    {
      key: 'activity-ch4',
      name: '露天煤矿和矿后活动的CH4逃逸排放',
      value: safeData.activityCH4Emission || 0,
      co2e: calculateCO2e('activityCH4Emission', safeData.activityCH4Emission || 0)
    },
    {
      key: 'electricity-heat',
      name: '净购入电力（化石）和热力隐含的 CO2 排放',
      value: safeData.electricityHeatEmission || 0,
      co2e: calculateCO2e('electricityHeatEmission', safeData.electricityHeatEmission || 0)
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
          fontWeight: record.isTotal ? 'bold' : (record.key === 'recycling' ? 'bold' : 'normal'),
          color: record.key === 'recycling' ? '#1890ff' : 'inherit' // 蓝色突出显示回收利用量
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
        if (record.key === 'recycling') {
          return (
            <span style={{
              fontWeight: 'bold',
              color: '#1890ff',
              backgroundColor: '#e6f7ff',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {typeof text === 'number' ? text.toFixed(4) : text}
            </span>
          );
        }
        if (typeof text === 'number') {
          return text.toFixed(4);
        }
        return text;
      }
    },
    {
      title: '温室气体排放量（单位：tCO₂e）',
      dataIndex: 'co2e',
      key: 'co2e',
      render: (text, record) => (
        <span style={{
          fontWeight: record.isTotal ? 'bold' : (record.key === 'recycling' ? 'bold' : 'normal'),
          color: record.key === 'recycling' ? '#1890ff' : 'inherit',
          backgroundColor: record.key === 'recycling' ? '#e6f7ff' : 'transparent',
          padding: record.key === 'recycling' ? '2px 6px' : '0',
          borderRadius: record.key === 'recycling' ? '4px' : '0'
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
        <p><strong>基础排放量（不含电力和热力）</strong> = 企业级化石燃料燃烧CO2排放 + 煤矿瓦斯火炬燃烧排放 + 井工开采的CH4逃逸排放 + 井工开采的CO2逃逸排放 + 露天煤矿和矿后活动的CH4逃逸排放</p>
        <p><strong>总排放量（含电力和热力）</strong> = 基础排放量（不含电力和热力） + 净购入电力（化石）和热力隐含的CO2排放</p>
        <p>注：各排放项均为已换算为CO2e的排放总量</p>
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

export default CoalIndustrySummary;
