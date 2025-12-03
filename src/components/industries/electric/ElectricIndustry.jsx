import { useState } from 'react';

import { Card, Tabs, Typography } from 'antd';

import ElectricIndustrySummary from './ElectricIndustrySummary';
import SulfurHexafluorideEmission from './SulfurHexafluorideEmission';
import TransmissionDistributionEmission from './TransmissionDistributionEmission';
import ElectricCarbonInventory from './ElectricInventory';


const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

function ElectricIndustry({ onEmissionChange }) {

  const [emissionData, setEmissionData] = useState({
    sulfurHexafluorideEmission: 0,
    transmissionDistributionEmission: 0,
  });

  // 处理各组件排放量变化
  const handleEmissionChange = (key, value) => {
    // 更新总排放量数据
    setEmissionData(prev => ({
      ...prev,
      [key]: typeof value === 'object' && value !== null ? value.totalEmission || 0 : value || 0
    }));
  
  };

  // 计算总排放量并通知父组件
  const calculateTotalEmission = () => {
    const total = Object.values(emissionData).reduce((sum, value) => sum + value, 0);
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: total
      });
    }
    return total;
  };

  // 准备传递给Summary组件的数据格式
  const prepareSummaryData = () => ({
    sulfurHexafluorideEmission: emissionData.sulfurHexafluorideEmission,
    transmissionDistributionEmission: emissionData.transmissionDistributionEmission,
  });

  return (
    <div className="steel-industry">
      <Card title="中国电网企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于电网企业开展温室气体排放核算。电网企业是电力系统的重要组成部分，
          其温室气体排放指使用六氟化硫设备修理与退役过程产生中的六氟化硫的排放和输配电损失所对应的电力生产环节产生的二氧化碳排放。
        </Paragraph>
        <Paragraph>
          核算范围包括：使用六氟化硫设备修理与退役过程产生的排放、输电与分配过程产生的排放。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <ElectricIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="使用六氟化硫设备修理与退役过程产生的排放" key="sulfur-hexafluoride">
          <SulfurHexafluorideEmission onEmissionChange={(value) => handleEmissionChange('sulfurHexafluorideEmission', value)} />
        </TabPane>
        <TabPane tab="输电与分配过程产生的排放" key="transmission-distribution">
          <TransmissionDistributionEmission onEmissionChange={(value) => handleEmissionChange('transmissionDistributionEmission', value)} />
        </TabPane>
        <TabPane tab="碳排查材料清单" key="carbonInventory">
          <ElectricCarbonInventory 
            onEmissionChange={(value) => handleEmissionChange('carbonInventory', value)}
          />
        </TabPane>
      </Tabs>
        
    </div>
  );
}

export default ElectricIndustry;