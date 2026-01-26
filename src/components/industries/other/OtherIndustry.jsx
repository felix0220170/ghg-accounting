import { useState, useCallback } from 'react';
import { Card, Tabs, Typography } from 'antd';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
import IndustrySummary from './OtherIndustrySummary';
import NetElectricityHeatEmission from '../common/NetElectricityHeatEmission';
import CarbonInventory from './OtherCarbonInventory';
import FossilFuelEmission from '../chemical/ChemicalFossilFuelEmission';
import OtherProcessEmission from '../chemical/ChemicalCarbonateDecompositionEmission';
import OtherWastewaterTreatmentEmission from './OtherWastewaterTreatmentEmission';
import OtherCH4RecyclingUtilization from './OtherCH4RecyclingUtilization';
import CO2RecyclingUtilization from '../common/CO2RecyclingUtilization';



function OtherIndustry({ onEmissionChange }) {    
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
    processEmission: emissionData.processEmission || 0,
    wastewaterTreatmentEmission: emissionData.wastewaterTreatmentEmission || 0,
    ch4RecyclingEmission: emissionData.ch4RecyclingEmission || 0,
    co2RecyclingEmission: emissionData.co2RecyclingEmission || 0,
    electricityHeatEmission: emissionData.electricityHeatEmission || 0
  });

  return (
    <div className="food-industry">
      <Card title="工业其他行业企业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于适用于那些尚没有针对性的行业企业温室气体核算方法与报告指南
的工业其他行业企业温室气体排放量的核算和报告。 随着重点企事业单位温室气体报告工作以及全国碳排放权交易制度的推进， 国家有可能根据实践需要适时增
补某些特定行业的企业温室气体排放核算方法与报告指南。 一经增补， 将不再适用于该行业企业。
        </Paragraph>
        <Paragraph>
          核算范围包括：
        </Paragraph>
        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
          <li>化石燃料燃烧排放：主要指企业用于动力或热力供应的化石燃料燃烧过程产生的CO₂排放，包括氧乙炔焊接或切割燃烧乙炔产生的CO₂排放量</li>
          <li>碳酸盐使用过程CO₂排放：指石灰石、白云石等碳酸盐在用作生产原料、助熔剂、脱硫剂或其他用途的使用过程中发生分解产生的CO₂排放</li>
          <li>废水厌氧处理排放：包括废水厌氧处理过程中产生的甲烷排放，以及折算成二氧化碳的排放量</li>
          <li>CH₄回收与销毁量：企业通过回收利用或火炬焚毁等措施处理废水处理产生的甲烷气从而免于排放到大气中的CH₄量，其中回收利用包括企业回收自用以及回收作为产品外供给其他单位</li>
          <li>CO₂回收利用量：企业回收燃料燃烧或工业生产过程产生的CO₂作为生产原料自用或作为产品外供给其它单位，从而免于排放到大气中的CO₂量</li>
          <li>净购入电力和热力隐含的CO₂排放：包括企业从外部购入的电力和热力所隐含的二氧化碳排放</li>
        </ul>
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
                title='主要指企业用于动力或热力供应的化石燃料燃烧过程产生的CO₂排放，包括氧乙炔焊接或切割燃烧乙炔产生的CO₂排放量'
                />
          </TabPane>
          <TabPane tab="碳酸盐使用过程 CO₂ 排放" key="processEmission">
            <OtherProcessEmission 
              onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
              productionLines={processes} 
              onProductionLinesChange={handleProcessesChange}
              title='指石灰石、白云石等碳酸盐在用作生产原料、助熔剂、脱硫剂或其他用途的使用过程中发生分解产生的CO₂排放'
              />
          </TabPane>
          <TabPane tab="废水厌氧处理排放" key="wastewaterTreatment">
            <OtherWastewaterTreatmentEmission 
              onEmissionChange={(value) => handleEmissionChange('wastewaterTreatmentEmission', value)}
              isPaper={false}
            />
          </TabPane>
          <TabPane tab="CH₄回收与销毁量" key="ch4Recycling">
            <OtherCH4RecyclingUtilization 
              onEmissionChange={(value) => handleEmissionChange('ch4RecyclingEmission', value)}
            />
          </TabPane>
          <TabPane tab="CO₂回收利用量" key="co2Recycling">
            <CO2RecyclingUtilization 
              onEmissionChange={(value) => handleEmissionChange('co2RecyclingEmission', value)}
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

export default OtherIndustry;
