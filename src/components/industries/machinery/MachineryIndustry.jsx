import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './MachineryIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CarbonInventory from './MachineryCarbonInventory';
import FossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import HFCsPFCsSF6Emission from './MachineryHFCsPFCsSF6Emission';
import MachineryWeldingCO2Emission from './MachineryWeldingCO2Emission';


function MachineryIndustry({ onEmissionChange }) {    
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
    HFCsPFCsSF6Emission: emissionData.HFCsPFCsSF6Emission || 0,
    weldingCO2Emission: emissionData.weldingCO2Emission || 0,
    electricityHeatEmission: emissionData.electricityHeatEmission || 0
  });

  return (
    <div className="machinery-industry">
      <Card title="机械设备制造业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          机械设备制造业包含了金属制品业、 通用设备制造业、 专用设备制造业、汽车制造业、铁路、船舶、航空航天及其他运输设备制造业、电气机械和器材制造业。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、电气设备与制冷设备生产过程中温室气体的排放、二氧化碳气体保护焊产生的CO₂排放、净购入电力和热力隐含的CO2排放。
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
              />
          </TabPane>
          <TabPane tab="电气设备与制冷设备生产过程中温室气体的排放" key="HFCsPFCsSF6">
            <HFCsPFCsSF6Emission 
              onEmissionChange={(value) => handleEmissionChange('HFCsPFCsSF6Emission', value)}
            />
          </TabPane>
          <TabPane tab="二氧化碳气体保护焊产生的CO₂排放" key="weldingCO2">
            <MachineryWeldingCO2Emission 
              onEmissionChange={(value) => handleEmissionChange('weldingCO2Emission', value)}
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

export default MachineryIndustry;
