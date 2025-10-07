import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import CarbonateEmission from '../CarbonateEmission';
import PurchasedCO2Emission from '../PurchasedCO2Emission';
import WastewaterTreatmentEmission from '../WastewaterTreatmentEmission';
import MethaneRecoveryEmission from '../MethaneRecoveryEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import FoodIndustrySummary from './FoodIndustrySummary';
import { INDUSTRY_TYPES } from '../../config/industryConfig';

function FoodIndustry({ industry = '食品、烟草及酒、饮料和精制茶行业' }) {
  // 行业特定的排放数据状态，简化为与PaperIndustry类似的结构
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    carbonateEmission: 0,
    purchasedCO2Emission: 0,
    wastewaterTreatmentEmission: 0,
    methaneRecoveryEmission: 0,
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
    // 假设value是一个包含totalEmission的对象
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('fossilFuelEmission', emissionValue);
  }, [updateEmissionData]);

  const handleCarbonateEmissionChange = useCallback((value) => {
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('carbonateEmission', emissionValue);
  }, [updateEmissionData]);

  const handlePurchasedCO2EmissionChange = useCallback((value) => {
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('purchasedCO2Emission', emissionValue);
  }, [updateEmissionData]);

  const handleWastewaterTreatmentEmissionChange = useCallback((value) => {
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('wastewaterTreatmentEmission', emissionValue);
  }, [updateEmissionData]);

  const handleMethaneRecoveryEmissionChange = useCallback((value) => {
    const emissionValue = typeof value === 'object' && value.totalEmission !== undefined ? 
      value.totalEmission : value;
    updateEmissionData('methaneRecoveryEmission', emissionValue);
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

  // 标签页配置
  const tabs = [
    {
      key: 'summary',
      label: '汇总表',
      children: (
        <div className="summary-tab-content">
          <h3>{industry} - 汇总表</h3>
          <FoodIndustrySummary 
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
        industry={INDUSTRY_TYPES.FOOD} 
      />
    },
    {
      key: 'carbonate',
      label: '碳酸盐使用过程 CO2 排放',
      children: <CarbonateEmission 
        onEmissionChange={handleCarbonateEmissionChange} 
        industry={INDUSTRY_TYPES.FOOD} 
      />
    },
    {
      key: 'purchased-co2',
      label: '外购工业生产的二氧化碳',
      children: <PurchasedCO2Emission 
        onEmissionChange={handlePurchasedCO2EmissionChange} 
        industry={INDUSTRY_TYPES.FOOD} 
      />
    },
    {
      key: 'wastewater-treatment',
      label: '废水厌氧处理 CH4 排放',
      children: <WastewaterTreatmentEmission 
        onEmissionChange={handleWastewaterTreatmentEmissionChange} 
        industry={INDUSTRY_TYPES.FOOD} 
      />
    },
    {
      key: 'methane-recovery',
      label: 'CH4 回收与销毁量',
      children: <MethaneRecoveryEmission 
        onEmissionChange={handleMethaneRecoveryEmissionChange} 
        industry={INDUSTRY_TYPES.FOOD} 
      />
    },
    {
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission 
        onEmissionChange={handleElectricityHeatEmissionChange} 
        industry={INDUSTRY_TYPES.FOOD} 
      />
    }
  ];

  return (
    <div className="food-industry">
      {/* 排放计算标签页 - 保持水平布局 */}
      <div className="emission-tabs">
        <Tabs defaultActiveKey="summary" items={tabs} />
      </div>
    </div>
  );
}

export default FoodIndustry;