import { useState } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './NoneFerrousMetalsIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import NoneFerrousMetalsCarbonInventory from './NoneFerrousMetalsCarbonInventory';
import NoneFerrousMetalsEnergyEmission from './NoneFerrousMetalsEnergyEmission';
import NoneFerrousMetalsFossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import NoneFerrousMetalsProcessEmission from './NoneFerrousMetalsProcessEmission';

function NoneFerrousMetalsIndustry({ onEmissionChange }) {
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
    energyEmission: emissionData.energyEmission,
    electricityHeatEmission: emissionData.electricityHeatEmission
  });

  return (
    <div className="none-ferrous-metals-industry">
      <Card title="其他有色金属冶炼和压延加工业企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          适用于中国除铝冶炼和镁冶炼之外的其他有色金属冶炼和压延加工业企业温室气体排放量的核算和报告， 
        </Paragraph>
        <Paragraph> 
          中国境内以有色金属冶炼和压延加工（除铝冶炼和镁冶炼之外） 为主营业务的企业可按照本指南提供的方法核算温室气体排放量， 并编制企业温室气体排放报告。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、能源作为原材料用途的排放、工业生产过程排放（主要是各种碳酸盐以及草酸发生分解反应所导致的二氧化碳排放）、净购入电力和热力隐含的CO2排放。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <IndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
              <NoneFerrousMetalsFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
              />
          </TabPane>
          <TabPane tab="能源作为原材料用途的排放" key="energy">
            <NoneFerrousMetalsEnergyEmission 
              onEmissionChange={(value) => handleEmissionChange('energyEmission', value)}
            />
          </TabPane>
          <TabPane tab="工业生产过程中排放" key="process">
            <NoneFerrousMetalsProcessEmission 
              onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
              productionLines={processes} 
              onProductionLinesChange={handleProcessesChange}
            />
          </TabPane>
          <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
            <NetElectricityHeatEmission 
              onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbonInventory">
            <NoneFerrousMetalsCarbonInventory />
          </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default NoneFerrousMetalsIndustry;
