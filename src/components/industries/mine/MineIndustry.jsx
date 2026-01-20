import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './MineIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CarbonInventory from './MineCarbonInventory';
import FossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import MineCarbonateDecompositionEmission from './MineCarbonateDecompositionEmission';
import MineCarbonationCO2Absorption from './MineCarbonationCO2Absorption';

function MineIndustry({ onEmissionChange }) {    
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
    carbonateDecompositionEmission: emissionData.carbonateDecompositionEmission || 0,
    carbonationCO2Absorption: emissionData.carbonationCO2Emission || 0, // 使用正确的键名
    electricityHeatEmission: emissionData.electricityHeatEmission || 0
  });

  return (
    <div className="mine-industry">
      <Card title="矿山企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          矿山企业涵盖了煤矿、金属矿、非金属矿等各类矿山的开采、选矿、加工等生产活动。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、碳酸盐分解排放、碳化工艺吸收的CO₂量、净购入电力和热力隐含的CO2排放。
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
                title='指化石燃料在各种类型的固定或
移动燃烧设备中与氧气充分燃烧生成的CO₂排放。 矿山企业涉及
化石燃料燃烧的装置或设备主要有工业锅炉、窑炉、焙烧炉、链
篦机、烧结机、干燥机、灶具、内燃凿岩机、铲车、推土机、自
卸汽车等。'
              />
          </TabPane>
          <TabPane tab="碳酸盐分解排放" key="carbonDecomposition">
            <MineCarbonateDecompositionEmission 
              onEmissionChange={(value) => handleEmissionChange('carbonateDecompositionEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳化工艺吸收的CO₂量" key="carbonationCO2">
            <MineCarbonationCO2Absorption 
              onEmissionChange={(value) => handleEmissionChange('carbonationCO2Emission', value)}
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

export default MineIndustry;
