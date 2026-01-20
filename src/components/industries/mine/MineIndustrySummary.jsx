import React from 'react';
import { Table } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

const MineIndustrySummary = ({ emissionData, industry, onDataChange }) => {
  // 确保data不为undefined
  const safeData = emissionData || {};
  
  // 计算各项排放量
  const calculateEmission = (key, conversionFactor = 1) => {
    // 从数据结构中获取排放量，确保不会因为undefined而报错
    return (safeData[key] || 0) * conversionFactor;
  };

  // 计算基准年总排放量（不包括电力和热力）
  const calculateBaseTotal = () => {
    return (
      calculateEmission('fossilFuelEmission') +  // 化石燃料燃烧排放
      calculateEmission('carbonateDecompositionEmission') -  // 碳酸盐分解排放
      calculateEmission('carbonationCO2Absorption')  // 碳化工艺吸收的CO₂量（扣除项）
    );
  };

  // 计算包含电力和热力的总排放量
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + calculateEmission('electricityHeatEmission');
  };

  // 计算CO2e值（用于温室气体排放量列）
  // 注意：在实际组件中，methaneN2OEmission可能已经是换算后的CO2e值
  const calculateCO2e = (type, value) => {
    return value; // 假设所有值已经是CO2e值
  };

  // 表格数据
  const tableData = [
    {
      key: 'fossil-fuel',
      name: '化石燃料燃烧排放',
      value: safeData.fossilFuelEmission || 0,
      co2e: calculateCO2e('fossilFuelEmission', safeData.fossilFuelEmission || 0)
    },
    {
      key: 'carbonate-decomposition',
      name: '碳酸盐分解排放',
      value: safeData.carbonateDecompositionEmission || 0,
      co2e: calculateCO2e('carbonateDecompositionEmission', safeData.carbonateDecompositionEmission || 0)
    },
    {
      key: 'carbonation-CO2',
      name: '碳化工艺吸收的CO₂量',
      value: safeData.carbonationCO2Absorption || 0,
      co2e: calculateCO2e('carbonationCO2Absorption', safeData.carbonationCO2Absorption || 0)
    },
    {
      key: 'electricity-heat',
      name: '净购入电力和热力隐含的CO₂排放',
      value: safeData.electricityHeatEmission || 0,
      co2e: calculateCO2e('electricityHeatEmission', safeData.electricityHeatEmission || 0)
    },
    {
      key: 'total-base',
      name: '企业温室气体排放总量（不包括净购入电力和热力隐含的CO₂排放）',
      value: '-',
      co2e: calculateBaseTotal(),
      isTotal: true
    },
    {
      key: 'total-all',
      name: '企业温室气体排放总量（包括净购入电力和热力隐含的CO₂排放）',
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
          fontWeight: record.isTotal ? 'bold' : (record.highlight || record.key === 'carbonation-CO2' ? 'bold' : 'normal'), 
          color: record.highlight ? '#1890ff' : (record.key === 'carbonation-CO2' ? '#52c41a' : 'inherit') // 蓝色突出显示能源作为原材料用途的排放，绿色突出显示扣除项
        }}>
          {text}{record.key === 'carbonation-CO2' ? '（扣除项）' : ''}
        </span>
      )
    },
    {
      title: '排放量（单位：吨）',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => {
        if (record.highlight || record.key === 'carbonation-CO2') {
          return (
            <span style={{
              fontWeight: 'bold',
              color: record.highlight ? '#1890ff' : '#52c41a',
              backgroundColor: record.highlight ? '#e6f7ff' : '#f6ffed',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {typeof text === 'number' ? text.toFixed(2) : text}
            </span>
          );
        }
        if (typeof text === 'number') {
          return text.toFixed(2);
        }
        return text;
      }
    },
    {
      title: '温室气体排放量（单位：吨CO₂e）',
      dataIndex: 'co2e',
      key: 'co2e',
      render: (text, record) => (
        <span style={{ 
          fontWeight: record.isTotal ? 'bold' : (record.highlight || record.key === 'carbonation-CO2' ? 'bold' : 'normal'), 
          color: record.highlight ? '#1890ff' : (record.key === 'carbonation-CO2' ? '#52c41a' : 'inherit'),
          backgroundColor: record.highlight ? '#e6f7ff' : (record.key === 'carbonation-CO2' ? '#f6ffed' : 'transparent'),
          padding: (record.highlight || record.key === 'carbonation-CO2') ? '2px 6px' : '0',
          borderRadius: (record.highlight || record.key === 'carbonation-CO2') ? '4px' : '0'
        }}>
          {typeof text === 'number' ? text.toFixed(2) : text}
        </span>
      )
    }
  ];

  return (
    <div className="summary-table-container">
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>计算公式</Title>
        <p><strong>基础排放量（不含电力和热力）</strong> = 化石燃料燃烧排放 + 碳酸盐分解排放 - 碳化工艺吸收的CO₂量（扣除项）</p>
        <p><strong>总排放量（含电力和热力）</strong> = 基础排放量（不含电力和热力） + 净购入电力和热力隐含的CO₂排放</p>
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

export default MineIndustrySummary; 
