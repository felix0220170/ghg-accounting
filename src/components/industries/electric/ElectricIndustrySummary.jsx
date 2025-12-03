import React from 'react';
import { Card, Table, Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const ElectricIndustrySummary = ({ emissionData }) => {
  // 计算总排放量
  const totalEmission = (
    (emissionData.sulfurHexafluorideEmission || 0) +
    (emissionData.transmissionDistributionEmission || 0)
  );

  // 准备表格数据
  const tableData = [
    {
      key: 'sulfur-hexafluoride',
      排放来源: '使用六氟化硫设备修理与退役过程产生的排放',
      排放量: (emissionData.sulfurHexafluorideEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.sulfurHexafluorideEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
    },
    {
      key: 'transmission-distribution',
      排放来源: '输电与分配过程产生的排放',
      排放量: (emissionData.transmissionDistributionEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.transmissionDistributionEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
    },
    {
      key: 'total',
      排放来源: '合计',
      排放量: totalEmission.toFixed(2),
      单位: 'tCO2',
      占比: '100.00'
    }
  ];

  // 表格列定义
  const columns = [
    {
      title: '排放来源',
      dataIndex: '排放来源',
      key: '排放来源'
    },
    {
      title: '排放量',
      dataIndex: '排放量',
      key: '排放量'
    },
    {
      title: '单位',
      dataIndex: '单位',
      key: '单位'
    },
    {
      title: '占比(%)',
      dataIndex: '占比',
      key: '占比'
    }
  ];

  return (
    <Card title="中国电网企业温室气体排放汇总">
      <Table 
        columns={columns} 
        dataSource={tableData} 
        pagination={false} 
        rowKey="key"
        rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
      />
      
      <Divider />
      
      <Title level={5}>排放核算公式说明</Title>
      <Paragraph>
        企业级总排放量(E总) = 使用六氟化硫设备修理与退役过程产生的排放(E_六氟化硫) + 输电与分配过程产生的排放(E_输电分配)
      </Paragraph>
      
      <Paragraph>
        - 使用六氟化硫设备修理与退役过程产生的排放：通过使用六氟化硫设备排放组件计算得出
      </Paragraph>
      <Paragraph>
        - 输电与分配过程产生的排放：通过输电与分配过程排放组件计算得出
      </Paragraph>
      
      <Divider />
      
    </Card>
  );
};

export default ElectricIndustrySummary;