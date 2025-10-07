import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import TailGasPurificationEmission from '../TailGasPurificationEmission';
import MethaneN2OEmission from '../MethaneN2OEmission'; // 导入新组件
import LandTransportationIndustrySummary from './LandTransportationIndustrySummary';
import { INDUSTRY_TYPES } from '../../config/industryConfig';

function LandTransportationIndustry({ industry = INDUSTRY_TYPES.LAND_TRANSPORTATION }) {
  // 行业特定的排放数据状态
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    methaneN2OEmission: 0,
    electricityHeatEmission: 0,
    tailGasPurificationEmission: 0,
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

  const handleMethaneN2OEmissionChange = useCallback((value) => {
    updateEmissionData('methaneN2OEmission', value);
  }, [updateEmissionData]);

  // 处理电力和热力排放变化，使用区域因子
  const handleElectricityHeatEmissionChange = useCallback((value) => {
    updateEmissionData('electricityHeatEmission', value);
  }, [updateEmissionData]);

  // 处理尾气净化过程排放变化
  const handleTailGasPurificationEmissionChange = useCallback((value) => {
    updateEmissionData('tailGasPurificationEmission', value);
  }, [updateEmissionData]);

  // Tab配置
  const tabItems = [
    {
      key: 'summary',
      label: '汇总表',
      children: (
        <div className="summary-tab-content">
          <h3>{industry} - 汇总表</h3>
          <LandTransportationIndustrySummary 
            data={emissionData} 
          />
        </div>
      )
    },
    {
      key: 'fossil-fuel',
      label: '化石燃料燃烧 CO2 排放',
      children: <FossilFuelEmission 
        onEmissionChange={handleFossilFuelEmissionChange} 
        industry={industry} 
      />
    },
    {
      key: 'methane-n2o',
      label: '化石燃料燃烧甲烷和氧化亚氮排放量',
      children: <MethaneN2OEmission 
        onEmissionChange={handleMethaneN2OEmissionChange} 
        industry={industry} 
      />
    },
    {
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission 
        onEmissionChange={handleElectricityHeatEmissionChange} 
        industry={industry} 
        useRegionFactor={true} // 陆上交通运输行业使用区域因子
      />
    },
    {
      key: 'tail-gas-purification',
      label: '尾气净化过程排放量',
      children: <TailGasPurificationEmission 
        onEmissionChange={handleTailGasPurificationEmissionChange} 
        industry={industry} 
      />
    }
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

export default LandTransportationIndustry;