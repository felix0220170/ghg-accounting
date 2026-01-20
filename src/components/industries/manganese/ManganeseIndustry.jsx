import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import ManganeseIndustrySummary from './ManganeseIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import ManganeseCarbonInventory from './ManganeseCarbonInventory';
import ManganeseCarbonateDecompositionEmission from '../chemical/ChemicalCarbonateDecompositionEmission';
import ManganeseFossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import ManganeseProcessEmission from './ManganeseProcessEmission';

function ManganeseIndustry({ onEmissionChange }) {
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
    fossilFuelEmission: emissionData.fossilFuel,
    processEmission: emissionData.processEmission,
    carbonateDecompositionEmission: emissionData.carbonateDecompositionEmission,
    nitricAcidEmission: emissionData.nitricAcidEmission,
    adipicAcidEmission: emissionData.adipicAcidEmission,
    recyclingEmission: emissionData.recyclingEmission,
    electricityHeatEmission: emissionData.electricityHeatEmission
  });

  return (
    <div className="coking-industry">
      <Card title="中国镁冶炼企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于中国镁冶炼企业开展温室气体排放核算。镁冶炼行业是重要的金属材料产业，
          其碳排放主要来自化石燃料燃烧、能源作为原材料使用、生产过程等环节。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、能源作为原材料用途的排放、工业生产过程排放（主要是白云石煅烧分解所导致的二氧化碳排放）、净购入电力和热力隐含的CO2排放。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <ManganeseIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
              <ManganeseFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
              />
          </TabPane>
          <TabPane tab="能源作为原材料用途的排放" key="process">
            <ManganeseProcessEmission 
              onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
              productionLines={processes} 
              onProductionLinesChange={handleProcessesChange}
            />
          </TabPane>
          <TabPane tab="工业生产过程中排放" key="carbonateDecomposition">
            <ManganeseCarbonateDecompositionEmission 
              onEmissionChange={(value) => handleEmissionChange('carbonateDecompositionEmission', value)}
            />
          </TabPane>
          <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
            <NetElectricityHeatEmission 
              onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbonInventory">
            <ManganeseCarbonInventory />
          </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default ManganeseIndustry;
