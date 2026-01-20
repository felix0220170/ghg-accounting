import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './CeramicsIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CarbonInventory from './CeramicsCarbonInventory';
import CarbonateDecompositionEmission from '../chemical/ChemicalCarbonateDecompositionEmission';
import FossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';

function CeramicsIndustry({ onEmissionChange }) {
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
      <Card title="中国陶瓷生产企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于中国陶瓷生产企业开展温室气体排放核算。陶瓷生产行业是重要的建材产业，
          其碳排放主要来自化石燃料燃烧、工业生产过程等环节。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、工业生产过程排放（主要是陶瓷原料中碳酸盐分解所导致的二氧化碳排放）、净购入电力和热力隐含的CO2排放。
        </Paragraph>
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
                title="指陶瓷生产中燃烧的化石燃料，如煤、柴油、重油、水煤气、天然气、液化石油气等产生的CO2排放。燃烧化石燃料的设备主要有煤气发生炉、蒸汽锅炉、原料干燥、喷雾干燥、坯体干燥和烧成窑等等。另外，还包括核算边界内用于生产的机动车辆消耗汽油、柴油等车用化石燃料产生的CO2排放"
              />
          </TabPane>
          <TabPane tab="工业生产过程中排放" key="carbonateDecomposition">
            <CarbonateDecompositionEmission 
              onEmissionChange={(value) => handleEmissionChange('carbonateDecompositionEmission', value)}
              title="主要指陶瓷原料中含有的方解石、菱镁矿和白云石等中的碳酸盐，如碳酸钙（CaCO3）和碳酸镁（MgCO3）等，在陶瓷烧成工序中高温下发生分解，释放出CO2"
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

export default CeramicsIndustry;
