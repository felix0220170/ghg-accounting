import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import GasIndustrySummary from './GasIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import GasCarbonInventory from './GasCarbonInventory';
import GasFossilFuelEmission from '../coal/CoalFossilFuelEmission';
import GasTorchEmission from './GasTorchEmission';
import GasExplorationCH4Emission from './GasExplorationCH4Emission';
import GasOilProductionEmission from './GasOilProductionEmission';
import GasOilProcessingEmission from './GasOilProcessingEmission';
import GasOilStorageEmission from './GasOilStorageEmission';
import CO2RecyclingUtilization from '../common/CO2RecyclingUtilization';
import CH4RecyclingUtilization from '../common/CH4RecyclingUtilization';

function GasIndustry({ onEmissionChange }) {
  const [fuelProcesses, setFuelProcesses] = useState([]);

  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    electricity: 0,
    heat: 0,
    torchEmission: 0, // 火炬燃烧排放
    carbonateDecompositionEmission: 0, // 油气勘探业务温室气体排放
    electricityHeatEmission: 0, // 购入净电（化石）和净热
    oilGasProductionEmission: 0, // 油气开采业务温室气体排放
    oilGasProcessingEmission: 0, // 油气处理业务温室气体排放
    oilGasStorageEmission: 0, // 油气储运业务温室气体排放
    recyclingEmission: 0, // 企业CO2回收利用量
    ch4RecyclingEmission: 0 // 企业CH4回收利用量
  });
  
  // 详细排放数据，用于工序排放量汇总组件
  const [fossilFuelEmissions, setFossilFuelEmissions] = useState({});
  
  // 处理工序变化
  const handleProcessesChange = (updatedProcesses) => {
    // 通知父组件工序信息变化
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: calculateTotalEmission,
        processes: updatedProcesses
      });
    }
  };

  const handleFuelProcessesChange = (updatedProcesses) => {
    setFuelProcesses(updatedProcesses);
  };

  // 处理各组件排放量变化
  const handleEmissionChange = useCallback((key, value) => {
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
  }, []);

  // 记忆化传递给GasOilProcessingEmission组件的onEmissionChange函数
  const handleOilGasProcessingEmissionChange = useCallback((value) => {
    handleEmissionChange('oilGasProcessingEmission', value);
  }, [handleEmissionChange]);

  // 计算总排放量
  const calculateTotalEmission = useMemo(() => {
    return Object.values(emissionData).reduce((sum, value) => sum + value, 0);
  }, [emissionData]);

  // 当总排放量变化时通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: calculateTotalEmission
      });
    }
  }, [emissionData, calculateTotalEmission, onEmissionChange]);

  // 准备传递给Summary组件的数据格式
  const prepareSummaryData = () => ({
    fossilFuelEmission: emissionData.fossilFuel, // 化石燃料燃烧排放
    torchEmission: emissionData.torchEmission, // 火炬燃烧排放
    carbonateDecompositionEmission: emissionData.carbonateDecompositionEmission, // 油气勘探业务温室气体排放
    oilGasProductionEmission: emissionData.oilGasProductionEmission, // 油气开采业务温室气体排放
    oilGasProcessingEmission: emissionData.oilGasProcessingEmission, // 油气处理业务温室气体排放
    oilGasStorageEmission: emissionData.oilGasStorageEmission, // 油气储运业务温室气体排放
    electricityHeatEmission: emissionData.electricityHeatEmission, // 购入净电（化石）和净热隐含的CO2排放
    recyclingEmission: emissionData.recyclingEmission, // 企业CO2回收利用量
    ch4RecyclingEmission: emissionData.ch4RecyclingEmission // 企业CH4回收利用量
  });

  return (
    <div className="aero-industry">
      <Card title="中国石油和天然气生产企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于中国石油和天然气生产企业开展温室气体排放核算。石油和天然气生产企业的温室气体排放总量等于企业核算边界内化石燃料燃烧的排放、火炬燃烧排放、油气勘探业务温室气体排放、油气开采业务温室气体排放、油气处理业务温室气体排放、油气储运业务温室气体排放以及净购入使用电力及热力产生的二氧化碳排放之和，再扣除企业CO2回收利用量和企业CH4回收利用量。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、火炬燃烧排放、油气勘探业务温室气体排放、油气开采业务温室气体排放、油气处理业务温室气体排放、油气储运业务温室气体排放、购入净电（化石）和净热隐含的CO2排放，以及扣除企业CO2回收利用量、企业CH4回收利用量。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary">
        <TabPane tab="排放汇总" key="summary">
          <GasIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
            <GasFossilFuelEmission 
              onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
              productionLines={fuelProcesses} 
              onProductionLinesChange={handleFuelProcessesChange}
            />
        </TabPane>
        <TabPane tab="火炬燃烧排放" key="torchEmission">
          <GasTorchEmission 
            onEmissionChange={(value) => handleEmissionChange('torchEmission', value)}
          />
        </TabPane>
        <TabPane tab="油气勘探业务温室气体排放" key="carbonateDecompositionEmission">
          <GasExplorationCH4Emission 
            onEmissionChange={(value) => handleEmissionChange('carbonateDecompositionEmission', value)}
          />
        </TabPane>
        <TabPane tab="油气开采业务温室气体排放" key="oilGasProductionEmission">
          <GasOilProductionEmission 
            onEmissionChange={(value) => handleEmissionChange('oilGasProductionEmission', value)}
          />
        </TabPane>
        {
  
        
        <TabPane tab="油气处理业务温室气体排放" key="oilGasProcessingEmission">
          <GasOilProcessingEmission 
            onEmissionChange={handleOilGasProcessingEmissionChange}
          />
        </TabPane>
       }
       <TabPane tab="油气储运业务温室气体排放" key="oilGasStorageEmission">
          <GasOilStorageEmission 
            onEmissionChange={(value) => handleEmissionChange('oilGasStorageEmission', value)}
          />
        </TabPane>
         <TabPane tab="企业CO2回收利用量" key="recycling">
            <CO2RecyclingUtilization 
              onEmissionChange={(value) => handleEmissionChange('recyclingEmission', value)}
            />
          </TabPane>
          <TabPane tab="企业CH4回收利用量" key="ch4Recycling">
            <CH4RecyclingUtilization 
              onEmissionChange={(value) => handleEmissionChange('ch4RecyclingEmission', value)}
            />
          </TabPane>
        <TabPane tab="购入净电（化石）和净热" key="electricityHeat">
          <NetElectricityHeatEmission 
            onEmissionChange={(value) => handleEmissionChange('electricityHeatEmission', value)}
          />
        </TabPane>
        <TabPane tab="碳排查材料清单" key="carbonInventory">
          <GasCarbonInventory />
        </TabPane>
        
      </Tabs>
        
    </div>
  );
}

export default GasIndustry;
