import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import AeroIndustrySummary from './AeroIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import AeroCarbonInventory from './AeroCarbonInventory';
import AeroFossilFuelEmission from './AeroFossilFuelEmission';

function AeroIndustry({ onEmissionChange }) {
  const [fuelProcesses, setFuelProcesses] = useState([{
      id: 'fule-process-1',
      processName: '国内航班',
    }, {
      id: 'fule-process-2',
      processName: '国际航班',
    }]);

  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    electricity: 0,
    heat: 0,
    electricityHeatEmission: 0
  });
  
  // 详细排放数据，用于工序排放量汇总组件
  const [fossilFuelEmissions, setFossilFuelEmissions] = useState({});
  
  // 处理工序变化
  const handleProcessesChange = (updatedProcesses) => {
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
      if (key === 'fossilFuel') {
        setFossilFuelEmissions(value.processEmissions || {});
      }
    }
  };

  // 计算总排放量并通知父组件
  const calculateTotalEmission = () => {
    const total = Object.values(emissionData).reduce((sum, value) => sum + value, 0);
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: total
      });
    }
    return total;
  };

  // 准备传递给Summary组件的数据格式
  const prepareSummaryData = () => ({
    fossilFuelEmission: emissionData.fossilFuel,
    electricityHeatEmission: emissionData.electricityHeatEmission
  });

  return (
    <div className="aero-industry">
      <Card title="中国民航企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于中国民航企业开展温室气体排放核算。民用航空企业的温室气体排放总量等于企业核算边界内燃料燃烧的二氧化碳排放以及净购入使用电力及热力产生的二氧化碳排放。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、净购入电力和热力隐含的CO2排放。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <AeroIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
              <AeroFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
              />
          </TabPane>
          <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
            <NetElectricityHeatEmission 
              onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
            />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbonInventory">
            <AeroCarbonInventory />
          </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default AeroIndustry;
