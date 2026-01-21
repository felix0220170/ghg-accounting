import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './PaperIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CarbonInventory from './PaperCarbonInventory';
import FossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import PaperProcessEmission from '../chemical/ChemicalCarbonateDecompositionEmission';
import PaperWastewaterTreatmentEmission from '../food/FoodWastewaterTreatmentEmission';


function PaperIndustry({ onEmissionChange }) {    
  const [fuelProcesses, setFuelProcesses] = useState([{
      id: 'fule-process-1',
      processName: '化石燃料工序placeholder',
    }]);

  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    steelFossilFuel: 0,
    electricity: 0,
    heat: 0,
    processEmission: 0,
    carbonSequestration: 0,
    otherEmission: 0
  });
  
  // 详细排放数据，用于工序排放量汇总组件
  const [fossilFuelEmissions, setFossilFuelEmissions] = useState({});
  const [electricityEmissions, setElectricityEmissions] = useState({});
  const [heatEmissions, setHeatEmissions] = useState({});
  
  const [processes, setProcesses] = useState([{
      id: 'process-1',
      processTypeName: '生产过程的CO2 排放',
    }]);
  
  // 处理工序变化
  const handleProcessesChange = (updatedProcesses) => {
    setProcesses(updatedProcesses);
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
      switch (key) {
        case 'steelFossilFuel':
          setFossilFuelEmissions(value.processEmissions || {});
          break;
        default:
          break;
      }
    }
  };

  // 计算总排放量并通知父组件
  const calculateTotalEmission = () => {
    const total = Object.values(emissionData).reduce((sum, value) => sum + value, 0);
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: total,
        processes // 同时传递工序信息
      });
    }
    return total;
  };

  // 准备传递给Summary组件的数据格式
  const prepareSummaryData = () => ({
    fossilFuelEmission: emissionData.fossilFuel || 0,
    processEmission: emissionData.processEmission || 0,
    wastewaterTreatmentEmission: emissionData.wastewaterTreatmentEmission || 0,
    electricityHeatEmission: emissionData.electricityHeatEmission || 0
  });

  return (
    <div className="food-industry">
      <Card title="中国造纸和纸制品生产企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于适用于中国造纸和纸制品生产企业温室气体排放量的核
算和报告，以造纸和纸制品生产为主营业务的企业可按照本指南提
供的方法核算企业的温室气体排放量，并编制企业温室气体排放报
告。
        </Paragraph>
        <Paragraph>
          核算范围包括：
        </Paragraph>
        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
          <li>化石燃料燃烧排放：包括蒸汽锅炉、气化炉等设备消耗的燃料燃烧的二氧化碳排放，以及原料运输与中间产品转运涉及的其他移动源及固定源消耗的化石燃料燃烧的二氧化碳排放</li>
          <li>工业生产过程中排放：过程排放量是过程排放量是企业外购并消耗的石灰石（主要成分为碳酸钙）发生分解反应导致的二氧化碳排放量</li>
          <li>废水厌氧处理排放：包括废水厌氧处理过程中产生的甲烷排放，以及折算成二氧化碳的排放量</li>
          <li>净购入电力和热力隐含的CO₂排放：包括企业从外部购入的电力和热力所隐含的二氧化碳排放</li>
        </ul>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <IndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
              <FossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
                />
          </TabPane>
          <TabPane tab="工业生产过程中排放" key="processEmission">
            <PaperProcessEmission 
              onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
              productionLines={processes} 
              onProductionLinesChange={handleProcessesChange}
              title='工业生产过程中排放：过程排放量是过程排放量是企业外购并消耗的石灰石（主要成分为碳酸钙）发生分解反应导致的二氧化碳排放量'
              />
          </TabPane>
          <TabPane tab="废水厌氧处理排放" key="wastewaterTreatment">
            <PaperWastewaterTreatmentEmission 
              onEmissionChange={(value) => handleEmissionChange('wastewaterTreatmentEmission', value)}
              isPaper={true}
            />
          </TabPane>
          <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
            <NetElectricityHeatEmission 
              onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbonInventory">
            <CarbonInventory />
          </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default PaperIndustry;
