import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import CarbonateEmission from '../CarbonateEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import NonFerrousMetalsIndustrySummary from './NonFerrousMetalsIndustrySummary';
import EnergyRawMaterialEmission from '../EnergyRawMaterialEmission'; // 新组件
import OxalateProcessEmission from '../OxalateProcessEmission'; // 新组件
import { INDUSTRY_TYPES } from '../../config/industryConfig';

function NonFerrousMetalsIndustry({ industry = '其他有色金属冶炼和压延加工业' }) {
  // 行业特定的排放数据状态
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    energyRawMaterialEmission: 0, // 能源的原材料用途排放
    carbonateEmission: 0,
    oxalateProcessEmission: 0, // 草酸的CO2排放
    electricityHeatEmission: 0
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
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('fossilFuelEmission', emissionValue);
  }, [updateEmissionData]);

  const handleEnergyRawMaterialEmissionChange = useCallback((value) => {
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('energyRawMaterialEmission', emissionValue);
  }, [updateEmissionData]);

  const handleCarbonateEmissionChange = useCallback((value) => {
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('carbonateEmission', emissionValue);
  }, [updateEmissionData]);

  const handleOxalateProcessEmissionChange = useCallback((value) => {
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('oxalateProcessEmission', emissionValue);
  }, [updateEmissionData]);

  const handleElectricityHeatEmissionChange = useCallback((value) => {
    // 电力热力排放需要特殊处理，可能包含electricityEmission和heatEmission
    if (typeof value === 'object') {
      const totalEmission = (value.electricityEmission || 0) + (value.heatEmission || 0);
      updateEmissionData('electricityHeatEmission', totalEmission);
    } else {
      updateEmissionData('electricityHeatEmission', value);
    }
  }, [updateEmissionData]);

  // Tab配置
  const tabItems = [
    {
      key: 'summary',
      label: '汇总表',
      children: (
        <div className="summary-tab-content">
          <h3>{industry} - 汇总表</h3>
          <NonFerrousMetalsIndustrySummary 
            data={emissionData} 
            industry={industry}
            onDataChange={setEmissionData}
          />
        </div>
      )
    },
    {
      key: 'fossil-fuel',
      label: '化石燃料燃烧 CO2 排放',
      children: <FossilFuelEmission 
        onEmissionChange={handleFossilFuelEmissionChange} 
        industry={INDUSTRY_TYPES.NON_FERROUS_METALS} 
      />
    },
    {
      key: 'energy-raw-material',
      label: '能源的原材料用途',
      children: <EnergyRawMaterialEmission 
        onEmissionChange={handleEnergyRawMaterialEmissionChange} 
        industry={industry} 
      />
    },
    {
      key: 'carbonate',
      label: '碳酸盐使用过程 CO2 排放',
      children: <CarbonateEmission 
        onEmissionChange={handleCarbonateEmissionChange} 
        industry={industry} 
      />
    },
    {
      key: 'oxalate-process',
      label: '工业生产过程中的草酸的CO2排放',
      children: <OxalateProcessEmission 
        onEmissionChange={handleOxalateProcessEmissionChange} 
        industry={industry} 
      />
    },
    {
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission 
        onEmissionChange={handleElectricityHeatEmissionChange} 
        industry={industry} 
      />
    },
  ];

  return (
    <div className="industry-component">
      <div className="emission-tabs">
        <Tabs defaultActiveKey="summary" items={tabItems} />
      </div>
    </div>
  );
}

export default NonFerrousMetalsIndustry;