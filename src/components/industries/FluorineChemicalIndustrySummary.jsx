import React from 'react';
import { Table } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

const FluorineChemicalIndustrySummary = ({ data, industry, onDataChange }) => {
  // 确保data不为undefined
  const safeData = data || {};
  
  // 计算各项排放量
  const calculateEmission = (key, conversionFactor = 1) => {
    // 从简化的数据结构中获取排放量
    return (safeData[key] || 0) * conversionFactor;
  };

  // 计算基础排放量（不包括电力和热力排放）
  const calculateBaseTotal = () => {
    return (
      calculateEmission('fossilFuelEmission') +
      calculateEmission('hcfc22ProductionEmission') +
      calculateEmission('hfcsPfcSf6Emission') // 添加新的排放项
    );
  };

  // 计算包括电力和热力的总排放量
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + calculateEmission('electricityHeatEmission');
  };

  // 计算CO2e值（用于温室气体排放量列）
  const calculateCO2e = (type, value) => {
    // 氟化工企业主要是CO2排放，HCFC-22生产过程HFC-23排放和HFCs/PFCs/SF6排放已经转换为CO2e
    return value;
  };

  // 表格数据
  const tableData = [
    {
      key: 'fossil-fuel',
      name: '化石燃料燃烧 CO2 排放',
      value: safeData.fossilFuelEmission || 0,
      co2e: calculateCO2e('fossilFuelEmission', safeData.fossilFuelEmission || 0)
    },
    {
      key: 'hcfc22-production',
      name: 'HCFC-22 生产过程 HFC-23 排放',
      value: safeData.hcfc22ProductionEmission || 0,
      co2e: calculateCO2e('hcfc22ProductionEmission', safeData.hcfc22ProductionEmission || 0)
    },
    {
      key: 'hfcs-pfcs-sf6',
      name: 'HFCs/PFCs/SF6 生产过程副产物及逃逸排放',
      value: safeData.hfcsPfcSf6Emission || 0,
      co2e: calculateCO2e('hfcsPfcSf6Emission', safeData.hfcsPfcSf6Emission || 0)
    },
    {
      key: 'electricity-heat',
      name: '净购入电力和热力隐含的 CO2 排放',
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
        <span style={record.isTotal ? { fontWeight: 'bold' } : {}}>
          {text}
        </span>
      )
    },
    {
      title: '排放量（单位：吨）',
      dataIndex: 'value',
      key: 'value',
      render: (text) => {
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
        <span style={record.isTotal ? { fontWeight: 'bold' } : {}}>
          {typeof text === 'number' ? text.toFixed(4) : text}
        </span>
      )
    }
  ];

  return (
    <div className="summary-table-container">
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>计算公式</Title>
        <p><strong>基础排放量（不含电力和热力）</strong> = 化石燃料燃烧CO2排放 + HCFC-22生产过程HFC-23排放 + HFCs/PFCs/SF6生产过程副产物及逃逸排放</p>
        <p><strong>总排放量（含电力和热力）</strong> = 基础排放量（不含电力和热力） + 净购入电力和热力隐含的CO2排放</p>
        <p>注：HFC-23的全球变暖潜能值为11700，HFCs/PFCs/SF6各气体的GWP值已在相应排放组件中完成CO2e转换</p>
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

export default FluorineChemicalIndustrySummary;