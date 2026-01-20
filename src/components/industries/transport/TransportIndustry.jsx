import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './TransportIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CarbonInventory from './TransportCarbonInventory';
import FossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import TailGasPurificationEmission from './TailGasPurificationEmission';
import TransportFossilFuelGHGEmission from './TransportFossilFuelGHGEmission';


function TransportIndustry({ onEmissionChange }) {    
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
    otherEmission: 0,
    fossilFuelGHGEmission: 0
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
    fossilFuelGHGEmission: emissionData.fossilFuelGHGEmission || 0,
    tailGasPurificationEmission: emissionData.tailGasPurificationEmission || 0,
    electricityHeatEmission: emissionData.electricityHeatEmission || 0
  });

  return (
    <div className="mine-industry">
      <Card title="陆上交通运输企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          适用于中国陆上交通运输企业温室气体排放量的核算和报告。 <br/>
          中国境内从事公路旅客运输、 道路货物运输、 城市客运、 道路运输辅助活动（如公路维修与养护、 高速公路运营管理等） 、铁路运输的企业以及各沿海和内河港口企业均可按照本指南提供的方法核算企业温室气体排放量， 并编制企业温室气体排放报告
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、化石燃料燃烧产生的甲烷和氧化亚氮排放、尾气净化过程排放以及净购入电力和热力隐含的CO2排放。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <IndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧CO₂排放" key="fossilFuel">
              <FossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
                title='净消耗的化石燃料燃烧产生的CO₂排放， 包括陆上交通
运输企业内移动源排放 （如运输车辆、 内燃机车等） 及固定源排
放（如锅炉等）'
              />
          </TabPane>
          <TabPane tab="化石燃料燃烧甲烷和氧化亚氮排放" key="fossilFuelGHG">
            <TransportFossilFuelGHGEmission 
              onEmissionChange={(value) => handleEmissionChange('fossilFuelGHGEmission', value)}
            />
          </TabPane>
          <TabPane tab="尾气净化过程CO₂排放" key="tailGasPurification">
            <TailGasPurificationEmission 
              onEmissionChange={(value) => handleEmissionChange('tailGasPurificationEmission', value)}
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

export default TransportIndustry;
