import React, { useState } from 'react';
import { Card, Tabs, Typography, Divider } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import ClinkerProductionEmission from '../ClinkerProductionEmission';
import PowerPlantOtherEmission from '../PowerPlantOtherEmission';
import NetElectricityHeatEmission from '../NetElectricityHeatEmission';
import CementIndustrySummary from './CementIndustrySummary';
import ProductionLineManagement from '../ProductionLineManagement';
import CementCarbonInventory from './CementCarbonInventory';
import { INDUSTRY_TYPES } from '../../config/industryConfig';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

function CementIndustry({ onEmissionChange }) {
  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    clinkerProduction: 0,
    powerPlantOther: 0,
    netElectricityHeat: 0
  });
  
  // 预设两条生产线数据，用于demo演示
  const defaultProductionLines = [
    {
      id: '1',
      name: '1#生产线(Demo)',
      designCapacity: '3000',
      kilnSpec: '4.8×70',
      clinkerType: '硅酸盐水泥熟料',
      clinkerVariety: '通用水泥熟料',
      isCalciumCarbideSludgeMainMaterial: false,
      alternativeFuelCapacity: '10万t/a',
      alternativeFuelTypes: '生活垃圾, 工业固废',
      coordinatedDisposalCapacity: '50万t/a',
      coordinatedDisposalTypes: '生活垃圾, 工业固废',
      supportingMaterials: {}
    },
    {
      id: '2',
      name: '2#生产线(Demo)',
      designCapacity: '5000',
      kilnSpec: '5.0×80',
      clinkerType: '白色硅酸盐水泥熟料',
      clinkerVariety: '白色硅酸盐水泥熟料',
      isCalciumCarbideSludgeMainMaterial: true,
      alternativeFuelCapacity: '15万t/a',
      alternativeFuelTypes: '污泥, 废轮胎',
      coordinatedDisposalCapacity: '60万t/a',
      coordinatedDisposalTypes: '污泥, 废轮胎',
      supportingMaterials: {}
    }
  ];

  // 生产线状态管理，使用默认生产线数据作为初始值
  const [productionLines, setProductionLines] = useState(defaultProductionLines);
  

  
  // 处理生产线变化
  const handleProductionLinesChange = (updatedLines) => {
    setProductionLines(updatedLines);
    // 通知父组件生产线信息变化
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: calculateTotalEmission(),
        productionLines: updatedLines
      });
    }
  };

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
        totalEmission: total,
        productionLines // 同时传递生产线信息
      });
    }
    return total;
  };


  
  // 准备传递给Summary组件的数据格式
  const prepareSummaryData = () => ({
    fossilFuelEmission: emissionData.fossilFuel,
    clinkerProductionEmission: emissionData.clinkerProduction,
    powerPlantOtherEmission: emissionData.powerPlantOther,
    netElectricityHeatEmission: emissionData.netElectricityHeat
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
        <TabPane tab="排放汇总" key="summary">
          <CementIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="生产线管理" key="productionLineManagement">
          <ProductionLineManagement 
            productionLines={productionLines}
            onProductionLinesChange={handleProductionLinesChange}
          />
        </TabPane>
        <TabPane tab="化石燃料燃烧 CO2 排放" key="fossilFuel">
          <FossilFuelEmission 
            industry={INDUSTRY_TYPES.CEMENT}
            onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
            productionLines={productionLines} // 传递生产线信息给子组件
            onProductionLinesChange={handleProductionLinesChange} // 添加生产线变化回调
          />
        </TabPane>
        
        <TabPane tab="熟料生产过程 CO2 排放" key="clinkerProduction">
          <ClinkerProductionEmission 
            onEmissionChange={(value) => handleEmissionChange('clinkerProduction', value)}
            productionLines={productionLines} // 传递生产线信息给子组件
            onProductionLinesChange={handleProductionLinesChange} // 添加生产线变化回调
          />
        </TabPane>
        
        <TabPane tab="发电设施及其他非熟料生产设施排放" key="powerPlantOther">
          <PowerPlantOtherEmission 
            onEmissionChange={(value) => handleEmissionChange('powerPlantOther', value)}
            productionLines={productionLines} // 传递生产线信息给子组件
          />
        </TabPane>
        

        <TabPane tab="购入净电（化石）和净热" key="netElectricityHeat">
          <NetElectricityHeatEmission 
            onEmissionChange={(value) => handleEmissionChange('netElectricityHeat', value)}
          />
        </TabPane>
        
        <TabPane tab="碳排查材料清单" key="carbonInventory">
          <CementCarbonInventory />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default CementIndustry;