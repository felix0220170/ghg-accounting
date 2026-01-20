import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import ChemicalIndustrySummary from './ChemicalIndustrySummary';
import ChemicalProcessEmission from './ChemicalProcessEmission';
import ChemicalFossilFuelEmission from './ChemicalFossilFuelEmission';
import CO2RecyclingUtilization from '../common/CO2RecyclingUtilization';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import ChemicalCarbonInventory from './ChemicalCarbonInventory';
import ChemicalCarbonateDecompositionEmission from './ChemicalCarbonateDecompositionEmission';
import ChemicalNitricAcidEmission from './ChemicalNitricAcidEmission';
import ChemicalAdipicAcidEmission from './ChemicalAdipicAcidEmission';

function ChemicalIndustry({ onEmissionChange }) {
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
      <Card title="中国化工行业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于中国化工行业企业开展温室气体排放核算。化工行业是重要的基础原材料产业，
          其碳排放主要来自化石燃料燃烧、生产过程等环节。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、工业生产过程排放（原材料消耗产生的排放、碳酸盐分解排放、硝酸产生的排放、己二酸产生的排放）、企业CO2回收利用量、购入净电净热排放等。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <ChemicalIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
              <ChemicalFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
              />
          </TabPane>
          <TabPane tab="工业生产过程中原材料消耗产生的排放" key="process">
            <ChemicalProcessEmission 
              onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
              productionLines={processes} 
              onProductionLinesChange={handleProcessesChange}
            />
          </TabPane>
          <TabPane tab="工业生产过程中碳酸盐分解排放" key="carbonateDecomposition">
            <ChemicalCarbonateDecompositionEmission 
              onEmissionChange={(value) => handleEmissionChange('carbonateDecompositionEmission', value)}
            />
          </TabPane>
          <TabPane tab="工业生产过程中硝酸产生的排放" key="nitricAcid">
            <ChemicalNitricAcidEmission 
              onEmissionChange={(value) => handleEmissionChange('nitricAcidEmission', value)}
            />
          </TabPane>
          <TabPane tab="工业生产过程中己二酸产生的排放" key="adipicAcid">
            <ChemicalAdipicAcidEmission 
              onEmissionChange={(value) => handleEmissionChange('adipicAcidEmission', value)}
            />
          </TabPane>
          <TabPane tab="企业CO2回收利用量" key="recycling">
            <CO2RecyclingUtilization 
              onEmissionChange={(value) => handleEmissionChange('recyclingEmission', value)}
            />
          </TabPane>
          <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
            <NetElectricityHeatEmission 
              onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbonInventory">
            <ChemicalCarbonInventory />
          </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default ChemicalIndustry;
