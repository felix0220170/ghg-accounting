import React from 'react';
import { Table } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

const PaperIndustrySummary = ({ emissionData, industry, onDataChange }) => {
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
      calculateEmission('processEmission') +  // 工业生产过程中排放
      calculateEmission('wastewaterTreatmentEmission') -  // 废水厌氧处理排放
      calculateEmission('ch4RecyclingEmission') -  // CH4回收与销毁量（扣除）
      calculateEmission('co2RecyclingEmission')  // CO2回收利用量（扣除）
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
      key: 'process-emission',
      name: '碳酸盐使用过程 CO₂ 排放',
      value: safeData.processEmission || 0,
      co2e: calculateCO2e('processEmission', safeData.processEmission || 0)
    },
    {
      key: 'wastewater-treatment',
      name: '废水厌氧处理排放',
      value: safeData.wastewaterTreatmentEmission || 0,
      co2e: calculateCO2e('wastewaterTreatmentEmission', safeData.wastewaterTreatmentEmission || 0)
    },
    {
      key: 'ch4-recycling',
      name: 'CH₄回收与销毁量',
      value: safeData.ch4RecyclingEmission || 0,
      co2e: calculateCO2e('ch4RecyclingEmission', safeData.ch4RecyclingEmission || 0),
      isDeduction: true
    },
    {
      key: 'co2-recycling',
      name: 'CO₂回收利用量',
      value: safeData.co2RecyclingEmission || 0,
      co2e: calculateCO2e('co2RecyclingEmission', safeData.co2RecyclingEmission || 0),
      isDeduction: true
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
          fontWeight: record.isTotal ? 'bold' : (record.isDeduction ? 'bold' : 'normal'), 
          color: record.isDeduction ? '#52c41a' : (record.highlight ? '#1890ff' : 'inherit')
        }}>
          {text}
          {record.isDeduction && '（扣除）'}
        </span>
      )
    },
    {
      title: '排放量（单位：吨）',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => {
        if (record.isDeduction) {
          return (
            <span style={{
              fontWeight: 'bold',
              color: '#52c41a',
              backgroundColor: '#f6ffed',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {typeof text === 'number' ? `-${text.toFixed(2)}` : text}
            </span>
          );
        }
        if (record.highlight) {
          return (
            <span style={{
              fontWeight: 'bold',
              color: '#1890ff',
              backgroundColor: '#e6f7ff',
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
      render: (text, record) => {
        if (record.isDeduction) {
          return (
            <span style={{ 
              fontWeight: 'bold',
              color: '#52c41a',
              backgroundColor: '#f6ffed',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {typeof text === 'number' ? `-${text.toFixed(2)}` : text}
            </span>
          );
        }
        return (
          <span style={{ 
            fontWeight: record.isTotal ? 'bold' : (record.highlight ? 'bold' : 'normal'), 
            color: record.highlight ? '#1890ff' : 'inherit',
            backgroundColor: record.highlight ? '#e6f7ff' : 'transparent',
            padding: record.highlight ? '2px 6px' : '0',
            borderRadius: record.highlight ? '4px' : '0'
          }}>
            {typeof text === 'number' ? text.toFixed(2) : text}
          </span>
        );
      }
    }
  ];

  return (
    <div className="summary-table-container">
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>排放项说明</Title>
        <p><strong>碳酸盐使用过程 CO₂ 排放</strong>：过程排放量是企业外购并消耗的石灰石（主要成分为碳酸钙）发生分解反应导致的二氧化碳排放量。</p>
        <p><strong>CH₄回收与销毁量</strong>：企业通过回收利用或火炬焚毁等措施处理废水处理产生的甲烷气从而免于排放到大气中的CH₄量，其中回收利用包括企业回收自用以及回收作为产品外供给其他单位。此部分从总排放量中扣除。</p>
        <p><strong>CO₂回收利用量</strong>：企业回收燃料燃烧或工业生产过程产生的CO₂作为生产原料自用或作为产品外供给其它单位，从而免于排放到大气中的CO₂量。此部分从总排放量中扣除。</p>
      </div>
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>计算公式</Title>
        <p><strong>基础排放量（不含电力和热力）</strong> = 化石燃料燃烧排放 + 碳酸盐使用过程 CO₂ 排放 + 废水厌氧处理排放 - <strong style={{ color: '#1890ff' }}>CH₄回收与销毁量</strong> - <strong style={{ color: '#1890ff' }}>CO₂回收利用量</strong></p>
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

export default PaperIndustrySummary; 
