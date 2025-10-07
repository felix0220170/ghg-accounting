import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import CarbonateEmission from '../CarbonateEmission';
import WastewaterTreatmentEmission from '../WastewaterTreatmentEmission';
import MethaneRecoveryEmission from '../MethaneRecoveryEmission';
import CO2RecyclingEmission from '../CO2RecyclingEmission';
import OtherIndustrySummary from './OtherIndustrySummary'; // 替换为新组件
import ElectricityHeatEmission from '../ElectricityHeatEmission';

function OtherIndustry({ industry = '其他行业' }) {
  // 行业特定的排放数据状态
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    carbonateEmission: 0,
    wastewaterTreatmentEmission: 0,
    methaneRecoveryEmission: 0,
    co2RecyclingEmission: 0,
    electricityHeatEmission: 0,
    otherEmission: 0, // 添加其他排放字段
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

  const handleWastewaterTreatmentEmissionChange = useCallback((value) => {
    updateEmissionData('wastewaterTreatmentEmission', value);
  }, [updateEmissionData]);

  const handleMethaneRecoveryEmissionChange = useCallback((emission) => {
    updateEmissionData('methaneRecoveryEmission', emission);
  }, [updateEmissionData]);
  
  // 处理CO2回收利用量变化的函数
  const handleCO2RecyclingEmissionChange = useCallback((emission) => {
    updateEmissionData('co2RecyclingEmission', emission);
  }, [updateEmissionData]);

  // 处理电力和热力排放变化
  const handleElectricityHeatEmissionChange = useCallback((value) => {
    updateEmissionData('electricityHeatEmission', value);
  }, [updateEmissionData]);

  // 处理其他排放变化
  const handleOtherEmissionChange = useCallback((value) => {
    updateEmissionData('otherEmission', value);
  }, [updateEmissionData]);

  // Tab配置
  const tabItems = [
    {
      key: 'summary',
      label: '汇总表',
      children: (
        <div className="summary-tab-content">
          <h3>{industry} - 汇总表</h3>
          <OtherIndustrySummary data={emissionData} onOtherEmissionChange={handleOtherEmissionChange} />
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
      key: 'wastewater-treatment',
      label: '废水厌氧处理 CH4 排放',
      children: <WastewaterTreatmentEmission onEmissionChange={handleWastewaterTreatmentEmissionChange} industry={industry} />
    },
    {
      key: 'methane-recovery',
      label: 'CH4 回收与销毁量',
      children: <MethaneRecoveryEmission onEmissionChange={handleMethaneRecoveryEmissionChange} industry={industry} />
    },
    {
      key: 'co2-recycling',
      label: 'CO2 回收利用量',
      children: <CO2RecyclingEmission onEmissionChange={handleCO2RecyclingEmissionChange} industry={industry} />
    },
    {
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission 
        onEmissionChange={handleElectricityHeatEmissionChange} 
        industry="其他行业" 
        useRegionFactor={false} // 其他行业使用省份因子
      />
    },
  ];

  return (
    <div className="industry-component">
      {/* 排放计算标签页 - 保持水平布局 */}
      <div className="emission-tabs">
        <Tabs defaultActiveKey="summary" items={tabItems} />
      </div>
    </div>
  );
}

export default OtherIndustry;