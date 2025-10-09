import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import ElectricalRefrigerationEmission from '../ElectricalRefrigerationEmission';
import WeldingCO2Emission from '../WeldingCO2Emission'; // 导入新组件
import MachineryManufacturingIndustrySummary from './MachineryManufacturingIndustrySummary';

function MachineryManufacturingIndustry({ industry = '机械设备制造企业' }) {
  // 行业特定的排放数据状态
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    electricityHeatEmission: 0,
    electricalRefrigerationEmission: 0,
    weldingCO2Emission: 0, // 添加新的排放数据状态
    otherEmission: 0,
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

  // 处理电力和热力排放变化
  const handleElectricityHeatEmissionChange = useCallback((value) => {
    updateEmissionData('electricityHeatEmission', value);
  }, [updateEmissionData]);

  // 处理电气与制冷设备生产的过程排放变化
  const handleElectricalRefrigerationEmissionChange = useCallback((value) => {
    updateEmissionData('electricalRefrigerationEmission', value);
  }, [updateEmissionData]);

  // 处理CO2保护气焊接排放变化 - 新增
  const handleWeldingCO2EmissionChange = useCallback((value) => {
    updateEmissionData('weldingCO2Emission', value);
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
          <MachineryManufacturingIndustrySummary 
            data={emissionData} 
            onOtherEmissionChange={handleOtherEmissionChange} 
          />
        </div>
      )
    },
    {
      key: 'fossil-fuel',
      label: '化石燃料燃烧 CO2 排放',
      children: <FossilFuelEmission onEmissionChange={handleFossilFuelEmissionChange} industry={industry} />
    },
    {
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission 
        onEmissionChange={handleElectricityHeatEmissionChange} 
        industry={industry} 
        useRegionFactor={false} 
      />
    },
    {
      key: 'electrical-refrigeration',
      label: '电气与制冷设备生产的过程排放',
      children: <ElectricalRefrigerationEmission 
        onEmissionChange={handleElectricalRefrigerationEmissionChange} 
        industry={industry} 
      />
    },
    {
      key: 'welding-co2',
      label: 'CO2作为保护气的焊接过程排放',
      children: <WeldingCO2Emission 
        onEmissionChange={handleWeldingCO2EmissionChange} 
        industry={industry} 
      />
    } // 新增标签页
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

export default MachineryManufacturingIndustry;