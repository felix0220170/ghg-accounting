import React, { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import FossilFuelEmission from '../FossilFuelEmission';
import ElectricityHeatEmission from '../ElectricityHeatEmission';
import HCFC22ProductionEmission from '../HCFC22ProductionEmission';
import HFCsPFCsSF6Emission from '../HFCsPFCsSF6Emission'; // 导入新组件
import FluorineChemicalIndustrySummary from './FluorineChemicalIndustrySummary';
import { INDUSTRY_TYPES } from '../../config/industryConfig';

function FluorineChemicalIndustry({ industry = INDUSTRY_TYPES.FLUORINE_CHEMICAL, onEmissionDataChange }) {
  // 排放数据状态管理
  const [emissionData, setEmissionData] = useState({
    fossilFuelEmission: 0,
    hcfc22ProductionEmission: 0,
    hfcsPfcSf6Emission: 0, // 添加新的排放数据项
    electricityHeatEmission: 0,
    otherEmissions: []
  });

  // 使用useCallback优化updateEmissionData函数
  const updateEmissionData = useCallback((key, value) => {
    setEmissionData(prev => {
      const newData = { ...prev, [key]: value };
      if (onEmissionDataChange) {
        onEmissionDataChange(newData);
      }
      return newData;
    });
  }, [onEmissionDataChange]);

  // 使用useCallback优化所有回调函数
  const handleFossilFuelEmissionChange = useCallback((value) => {
    updateEmissionData('fossilFuelEmission', value);
  }, [updateEmissionData]);

  const handleHCFC22ProductionEmissionChange = useCallback((value) => {
    updateEmissionData('hcfc22ProductionEmission', value);
  }, [updateEmissionData]);

  // 添加新组件的回调函数
  const handleHFCsPFCsSF6EmissionChange = useCallback((value) => {
    updateEmissionData('hfcsPfcSf6Emission', value);
  }, [updateEmissionData]);

  const handleElectricityHeatEmissionChange = useCallback((value) => {
    updateEmissionData('electricityHeatEmission', value);
  }, [updateEmissionData]);

  // 处理汇总表中的数据变化
  const handleSummaryDataChange = useCallback((newData) => {
    setEmissionData(prev => {
      const updatedData = { ...prev, ...newData };
      if (onEmissionDataChange) {
        onEmissionDataChange(updatedData);
      }
      return updatedData;
    });
  }, [onEmissionDataChange]);

  // Tab配置 - 使用新版antd的items属性
  const tabItems = [
    {
      key: 'summary',
      label: '汇总表',
      children: (
        <div className="summary-tab-content">
          <h3>氟化工企业 - 汇总表</h3>
          <FluorineChemicalIndustrySummary 
            data={emissionData} 
            onChange={handleSummaryDataChange}
          />
        </div>
      )
    },
    {
      key: 'fossil-fuel',
      label: '化石燃料燃烧 CO2 排放',
      children: (
        <FossilFuelEmission 
          industry={INDUSTRY_TYPES.FLUORINE_CHEMICAL}
          onEmissionChange={handleFossilFuelEmissionChange}
        />
      )
    },
    {
      key: 'hcfc22-production',
      label: 'HCFC-22 生产过程 HFC-23 排放',
      children: (
        <HCFC22ProductionEmission 
          industry={INDUSTRY_TYPES.FLUORINE_CHEMICAL}
          onEmissionChange={handleHCFC22ProductionEmissionChange}
        />
      )
    },
    {
      key: 'hfcs-pfcs-sf6',
      label: 'HFCs/PFCs/SF6 生产过程副产物及逃逸排放',
      children: (
        <HFCsPFCsSF6Emission 
          industry={INDUSTRY_TYPES.FLUORINE_CHEMICAL}
          onEmissionChange={handleHFCsPFCsSF6EmissionChange}
        />
      )
    },
    {
      key: 'electricity-heat',
      label: '净购入电力和热力隐含的 CO2 排放',
      children: (
        <ElectricityHeatEmission 
          industry={INDUSTRY_TYPES.FLUORINE_CHEMICAL}
          onEmissionChange={handleElectricityHeatEmissionChange}
        />
      )
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

export default FluorineChemicalIndustry;