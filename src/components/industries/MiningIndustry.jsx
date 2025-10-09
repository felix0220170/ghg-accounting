import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import CarbonateEmission from '../CarbonateEmission';
import CarbonationAbsorptionEmission from '../CarbonationAbsorptionEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import MiningIndustrySummary from './MiningIndustrySummary';

function MiningIndustry({ industry = '矿山企业' }) {
  // 行业特定的排放数据状态
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    carbonateEmission: 0,
    carbonationAbsorptionEmission: 0, // 碳化工艺吸收的CO2量
    electricityHeatEmission: 0,
  });

  // 使用useCallback优化updateEmissionData函数
  const updateEmissionData = useCallback((type, value) => {
    setEmissionData(prev => ({
      ...prev,
      [type]: value
    }));
  }, []);

  // 各组件的回调函数
  const handleFossilFuelEmissionChange = useCallback((value) => {
    updateEmissionData('fossilFuelEmission', value);
  }, [updateEmissionData]);

  const handleCarbonateEmissionChange = useCallback((value) => {
    updateEmissionData('carbonateEmission', value);
  }, [updateEmissionData]);

  const handleCarbonationAbsorptionEmissionChange = useCallback((value) => {
    updateEmissionData('carbonationAbsorptionEmission', value);
  }, [updateEmissionData]);

  const handleElectricityHeatEmissionChange = useCallback((value) => {
    updateEmissionData('electricityHeatEmission', value);
  }, [updateEmissionData]);

  // Tab配置
  const tabItems = [
    {
      key: 'summary',
      label: '汇总表',
      children: (
        <div className="summary-tab-content">
          <h3>{industry} - 汇总表</h3>
          <MiningIndustrySummary data={emissionData} />
        </div>
      )
    },
    {
      key: 'fossil-fuel',
      label: '化石燃料燃烧 CO2 排放',
      children: <FossilFuelEmission onEmissionChange={handleFossilFuelEmissionChange} industry={industry} />
    },
    {
      key: 'carbonate',
      label: '碳酸盐使用过程 CO2 排放',
      children: <CarbonateEmission onEmissionChange={handleCarbonateEmissionChange} industry={industry} />
    },
    {
      key: 'carbonation-absorption',
      label: '碳化工艺吸收的 CO2 量',
      children: <CarbonationAbsorptionEmission onEmissionChange={handleCarbonationAbsorptionEmissionChange} industry={industry} />
    },
    {
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission onEmissionChange={handleElectricityHeatEmissionChange} industry={industry} />
    }
  ];

  return (
    <div className="mining-industry">
      <Tabs defaultActiveKey="summary" items={tabItems} />
    </div>
  );
}

export default MiningIndustry;