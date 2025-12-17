import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import GlassIndustrySummary from './GlassIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import GlassCarbonInventory from './GlassCarbonInventory';
import GlassFossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import GlassProcessEmission from './GlassProcessEmission';
import GlassCarbonateDecompositionEmission from '../chemical/ChemicalCarbonateDecompositionEmission';

function GlassIndustry({ onEmissionChange }) {
  const [fuelProcesses, setFuelProcesses] = useState([{
      id: 'fule-process-1',
      processName: 'placeholder',
    }]);

  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    electricity: 0,
    heat: 0,
    processEmission: 0, // 原料配料中碳粉氧化的排放
    carbonateDecompositionEmission: 0, // 原料分解产生的排放
    electricityHeatEmission: 0 // 购入净电（化石）和净热
  });
  
  // 详细排放数据，用于工序排放量汇总组件
  const [fossilFuelEmissions, setFossilFuelEmissions] = useState({});
  
  // 处理工序变化
  const handleProcessesChange = (updatedProcesses) => {
    // 通知父组件工序信息变化
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: calculateTotalEmission(),
        processes: updatedProcesses
      });
    }
  };

  const handleFuelProcessesChange = (updatedProcesses) => {
    setFuelProcesses(updatedProcesses);
  };

  // 处理各组件排放量变化
  const handleEmissionChange = (key, value) => {
    // 更新总排放量数据
    setEmissionData(prev => ({
      ...prev,
      [key]: typeof value === 'object' && value !== null ? value.totalEmission || 0 : value || 0
    }));
    
    // 更新详细排放数据
    if (typeof value === 'object' && value !== null) {
      if (key === 'fossilFuel') {
        setFossilFuelEmissions(value.processEmissions || {});
      }
    }
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
    processEmission: emissionData.processEmission, // 原料配料中碳粉氧化的排放
    carbonateDecompositionEmission: emissionData.carbonateDecompositionEmission, // 原料分解产生的排放
    electricityHeatEmission: emissionData.electricityHeatEmission // 购入净电（化石）和净热
  });

  return (
    <div className="aero-industry">
      <Card title="中国平板玻璃生产企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于中国平板玻璃生产企业开展温室气体排放核算。平板玻璃生产企业的温室气体排放总量等于企业核算边界内化石燃料燃烧的排放、原料配料中碳粉氧化的排放、原料分解产生的排放以及净购入使用电力及热力产生的二氧化碳排放之和。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、原料配料中碳粉氧化的排放、原料分解产生的排放、购入净电（化石）和净热隐含的CO2排放。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <GlassIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="企业级化石燃料燃烧排放" key="fossilFuel">
              <GlassFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
                title="在平板玻璃生产中，用于玻璃熔窑的燃料品种，主要有实物煤（煤粉） 、天然气、重油、煤焦油、焦炉煤气、发生炉煤气、石油焦等。在辅助生产过程中化石燃料主要有柴油和汽油"
              />
          </TabPane>
          <TabPane tab="原料配料中碳粉氧化的排放" key="processEmission">
            <GlassProcessEmission 
              onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
            />
          </TabPane>
          <TabPane tab="原料分解产生的排放" key="carbonateDecompositionEmission">
            <GlassCarbonateDecompositionEmission 
              onEmissionChange={(value) => handleEmissionChange('carbonateDecompositionEmission', value)}
            />
          </TabPane>
          <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
            <NetElectricityHeatEmission 
              onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbonInventory">
            <GlassCarbonInventory />
          </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default GlassIndustry;
