import React from 'react';
import { Table } from 'antd';

const CementIndustrySummary = ({ emissionData }) => {
  // 如果没有排放数据，设置默认值
  const defaultData = {
    fossilFuelEmission: 0,
    clinkerProductionEmission: 0,
    powerPlantOtherEmission: 0,
    electricityHeatEmission: 0,
  };

  const data = { ...defaultData, ...emissionData };

  // 计算总排放量
  const totalEmission = Object.values(data).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);

  // 表格数据
  const tableData = [
    {
      key: '1',
      emissionType: '化石燃料燃烧',
      emission: data.fossilFuelEmission,
      unit: '吨 CO2',
      percentage: totalEmission ? ((data.fossilFuelEmission / totalEmission) * 100).toFixed(2) : '0.00',
    },
    {
      key: '2',
      emissionType: '熟料生产过程',
      emission: data.clinkerProductionEmission,
      unit: '吨 CO2',
      percentage: totalEmission ? ((data.clinkerProductionEmission / totalEmission) * 100).toFixed(2) : '0.00',
    },
    {
      key: '3',
      emissionType: '发电设施及其他非水泥熟料生产设施',
      emission: data.powerPlantOtherEmission,
      unit: '吨 CO2',
      percentage: totalEmission ? ((data.powerPlantOtherEmission / totalEmission) * 100).toFixed(2) : '0.00',
    },
    {
      key: '4',
      emissionType: '净购入电力和热力隐含的CO2排放',
      emission: data.electricityHeatEmission,
      unit: '吨 CO2',
      percentage: totalEmission ? ((data.electricityHeatEmission / totalEmission) * 100).toFixed(2) : '0.00',
    },
    {
      key: '5',
      emissionType: '总排放量',
      emission: totalEmission,
      unit: '吨 CO2',
      percentage: '100.00',
    },
  ];

  // 表格列配置
  const columns = [
    {
      title: '排放类型',
      dataIndex: 'emissionType',
      key: 'emissionType',
      render: (text, record) => {
        // 为总排放量添加特殊样式
        if (record.key === '6') {
          return <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{text}</span>;
        }
        return text;
      },
    },
    {
      title: '排放量',
      dataIndex: 'emission',
      key: 'emission',
      render: (text, record) => {
        // 为总排放量添加特殊样式
        if (record.key === '6') {
          return <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{parseFloat(text).toFixed(4)}</span>;
        }
        return parseFloat(text).toFixed(4);
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '占比(%)',
      dataIndex: 'percentage',
      key: 'percentage',
    },
  ];

  return (
    <div className="industry-summary">
      <h2>水泥行业温室气体排放汇总</h2>
      <Table 
        columns={columns} 
        dataSource={tableData} 
        pagination={false}
        size="middle"
      />
    </div>
  );
};

export default CementIndustrySummary;