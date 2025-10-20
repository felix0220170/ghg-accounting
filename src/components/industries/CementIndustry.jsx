import React, { useState } from 'react';
import { Card, Tabs, Typography, Divider } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import ClinkerProductionEmission from '../ClinkerProductionEmission';
import PowerPlantOtherEmission from '../PowerPlantOtherEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import CementIndustrySummary from './CementIndustrySummary';
import { INDUSTRY_TYPES } from '../../config/industryConfig';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

function CementIndustry({ onEmissionChange }) {
  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    clinkerProduction: 0,
    powerPlantOther: 0,
    electricityHeat: 0
  });

  // 处理各组件排放量变化
  const handleEmissionChange = (key, value) => {
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
    fossilFuelEmission: emissionData.fossilFuel,
    clinkerProductionEmission: emissionData.clinkerProduction,
    powerPlantOtherEmission: emissionData.powerPlantOther,
    electricityHeatEmission: emissionData.electricityHeat
  });

  return (
    <div className="cement-industry">
      <Card title="水泥行业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于水泥行业企业开展温室气体排放核算。水泥行业是重要的基础原材料产业，
          其碳排放主要来自化石燃料燃烧、熟料生产过程、发电设施及其他非熟料生产设施等环节。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、熟料生产过程排放、发电设施及其他非熟料生产设施排放、
          净购入电力和热力隐含的排放等。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="1. 排放汇总" key="summary">
          <CementIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="2. 化石燃料燃烧 CO2 排放" key="fossilFuel">
          <FossilFuelEmission 
            industry={INDUSTRY_TYPES.CEMENT}
            onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
          />
        </TabPane>
        
        <TabPane tab="3. 熟料生产过程 CO2 排放" key="clinkerProduction">
          <ClinkerProductionEmission 
            onEmissionChange={(value) => handleEmissionChange('clinkerProduction', value)}
          />
        </TabPane>
        
        <TabPane tab="4. 发电设施及其他非熟料生产设施排放" key="powerPlantOther">
          <PowerPlantOtherEmission 
            onEmissionChange={(value) => handleEmissionChange('powerPlantOther', value)}
          />
        </TabPane>
        
        <TabPane tab="5. 净购入电力和热力隐含的 CO2 排放" key="electricityHeat">
          <ElectricityHeatEmission 
            industry={INDUSTRY_TYPES.CEMENT}
            onEmissionChange={(value) => handleEmissionChange('electricityHeat', value)}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default CementIndustry;