import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Tabs } from 'antd';
import UnitManagement from './UnitManagement';
import PowerPlantFuelEmission from './PowerPlantFuelEmission';
import PowerPlantElectricityEmission from './PowerPlantElectricityEmission';
import PowerPlantCarbonInventory from './PowerPlantCarbonInventory';
import PowerPlantIndustrySummary from './PowerPlantIndustrySummary';
import { industryConfigs } from '../../../config/industryConfig';

const PowerPlantIndustry = forwardRef(({ industry }, ref) => {
  const [units, setUnits] = useState([
    { 
      id: 'unit1', 
      name: '1号机组(Demo)', 
      type: 'boiler', 
      capacity: '100', // 装机容量
      unitCategory: 'conventional', 
      fuelType: 'coal',
      fuelNames: ['anthracite', "bituminous", "lignite"], 
      equipmentType: 'boiler', 
      isCFB: false,
      boilerInfo: {
        name: '1#锅炉', // 锅炉详细信息
        type: '煤粉炉', 
        code: 'MF001', 
        model: 'HG-2030/17.5-YM',
        capacity: 2030
      }
    },
    { 
      id: 'unit2', 
      name: '2号机组(Demo)', 
      type: 'boiler', 
      capacity: '200', 
      unitCategory: 'e', 
      fuelType: 'gas',
      fuelNames: ['naturalGas'], // 添加天然气作为燃料
      generalInfo: {
        name: '200MW燃气轮机',
        code: 'GT002',
        model: 'E级燃气轮机',
        power: 200
      }
    }
  ]); // 完善的机组数据，包含所有必填信息
  const [emissionData, setEmissionData] = useState({
    powerPlantFuel: {},
    powerPlantElectricity: {}
  }); // 排放数据
  const [allFuels, setAllFuels] = useState([]); // 所有燃料数据，包括自定义燃料

  // 处理机组变化
  const handleUnitsChange = (newUnits, fuels) => {
    setUnits(newUnits);
    if (fuels) {
      setAllFuels(fuels); // 更新燃料数据
    }
    // 当机组变化时，需要更新排放数据的结构
    updateEmissionDataStructure(newUnits);
    updateSummaryData();
  };

  // 更新排放数据结构
  const updateEmissionDataStructure = (newUnits) => {
    // 这里可以根据新的机组数据更新排放数据结构
    // 暂时保持原有逻辑
    const updatedEmissionData = {
      powerPlantFuel: emissionData.powerPlantFuel || {},
      powerPlantElectricity: emissionData.powerPlantElectricity || {}
    };
    setEmissionData(updatedEmissionData);
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    // 获取汇总数据的方法
    getSummaryData: () => {
      return updateSummaryData();
    },
    // 获取月度排放数据的方法
    getMonthlyEmissionData: () => {
      const summary = updateSummaryData();
      return {
        monthlyUnitEmissions: summary.monthlyUnitEmissions || {
          fuel: [],
          electricity: []
        }
      };
    }
  }), [emissionData, units]); // 添加依赖项，确保方法始终使用最新状态

  // 初始化组件时设置默认燃料数据
  useEffect(() => {
    if (units.length > 0 && allFuels.length === 0) {
      // 如果没有燃料数据，但有机组数据，初始化默认燃料数据
      const defaultFuels = [
        // 固体燃料 - 使用与UnitManagement.jsx一致的数据
        { id: 'anthracite', name: '无烟煤', type: 'solid', unit: '吨', calorificValue: 22.867, carbonContent: 0.02749 },
        { id: 'bituminous', name: '烟煤', type: 'solid', unit: '吨', calorificValue: 23.076, carbonContent: 0.02308 },
        { id: 'lignite', name: '褐煤', type: 'solid', unit: '吨', calorificValue: 14.759, carbonContent: 0.02797 },
        { id: 'gangue', name: '煤矸石', type: 'solid', unit: '吨', calorificValue: 8.374, carbonContent: 0.02541 },
        { id: 'sludge', name: '煤泥', type: 'solid', unit: '吨', calorificValue: 12.545, carbonContent: 0.02541 },
        { id: 'coke', name: '焦炭', type: 'solid', unit: '吨', calorificValue: 28.435, carbonContent: 0.02942 },
        { id: 'petroleumCoke', name: '石油焦', type: 'solid', unit: '吨', calorificValue: 32.500, carbonContent: 0.02750 },
        // 液体燃料
        { id: 'crudeOil', name: '原油', type: 'liquid', unit: '吨', calorificValue: 41.816, carbonContent: 0.02008, oxidationRate: 98 },
        { id: 'fuelOil', name: '燃料油', type: 'liquid', unit: '吨', calorificValue: 41.816, carbonContent: 0.02110, oxidationRate: 98 },
        { id: 'gasoline', name: '汽油', type: 'liquid', unit: '吨', calorificValue: 43.070, carbonContent: 0.01890, oxidationRate: 98 },
        { id: 'diesel', name: '柴油', type: 'liquid', unit: '吨', calorificValue: 42.652, carbonContent: 0.02020, oxidationRate: 98 },
        { id: 'kerosene', name: '煤油', type: 'liquid', unit: '吨', calorificValue: 43.070, carbonContent: 0.01960, oxidationRate: 98 },
        { id: 'lng', name: '液化天然气', type: 'liquid', unit: '吨', calorificValue: 51.498, carbonContent: 0.01720, oxidationRate: 98 },
        { id: 'lpg', name: '液化石油气', type: 'liquid', unit: '吨', calorificValue: 50.179, carbonContent: 0.01720, oxidationRate: 98 },
        // 气体燃料
        { id: 'naturalGas', name: '天然气', type: 'gas', unit: '万立方米', calorificValue: 389.310, carbonContent: 0.01532, oxidationRate: 99 },
        { id: 'bfGas', name: '高炉煤气', type: 'gas', unit: '万立方米', calorificValue: 33.000, carbonContent: 0.07080, oxidationRate: 99 },
        { id: 'converterGas', name: '转炉煤气', type: 'gas', unit: '万立方米', calorificValue: 84.000, carbonContent: 0.04960, oxidationRate: 99 },
        { id: 'cokeOvenGas', name: '焦炉煤气', type: 'gas', unit: '万立方米', calorificValue: 173.854, carbonContent: 0.01210, oxidationRate: 99 }
      ];
      setAllFuels(defaultFuels);
    }
  }, [units, allFuels]);

  // 处理排放数据变化
  const handleEmissionChange = (key, data) => {
    setEmissionData(prev => ({
      ...prev,
      [key]: data
    }));
    
    // 更新汇总数据
    updateSummaryData();
  };

  // 计算汇总数据
  const updateSummaryData = () => {
    const fuelEmission = emissionData.powerPlantFuel?.value || { CO2: 0, CH4: 0, N2O: 0, total: 0 };
    const electricityEmission = emissionData.powerPlantElectricity?.value || { CO2: 0, CH4: 0, N2O: 0, total: 0 };
    
    // 获取月度机组排放数据
    const fuelMonthlyUnitEmissions = emissionData.powerPlantFuel?.monthlyUnitEmissions || [];
    const electricityMonthlyUnitEmissions = emissionData.powerPlantElectricity?.monthlyUnitEmissions || [];
    
    const summaryData = {
      fuelEmission,
      electricityEmission,
      totalEmission: {
        CO2: fuelEmission.CO2 + electricityEmission.CO2,
        CH4: fuelEmission.CH4 + electricityEmission.CH4,
        N2O: fuelEmission.N2O + electricityEmission.N2O,
        total: fuelEmission.total + electricityEmission.total,
      },
      units,
      monthlyUnitEmissions: {
        fuel: fuelMonthlyUnitEmissions,
        electricity: electricityMonthlyUnitEmissions
      }
    };
    
    return summaryData;
  };

  return (
    <div className="power-plant-industry">
      <Tabs defaultActiveKey="summary">
        <Tabs.TabPane tab="汇总表" key="summary">
          <PowerPlantIndustrySummary 
            data={updateSummaryData()}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="机组管理" key="units">
          <UnitManagement initialUnits={units} onChange={handleUnitsChange} />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="化石燃料燃烧排放" key="fuel-emission">
          <PowerPlantFuelEmission 
            units={units}
            initialData={emissionData.powerPlantFuel.data || {}}
            onEmissionChange={(data) => handleEmissionChange('powerPlantFuel', data)}
            allFuels={allFuels} // 传递所有燃料数据，包括自定义燃料
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="购入使用电力排放" key="electricity-emission">
          <PowerPlantElectricityEmission 
            units={units}
            initialData={emissionData.powerPlantElectricity.data || {}}
            onEmissionChange={(data) => handleEmissionChange('powerPlantElectricity', data)}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="碳排查材料清单" key="carbon-inventory">
          <PowerPlantCarbonInventory 
            units={units}
            emissionData={emissionData}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
});

export default PowerPlantIndustry;