import React from 'react';
import { Table, Typography, Divider } from 'antd';

const { Title, Text } = Typography;

const AluminumSummary = ({ emissionData = {} }) => {
  // 汇总表格数据
  const summaryData = [
    {
      category: '化石燃料燃烧排放',
      source: '工序及移动燃烧设备',
      gasType: 'CO2',
      emission: emissionData.totalEmission || 0,
      unit: '吨'
    },
    {
      category: '能源作为原材料用途排放',
      source: '碳阳极消耗',
      gasType: 'CO2',
      emission: emissionData.carbonAnode || 0,
      unit: '吨'
    },
    {
      category: '电解铝工序阳极效应排放',
      source: '阳极效应排放',
      gasType: 'PFCs (CF4/C2F6)',
      emission: emissionData.anodeEffect || 0,
      unit: '吨CO2当量'
    },
    {
      category: '工业生产过程排放',
      source: '碳酸盐分解',
      gasType: 'CO2',
      emission: emissionData.carbonateDecomposition || 0,
      unit: '吨'
    },
    {
      category: '其他非铝冶炼生产设施排放',
      source: '发电设施及其他非铝冶炼设施',
      gasType: 'CO2',
      emission: emissionData.otherEmission || 0,
      unit: '吨'
    },
    {
      category: '净购入电力和热力产生的排放',
      source: '购入净电（化石）和净热',
      gasType: 'CO2',
      emission: (emissionData.netElectricityHeat) || 0,
      unit: '吨'
    }
  ];

  // 计算总排放量
  const totalEmission = summaryData.reduce((total, item) => {
    return total + (parseFloat(item.emission) || 0);
  }, 0);

  // 表格列配置
  const columns = [
    {
      title: '排放类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '排放源',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '温室气体类型',
      dataIndex: 'gasType',
      key: 'gasType',
    },
    {
      title: '排放量',
      dataIndex: 'emission',
      key: 'emission',
      render: (text) => (
        <span>{typeof text === 'number' ? text.toFixed(2) : text}</span>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
  ];

  return (
    <div>
      <Title level={4}>温室气体排放汇总表</Title>
      <Text type="secondary">本汇总表展示铝冶炼企业各类温室气体排放情况</Text>
      
      <Table 
        columns={columns} 
        dataSource={summaryData} 
        pagination={false} 
        rowKey="category"
        footer={() => (
          <div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Text strong style={{ fontSize: '16px', marginRight: '10px' }}>总排放量：</Text>
              <Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>{totalEmission.toFixed(2)} 吨CO2当量</Text>
            </div>
          </div>
        )}
      />
      
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <Title level={5}>说明</Title>
        <ul>
          <li>化石燃料燃烧排放：包括所有工序固定燃烧设备和移动燃烧设备的CO2排放</li>
          <li>工业生产过程排放-阳极效应排放：主要包括电解铝生产过程中阳极效应产生的CF4和C2F6等PFCs温室气体排放</li>
          <li>工业生产过程排放-碳酸盐分解：主要包括铝冶炼过程中碳酸盐（如石灰石、纯碱等）分解产生的CO2排放</li>
          <li>能源作为原材料用途排放：主要包括碳阳极消耗产生的CO2排放</li>
          <li>其他非铝冶炼生产设施排放：主要包括企业内部发电设施及其他非铝冶炼生产设施产生的CO2排放</li>
          <li>净购入电力和热力产生的排放：主要包括企业购入净电（化石）和净热产生的CO2排放</li>
        </ul>
      </div>
    </div>
  );
};

export default AluminumSummary;