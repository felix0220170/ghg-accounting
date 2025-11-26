import React from 'react';
import { Card, Table, Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const SteelIndustrySummary = ({ emissionData }) => {
  // 计算总排放量（固碳产品隐含排放需要扣除）
  const totalEmission = (
    (emissionData.steelFossilFuelEmission || 0) +
    (emissionData.processEmission || 0) +
    (emissionData.otherEmission || 0) -
    (emissionData.carbonSequestrationEmission || 0)
  );

  // 准备表格数据
  const tableData = [
    {
      key: 'steel-fossil-fuel',
      排放来源: '企业级化石燃料燃烧排放',
      排放量: (emissionData.steelFossilFuelEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.steelFossilFuelEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
    },
    {
      key: 'process',
      排放来源: '工业过程排放',
      排放量: (emissionData.processEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.processEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
    },
    {
      key: 'carbon-sequestration',
      排放来源: '含碳产品隐含的排放',
      排放量: (emissionData.carbonSequestrationEmission || 0).toFixed(2),
      单位: 'tCO2',
      占比: totalEmission > 0 ? ((emissionData.carbonSequestrationEmission || 0) / totalEmission * 100).toFixed(2) : '0.00'
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
    <Card title="钢铁行业温室气体排放汇总">
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
        企业级总排放量(E总) = 企业级化石燃料排放量(Ec_钢铁燃料) + 工业过程排放量(Ec_过程) - 固碳产品隐含排放量(Ec_固碳产品)
      </Paragraph>
      
      <Paragraph>
        - 钢铁行业化石燃料排放量：通过钢铁行业化石燃料排放组件计算得出
      </Paragraph>
      <Paragraph>
        - 工业过程排放量：通过工业过程排放组件计算得出，包括熔剂、电极和外购含碳原料排放
      </Paragraph>
      <Paragraph>
          - 固碳产品隐含排放量：通过固碳产品隐含排放组件计算得出，包括粗钢、甲醇等固碳产品的隐含排放，在总排放量中作为减排量扣除
        </Paragraph>
      
      <Divider />
      
    </Card>
  );
};

export default SteelIndustrySummary;