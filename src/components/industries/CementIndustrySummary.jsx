import React from 'react';
import { Card, Table, Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const CementIndustrySummary = ({ emissionData }) => {
  // 计算总排放量
  const totalEmission = (
    (emissionData.fossilFuelEmission || 0) +
    (emissionData.clinkerProductionEmission || 0) +
    (emissionData.powerPlantOtherEmission || 0) +
    (emissionData.netElectricityHeatEmission || 0)
  );

  // 准备表格数据
  const tableData = [
    {
      key: 'fossil-fuel',
      排放来源: '化石燃料燃烧 CO2 排放',
      排放量: (emissionData.fossilFuelEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.fossilFuelEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
    },
    {
      key: 'clinker-production',
      排放来源: '熟料生产过程 CO2 排放',
      排放量: (emissionData.clinkerProductionEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.clinkerProductionEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
    },
    {
      key: 'power-plant-other',
      排放来源: '发电设施及其他非熟料生产设施排放',
      排放量: (emissionData.powerPlantOtherEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.powerPlantOtherEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
    },

    {
      key: 'net-electricity-heat',
      排放来源: '购入净电（化石）和净热 CO2 排放',
      排放量: (emissionData.netElectricityHeatEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.netElectricityHeatEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
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
    <Card title="水泥行业温室气体排放汇总">
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
        总排放量(E总) = 化石燃料燃烧排放量(Ec_燃烧) + 熟料生产过程排放量(Ec_过程) + 发电设施排放量(E发电设施) + 其他排放量(E其他) + 购入净电（化石）和净热排放量(E净电净热)
      </Paragraph>
      
      <Paragraph>
        - 化石燃料燃烧排放量：通过化石燃料燃烧排放组件计算得出
      </Paragraph>
      <Paragraph>
        - 熟料生产过程排放量：通过熟料生产过程排放组件计算得出
      </Paragraph>
      <Paragraph>
        - 发电设施及其他非熟料生产设施排放量：通过相应组件计算得出
      </Paragraph>

      <Paragraph>
        - 购入净电（化石）和净热排放量：通过购入净电（化石）和净热组件计算得出
      </Paragraph>
      
      <style jsx>{`
        .total-row {
          font-weight: bold;
          background-color: #f0f5ff;
        }
      `}</style>
    </Card>
  );
};

export default CementIndustrySummary;