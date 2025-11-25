import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Card, Tabs } from 'antd';
import AluminumProcessManagement from './AluminumProcessManagement';
import AluminumFossilFuelEmission from './AluminumFossilFuelEmission';
import AluminumCarbonAnodeEmission from './AluminumCarbonAnodeEmission';
import AluminumAnodeEffectEmission from './AluminumAnodeEffectEmission';
import CarbonateDecompositionEmission from './CarbonateDecompositionEmission';
import AluminumOtherEmission from './AluminumOtherEmission';
import AluminumSummary from './AluminumSummary';
import AluminumCarbonInventory from './AluminumCarbonInventory';
import AluminumACConsumption from './AluminumACConsumption';
import AluminumNetElectricityHeatEmission from './AluminumNetElectricityHeatEmission';

const { Content } = Layout;
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const AluminumIndustryPage = () => {
  const [fuelProcesses, setFuelProcesses] = useState([{
    id: 'fule-process-1',
    processName: '化石燃料工序placeholder',
  }]);

  // 初始化两个demo工序数据
  const [processes, setProcesses] = useState([
    {
      id: 'demo-process-1',
      processName: '1#电解铝工序(预焙阳极电解槽)',
      designCurrent: '300', // 设计电流（kA）
      designVoltage: '4.2', // 设计电压（V）
      cellCount: '200', // 电解槽数量（个）
      rectifierCount: '10', // 整流器数量（套）
      productionCapacity: '40', // 产能（万吨/年）
      supportingMaterials: {}
    },
    {
      id: 'demo-process-2',
      processName: '2#电解铝工序(侧插槽电解槽)',
      designCurrent: '150', // 设计电流（kA）
      designVoltage: '4.5', // 设计电压（V）
      cellCount: '100', // 电解槽数量（个）
      rectifierCount: '5', // 整流器数量（套）
      productionCapacity: '15', // 产能（万吨/年）
      supportingMaterials: {}
    }
  ]);

  // 燃料项状态管理
  const [fuelItems, setFuelItems] = useState([]);
  // 自定义燃料状态管理
  const [customFuels, setCustomFuels] = useState([]);
  // 排放量数据状态管理
  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    processEmission: 0,
    carbonAnode: 0
  });

  // 监听燃料项变化，更新总排放量
  useEffect(() => {
    // 计算燃料项的总排放量
    const total = fuelItems.reduce((sum, item) => {
      const yearlyEmission = item.monthlyData?.reduce((yearTotal, monthData) => {
        return yearTotal + (parseFloat(monthData.emission) || 0);
      }, 0) || 0;
      return sum + yearlyEmission;
    }, 0);
    
    setEmissionData(prev => ({
      ...prev,
      fossilFuel: total
    }));
  }, [fuelItems]);

  // 处理工序变化
  const handleProcessesChange = useCallback((updatedProcesses) => {
    setProcesses(updatedProcesses);
  }, []);

  // 处理工序变化
  const handleFuelProcessesChange = (updatedProcesses) => {
    setFuelProcesses(updatedProcesses);
  };

  // 处理排放量变化
  const handleEmissionChange = (key, value) => {
    // 更新排放量数据
    setEmissionData(prev => ({
      ...prev,
      [key]: typeof value === 'object' && value !== null ? value.totalEmission || 0 : value || 0
    }));
  };

  // 准备传递给Summary组件的数据格式
  const prepareSummaryData = () => ({
    totalEmission: emissionData.fossilFuel,
    processEmission: emissionData.processEmission,
    carbonAnode: emissionData.carbonAnode,
    anodeEffect: emissionData.anodeEffect || 0,
    carbonateDecomposition: emissionData.carbonateDecomposition || 0,
    otherEmission: emissionData.otherEmission || 0,
    netElectricityHeat: emissionData.netElectricityHeat || 0
  });

  return (
    <div className="aluminum-industry">
      <Card title="铝冶炼行业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本页面用于铝冶炼行业的温室气体排放核算，包括工序管理、化石燃料燃烧排放等功能模块。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、铝冶炼工序排放、发电设施及其他非生产设施排放等。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary">
          <TabPane tab="排放汇总" key="summary">
              <AluminumSummary emissionData={prepareSummaryData()} />
          </TabPane>  
          <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
              <AluminumFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
              />
          </TabPane>
          <TabPane tab="工序管理" key="processManagement">
              <AluminumProcessManagement 
                processes={processes} 
                onProcessesChange={handleProcessesChange} 
              />
          </TabPane>
          <TabPane tab="铝电解工序能源作为原材料用途的排放" key="carbonAnode">
              <AluminumCarbonAnodeEmission 
                onEmissionChange={(value) => handleEmissionChange('carbonAnode', value)}
                productionLines={processes} 
                onProductionLinesChange={handleProcessesChange}
              />
          </TabPane>
          <TabPane tab="铝电解工序阳极效应排放" key="anode-effect">
              <AluminumAnodeEffectEmission 
                onEmissionChange={(value) => handleEmissionChange('anodeEffect', value)}
                productionLines={processes} 
                onProductionLinesChange={handleProcessesChange}
              />
          </TabPane>
          <TabPane tab="企业层级碳酸盐分解排放" key="carbonate-decomposition">
              <CarbonateDecompositionEmission 
                onEmissionChange={(value) => handleEmissionChange('carbonateDecomposition', value)}
                productionLines={processes} 
                onProductionLinesChange={handleProcessesChange}
              />
          </TabPane>
          <TabPane tab="发电设施及其他非铝冶炼生产设施排放量" key="other-emission">
              <AluminumOtherEmission 
                onEmissionChange={(value) => handleEmissionChange('otherEmission', value)}
                productionLines={processes} 
                onProductionLinesChange={handleProcessesChange}
              />
          </TabPane>
          <TabPane tab="碳排查材料清单" key="carbon-inventory">
              <AluminumCarbonInventory 
                onEmissionChange={(value) => handleEmissionChange('carbonInventory', value)}
                productionLines={processes} 
                onProductionLinesChange={handleProcessesChange}
              />
          </TabPane>
          <TabPane tab="铝电解工序AC消耗(辅助报告项1)" key="ac-consumption">
              <AluminumACConsumption 
                onEmissionChange={(value) => handleEmissionChange('acConsumption', value)}
                productionLines={processes} 
                onProductionLinesChange={handleProcessesChange}
              />
          </TabPane>
          <TabPane tab="企业层级净购入使用电量和热量(辅助报告项2)" key="net-electricity-heat">
              <AluminumNetElectricityHeatEmission 
                onEmissionChange={(value) => handleEmissionChange('netElectricityHeat', value)}
                productionLines={processes} 
                onProductionLinesChange={handleProcessesChange}
              />
          </TabPane>
        </Tabs>
    </div>
  );
};

export default AluminumIndustryPage;