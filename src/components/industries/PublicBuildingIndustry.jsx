import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import PublicBuildingIndustrySummary from './PublicBuildingIndustrySummary';
import { INDUSTRY_TYPES } from '../../config/industryConfig';

function PublicBuildingIndustry({ industry = INDUSTRY_TYPES.PUBLIC_BUILDING }) {
  // 行业特定的排放数据状态
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    electricityHeatEmission: 0,
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

  // 处理电力和热力排放变化，使用区域因子
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
          <PublicBuildingIndustrySummary 
            data={emissionData} 
            onOtherEmissionChange={handleOtherEmissionChange}
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
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: <ElectricityHeatEmission 
        onEmissionChange={handleElectricityHeatEmissionChange} 
        industry={industry}
        useRegionFactor={true} // 公共建筑行业使用区域电力因子
      />
    }
  ];

  return (
    <div className="industry-component">
      {/* 排放计算标签页 */}
      <div className="emission-tabs">
        <Tabs defaultActiveKey="summary" items={tabItems} />
      </div>
    </div>
  );
}

export default PublicBuildingIndustry;