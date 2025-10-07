import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import CarbonateEmission from '../CarbonateEmission';
import WastewaterTreatmentEmission from '../WastewaterTreatmentEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import MethaneRecoveryEmission from '../MethaneRecoveryEmission'; // 导入CH4回收组件
import PaperIndustrySummary from './PaperIndustrySummary';

function PaperIndustry({ industry = '造纸及纸制品业' }) {
  // 行业特定的排放数据状态，添加methaneRecoveryEmission字段
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    carbonateEmission: 0,
    wastewaterTreatmentEmission: 0,
    methaneRecoveryEmission: 0, // 添加CH4回收与销毁量字段
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
    updateEmissionData('fossilFuelEmission', value);
  }, [updateEmissionData]);

  const handleCarbonateEmissionChange = useCallback((value) => {
    updateEmissionData('carbonateEmission', value);
  }, [updateEmissionData]);

  const handleWastewaterTreatmentEmissionChange = useCallback((value) => {
    updateEmissionData('wastewaterTreatmentEmission', value);
  }, [updateEmissionData]);

  // 添加CH4回收与销毁量的回调函数
  const handleMethaneRecoveryEmissionChange = useCallback((value) => {
    updateEmissionData('methaneRecoveryEmission', value);
  }, [updateEmissionData]);

  const handleElectricityHeatEmissionChange = useCallback((value) => {
    updateEmissionData('electricityHeatEmission', value);
  }, [updateEmissionData]);

  // 标签页配置，将汇总表移到第一个tab
  const tabs = [
    {
      key: 'summary',
      label: '汇总表',
      children: (
        <div className="summary-tab-content">
          <h3>{industry} - 汇总表</h3>
          <PaperIndustrySummary data={emissionData} industry={industry} />
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
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission 
        onEmissionChange={handleElectricityHeatEmissionChange} 
        industry={industry}
      />
    }
  ];

  return (
    <div className="paper-industry">
      {/* 移除单独的汇总表区域，汇总表现在在tabs中 */}
      
      {/* 排放计算标签页 - 更新默认激活的tab为summary */}
      <div className="emission-tabs">
        <Tabs defaultActiveKey="summary" items={tabs} />
      </div>
    </div>
  );
}

export default PaperIndustry;