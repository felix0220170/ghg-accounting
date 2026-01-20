import React from 'react';
import { Table } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

function PaperIndustrySummary({ data, industry }) {
  // 计算基础排放量（不包括电力和热力排放）
  const calculateBaseTotal = () => {
    const wastewaterEmission = (data.wastewaterTreatmentEmission || 0) * 21; // CH4 * 21
    const methaneRecoveryEmission = (data.methaneRecoveryEmission || 0) * 21; // CH4回收量 * 21
    const fossilFuelEmission = data.fossilFuelEmission || 0;
    const carbonateEmission = data.carbonateEmission || 0;
    
    // 基础排放量 = (废水处理CH4 - CH4回收与销毁量) * 21 + 化石燃料燃烧CO2 + 碳酸盐使用过程CO2
    return (wastewaterEmission - methaneRecoveryEmission) + fossilFuelEmission + carbonateEmission;
  };

  // 计算包含电力和热力的总排放量
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + (data.electricityHeatEmission || 0);
  };

  // 计算CO2e值（用于温室气体排放量列）
  const calculateCO2e = (type, value) => {
    if (type === 'wastewaterTreatmentEmission' || type === 'methaneRecoveryEmission') {
      return value * 21; // CH4相关排放 * 21
    }
    return value; // 其他排放类型直接使用值
  };

  // 表格数据
  const tableData = [
    {
      key: 'fossil-fuel',
      name: '化石燃料燃烧 CO2 排放',
      value: data.fossilFuelEmission || 0,
      co2e: calculateCO2e('fossilFuelEmission', data.fossilFuelEmission || 0)
    },
    {
      key: 'carbonate',
      name: '碳酸盐使用过程 CO2 排放',
      value: data.carbonateEmission || 0,
      co2e: calculateCO2e('carbonateEmission', data.carbonateEmission || 0)
    },
    {
      key: 'wastewater-treatment',
      name: '废水厌氧处理 CH4 排放',
      value: data.wastewaterTreatmentEmission || 0,
      co2e: calculateCO2e('wastewaterTreatmentEmission', data.wastewaterTreatmentEmission || 0)
    },
    {
      key: 'methane-recovery',
      name: 'CH4 回收与销毁量',
      value: data.methaneRecoveryEmission || 0,
      co2e: calculateCO2e('methaneRecoveryEmission', data.methaneRecoveryEmission || 0)
    },
    {
      key: 'electricity-heat',
      name: '净购入电力和热力隐含的 CO2 排放',
      value: data.electricityHeatEmission || 0,
      co2e: calculateCO2e('electricityHeatEmission', data.electricityHeatEmission || 0)
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
          return text.toFixed(2);
        }
        return text;
      }
    },
    {
      title: '温室气体排放量（单位：tCO₂e）',
      dataIndex: 'co2e',
      key: 'co2e',
      render: (text, record) => (
        <span style={record.isTotal ? { fontWeight: 'bold' } : {}}>
          {typeof text === 'number' ? text.toFixed(2) : text}
        </span>
      )
    }
  ];

  return (
    <div className="paper-industry-summary">
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>计算公式</Title>
        <p><strong>基础排放量（不含电力和热力）</strong> = 化石燃料燃烧CO2排放 + 碳酸盐使用过程CO2排放 + (废水厌氧处理CH4排放 - CH4回收与销毁量) * 21</p>
        <p><strong>总排放量（含电力和热力）</strong> = 基础排放量（不含电力和热力） + 净购入电力和热力隐含的CO2排放</p>
        <p>注：CH4的全球变暖潜能值为21</p>
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
}

export default PaperIndustrySummary;