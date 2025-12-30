import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './FluorineIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CarbonInventory from './FluorineCarbonInventory';
import FluorineProcessEmission from './FluorineProcessEmission';
import FossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import FluorineHFCsPFCsSF6Emission from './FluorineHFCsPFCsSF6Emission';

function FluorineIndustry({ onEmissionChange }) {
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
    electricityHeatEmission: emissionData.electricityHeatEmission,
    HFCsPFCsSF6Emission: emissionData.HFCsPFCsSF6Emission
  });

  return (
    <div className="electronic-industry">
      <Card title="氟化工企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于氟化工企业开展温室气体排放核算。氟化工行业包括氟化氢生产、HCFC-22生产、
          HFCs/PFCs/SF6生产等环节，其碳排放主要来自化石燃料燃烧、HCFC-22生产过程HFC-23副产物排放、
          HFCs/PFCs/SF6生产过程副产物及逃逸排放、净购入电力和热力等。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、HCFC-22生产过程中HFC-23排放、HFCs/PFCs/SF6生产过程副产物及逃逸排放、
          净购入电力和热力隐含的CO2排放。
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
                title="主要指企业用于动力或热力供应的化石燃料燃烧过程产生的 CO2 排放， 包括 HFC-23 销毁装置所消耗的化石燃料产生的 CO2 排放量"
              />
          </TabPane>
          <TabPane tab="HCFC-22 生产过程 HFC-23 排放" key="processEmission">
            <FluorineProcessEmission 
              onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
            />
          </TabPane>
          <TabPane tab="HFCs/PFCs/SF6 生产过程副产物及逃逸排放" key="HFCsPFCsSF6Emission">
            <FluorineHFCsPFCsSF6Emission 
              onEmissionChange={(value) => handleEmissionChange('HFCsPFCsSF6Emission', value)}
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

export default FluorineIndustry;
