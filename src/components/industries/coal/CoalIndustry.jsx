import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import CoalIndustrySummary from './CoalIndustrySummary';
import CoalFossilFuelEmission from './CoalFossilFuelEmission';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CoalCarbonInventory from './CoalCarbonInventory';
import CoalTorchEmission from './CoalTorchEmission';
import CoalMineCH4Emission from './CoalMineCH4Emission';
import CoalMineCO2Emission from './CoalMineCO2Emission';
import CoalActivityEmission from './CoalActivityEmission';

function CoalIndustry({ onEmissionChange }) {
  const [fuelProcesses, setFuelProcesses] = useState([]);

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
    torchEmission: emissionData.torchEmission,
    mineCH4Emission: emissionData.mineCH4Emission,
    mineCO2Emission: emissionData.mineCO2Emission,
    activityCH4Emission: emissionData.activityCH4Emission,
    electricityHeatEmission: emissionData.electricityHeatEmission
  });

  const dummy = useCallback((value) => {

  }, []);

  return (
    <div className="coking-industry">
      <Card title="煤炭行业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于煤炭行业企业开展温室气体排放核算。煤炭行业是重要的能源产业，
          其碳排放主要来自化石燃料燃烧、煤矿瓦斯排放、煤矿井工开采逃逸排放等环节。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、煤矿瓦斯火炬燃烧排放、井工开采的CH4逃逸排放、井工开采的CO2逃逸排放、
          露天煤矿和矿后活动的CH4逃逸排放、购入净电（化石）和净热排放等。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <CoalIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
              <CoalFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
              />
          </TabPane>
          <TabPane tab="煤矿瓦斯火炬燃烧的排放" key="torchEmission">
            <CoalTorchEmission 
              onEmissionChange={(value) => handleEmissionChange('torchEmission', value)}
            />
          </TabPane>
          <TabPane tab="井工开采的CH4 逃逸排放" key="mineCH4Emission">
            <CoalMineCH4Emission 
              onEmissionChange={(value) => handleEmissionChange('mineCH4Emission', value)}
            />
          </TabPane>
          <TabPane tab="井工开采的CO2 逃逸排放" key="mineCO2Emission">
            <CoalMineCO2Emission 
              onEmissionChange={(value) => handleEmissionChange('mineCO2Emission', value)}
            />
          </TabPane>
          <TabPane tab="露天煤矿和矿后活动的CH4逃逸排放" key="activityCH4Emission">
            <CoalActivityEmission 
              onEmissionChange={(value) => handleEmissionChange('activityCH4Emission', value)}
            />
          </TabPane>

          <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
            <NetElectricityHeatEmission 
              onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbonInventory">
            <CoalCarbonInventory />
          </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default CoalIndustry;
