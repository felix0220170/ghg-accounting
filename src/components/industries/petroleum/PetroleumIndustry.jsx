import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import PetroleumIndustrySummary from './PetroleumIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import PetroleumCarbonInventory from './PetroleumCarbonInventory';
import PetroleumFossilFuelEmission from '../coal/CoalFossilFuelEmission';
import PetroleumTorchEmission from './PetroleumTorchEmission';
import CO2RecyclingUtilization from '../common/CO2RecyclingUtilization';
import PetroleumCatalyticCrackingEmission from './PetroleumCatalyticCrackingEmission';
import PetroleumCatalyticReformingEmission from './PetroleumCatalyticReformingEmission';
import RetroleumOtherCatalystEmission from './PetroleumOtherCatalystEmission';
import PetroleumHydrogenProductionEmission from './PetroleumHydrogenProductionEmission';
import PetroleumCokingPlantEmission from './PetroleumCokingPlantEmission';
import PetroleumCokeCalciningEmission from './PetroleumCokeCalciningEmission';
import PetroleumOxidizedAsphaltEmission from './PetroleumOxidizedAsphaltEmission';
import PetroleumEthyleneCrackingEmission from './PetroleumEthyleneCrackingEmission';
import PetroleumEthyleneGlycolEmission from './PetroleumEthyleneGlycolEmission';

function PetroleumIndustry({ onEmissionChange }) {
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
    ch4RecyclingEmission: 0, // 企业CH4回收利用量
    catalyticCrackingEmission: 0, // 催化裂化装置催化剂烧焦排放
    catalyticReformingEmission: 0, // 催化重整装置催化剂烧焦排放
    otherCatalystEmission: 0, // 其它装置催化剂烧焦排放
    hydrogenProductionEmission: 0, // 制氢装置排放
    cokingPlantEmission: 0, // 焦化装置排放
    petroleumCokeCalciningEmission: 0, // 石油焦煅烧装置排放
    oxidizedAsphaltEmission: 0, // 氧化沥青装置排放
    ethyleneCrackingEmission: 0, // 乙烯裂解装置排放
    ethyleneGlycolEmission: 0 // 乙二醇/环氧乙烷生产装置排放
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
    ch4RecyclingEmission: emissionData.ch4RecyclingEmission, // 企业CH4回收利用量
    catalyticCrackingEmission: emissionData.catalyticCrackingEmission, // 催化裂化装置催化剂烧焦排放
    catalyticReformingEmission: emissionData.catalyticReformingEmission, // 催化重整装置催化剂烧焦排放
    otherCatalystEmission: emissionData.otherCatalystEmission, // 其它装置催化剂烧焦排放
    hydrogenProductionEmission: emissionData.hydrogenProductionEmission, // 制氢装置排放
    cokingPlantEmission: emissionData.cokingPlantEmission, // 焦化装置排放
    petroleumCokeCalciningEmission: emissionData.petroleumCokeCalciningEmission, // 石油焦煅烧装置排放
    oxidizedAsphaltEmission: emissionData.oxidizedAsphaltEmission, // 氧化沥青装置排放
    ethyleneCrackingEmission: emissionData.ethyleneCrackingEmission, // 乙烯裂解装置排放
    ethyleneGlycolEmission: emissionData.ethyleneGlycolEmission // 乙二醇/环氧乙烷生产装置排放
  });

  return (
    <div className="aero-industry">
      <Card title="中国石油化工企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于中国石油化工企业开展温室气体排放核算。石油化工企业的温室气体排放总量等于企业核算边界内化石燃料燃烧排放、火炬燃烧排放、工业生产过程排放以及净购入使用电力及热力产生的二氧化碳排放之和，再扣除企业CO2回收利用量和企业CH4回收利用量。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、企业级火炬燃烧排放、工业生产过程CO2排放（包括催化裂化装置催化剂烧焦排放、催化重整装置催化剂烧焦排放、其它装置催化剂烧焦排放、制氢装置排放、焦化装置排放、石油焦煅烧装置排放、氧化沥青装置排放、乙烯裂解装置排放、乙二醇/环氧乙烷生产装置排放）、购入净电（化石）和净热隐含的CO2排放，以及扣除企业CO2回收利用量、企业CH4回收利用量。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary">
        <TabPane tab="排放汇总" key="summary">
          <PetroleumIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="化石燃料燃烧排放" key="fossilFuel">
            <PetroleumFossilFuelEmission 
              onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
              productionLines={fuelProcesses} 
              onProductionLinesChange={handleFuelProcessesChange}
            />
        </TabPane>
        <TabPane tab="火炬燃烧排放" key="torchEmission">
          <PetroleumTorchEmission 
            onEmissionChange={(value) => handleEmissionChange('torchEmission', value)}
          />
        </TabPane>
      
        
        {/* 工业生产过程排放 */}
        <TabPane tab="工业生产过程 CO2 排放" key="processingEmissions">
          <Tabs defaultActiveKey="catalyticCracking">
            <TabPane tab="催化裂化装置催化剂烧焦排放" key="catalyticCracking">
              <PetroleumCatalyticCrackingEmission 
                onEmissionChange={(value) => handleEmissionChange('catalyticCrackingEmission', value)}
              />
            </TabPane>
            <TabPane tab="催化重整装置催化剂烧焦排放" key="catalyticReforming">
              <PetroleumCatalyticReformingEmission 
                onEmissionChange={(value) => handleEmissionChange('catalyticReformingEmission', value)}
              />
            </TabPane>
            <TabPane tab="其它装置催化剂烧焦排放" key="otherCatalyst">
              <RetroleumOtherCatalystEmission 
                onEmissionChange={(value) => handleEmissionChange('otherCatalystEmission', value)}
              />
            </TabPane>
            <TabPane tab="制氢装置排放" key="hydrogenProduction">
              <PetroleumHydrogenProductionEmission 
                onEmissionChange={(value) => handleEmissionChange('hydrogenProductionEmission', value)}
              />
            </TabPane>
            <TabPane tab="焦化装置排放" key="cokingPlant">
              <PetroleumCokingPlantEmission 
                onEmissionChange={(value) => handleEmissionChange('cokingPlantEmission', value)}
              />
            </TabPane>
            <TabPane tab="石油焦煅烧装置排放" key="petroleumCokeCalcining">
              <PetroleumCokeCalciningEmission 
                onEmissionChange={(value) => handleEmissionChange('petroleumCokeCalciningEmission', value)}
              />
            </TabPane>
            <TabPane tab="氧化沥青装置排放" key="oxidizedAsphalt">
              <PetroleumOxidizedAsphaltEmission 
                onEmissionChange={(value) => handleEmissionChange('oxidizedAsphaltEmission', value)}
              />
            </TabPane>
            <TabPane tab="乙烯裂解装置排放" key="ethyleneCracking">
              <PetroleumEthyleneCrackingEmission 
                onEmissionChange={(value) => handleEmissionChange('ethyleneCrackingEmission', value)}
              />
            </TabPane>
            <TabPane tab="乙二醇/环氧乙烷生产装置排放" key="ethyleneGlycol">
              <PetroleumEthyleneGlycolEmission 
                onEmissionChange={(value) => handleEmissionChange('ethyleneGlycolEmission', value)}
              />
            </TabPane>
          </Tabs>
        </TabPane>

        <TabPane tab="企业级碳回收利用" key="recycling">
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
          <PetroleumCarbonInventory /> 
        </TabPane>
      
      </Tabs>
        
    </div>
  );
}

export default PetroleumIndustry;
