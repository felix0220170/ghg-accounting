import React from 'react';
import { Table } from 'antd';
import { Typography } from 'antd';

const { Title } = Typography;

const PetroleumIndustrySummary = ({ emissionData }) => {
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
      calculateEmission('torchEmission') + // 火炬燃烧排放
      // 工业生产过程排放
      calculateEmission('catalyticCrackingEmission') + // 催化裂化装置催化剂烧焦排放
      calculateEmission('catalyticReformingEmission') + // 催化重整装置催化剂烧焦排放
      calculateEmission('otherCatalystEmission') + // 其它装置催化剂烧焦排放
      calculateEmission('hydrogenProductionEmission') + // 制氢装置排放
      calculateEmission('cokingPlantEmission') + // 焦化装置排放
      calculateEmission('petroleumCokeCalciningEmission') + // 石油焦煅烧装置排放
      calculateEmission('oxidizedAsphaltEmission') + // 氧化沥青装置排放
      calculateEmission('ethyleneCrackingEmission') + // 乙烯裂解装置排放
      calculateEmission('ethyleneGlycolEmission') // 乙二醇/环氧乙烷生产装置排放
    );
  };

  // 计算包含电力和热力的总排放量
  const calculateTotalWithElectricity = () => {
    return (
      calculateBaseTotal() + 
      calculateEmission('electricityHeatEmission') - // 购入净电（化石）和净热隐含的CO2排放
      calculateEmission('recyclingEmission') - // 企业CO2回收利用量
      calculateEmission('ch4RecyclingEmission') // 企业CH4回收利用量
    );
  };



  // 计算工业生产过程排放总量
  const calculateIndustrialProcessEmission = () => {
    return (safeData.catalyticCrackingEmission || 0) +
           (safeData.catalyticReformingEmission || 0) +
           (safeData.otherCatalystEmission || 0) +
           (safeData.hydrogenProductionEmission || 0) +
           (safeData.cokingPlantEmission || 0) +
           (safeData.petroleumCokeCalciningEmission || 0) +
           (safeData.oxidizedAsphaltEmission || 0) +
           (safeData.ethyleneCrackingEmission || 0) +
           (safeData.ethyleneGlycolEmission || 0);
  };

  // 表格数据 - 树形结构
  const tableData = [
    {
      key: 'fossil-fuel',
      name: '化石燃料燃烧 CO2 排放',
      value: safeData.fossilFuelEmission || 0,
      co2e: safeData.fossilFuelEmission || 0
    },
    {
      key: 'torch-emission',
      name: '火炬燃烧排放',
      value: safeData.torchEmission || 0,
      co2e: safeData.torchEmission || 0
    },
    // 工业生产过程排放 - 父项
    {
      key: 'industrial-process',
      name: '工业生产过程排放',
      value: '-',
      co2e: calculateIndustrialProcessEmission(),
      children: [
        {
          key: 'catalytic-cracking',
          name: '催化裂化装置催化剂烧焦排放',
          value: safeData.catalyticCrackingEmission || 0,
          co2e: safeData.catalyticCrackingEmission || 0
        },
        {
          key: 'catalytic-reforming',
          name: '催化重整装置催化剂烧焦排放',
          value: safeData.catalyticReformingEmission || 0,
          co2e: safeData.catalyticReformingEmission || 0
        },
        {
          key: 'other-catalyst',
          name: '其它装置催化剂烧焦排放',
          value: safeData.otherCatalystEmission || 0,
          co2e: safeData.otherCatalystEmission || 0
        },
        {
          key: 'hydrogen-production',
          name: '制氢装置排放',
          value: safeData.hydrogenProductionEmission || 0,
          co2e: safeData.hydrogenProductionEmission || 0
        },
        {
          key: 'coking-plant',
          name: '焦化装置排放',
          value: safeData.cokingPlantEmission || 0,
          co2e: safeData.cokingPlantEmission || 0
        },
        {
          key: 'petroleum-coke-calcining',
          name: '石油焦煅烧装置排放',
          value: safeData.petroleumCokeCalciningEmission || 0,
          co2e: safeData.petroleumCokeCalciningEmission || 0
        },
        {
          key: 'oxidized-asphalt',
          name: '氧化沥青装置排放',
          value: safeData.oxidizedAsphaltEmission || 0,
          co2e: safeData.oxidizedAsphaltEmission || 0
        },
        {
          key: 'ethylene-cracking',
          name: '乙烯裂解装置排放',
          value: safeData.ethyleneCrackingEmission || 0,
          co2e: safeData.ethyleneCrackingEmission || 0
        },
        {
          key: 'ethylene-glycol',
          name: '乙二醇/环氧乙烷生产装置排放',
          value: safeData.ethyleneGlycolEmission || 0,
          co2e: safeData.ethyleneGlycolEmission || 0
        }
      ]
    },
    {
      key: 'electricity-heat',
      name: '购入净电（化石）和净热隐含的 CO2 排放',
      value: safeData.electricityHeatEmission || 0,
      co2e: safeData.electricityHeatEmission || 0
    },
    {
      key: 'recycling-emission',
      name: '企业CO2回收利用量',
      value: safeData.recyclingEmission || 0,
      co2e: safeData.recyclingEmission || 0,
      isDeduction: true
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
      name: '企业温室气体排放总量（包括净购入电力和热力隐含的 CO2 排放，扣除回收利用量）',
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
          fontWeight: record.isTotal ? 'bold' : 'normal',
          color: record.isDeduction ? '#1890ff' : 'inherit'
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
          return (
            <span style={{ 
              color: record.isDeduction ? '#1890ff' : 'inherit'
            }}>
              {text.toFixed(4)}
            </span>
          );
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
          fontWeight: record.isTotal ? 'bold' : 'normal',
          color: record.isDeduction ? '#1890ff' : 'inherit'
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
        <p><strong>基础排放量（不含电力和热力）</strong> = 化石燃料燃烧CO2排放 + 火炬燃烧排放 + 工业生产过程排放</p>
        <p><strong>总排放量（含电力和热力）</strong> = 基础排放量（不含电力和热力） + 购入净电（化石）和净热隐含的CO2排放 - <span style={{ color: '#1890ff', fontWeight: 'bold' }}>企业CO2回收利用量</span></p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>* <span style={{ color: '#1890ff', fontWeight: 'bold' }}>蓝色文字</span> 表示需要扣除的回收利用量</p>
      </div>
      
      <Table 
        dataSource={tableData} 
        columns={columns} 
        pagination={false} 
        rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        style={{ marginBottom: '20px' }}
        // 开启树形表格
        rowKey="key"
        indentSize={16}
        // 展开父项
        defaultExpandAllRows={true}
      />
    </div>
  );
};

export default PetroleumIndustrySummary;
