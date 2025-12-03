import { useState } from 'react'
import './App.css'
import 'antd/dist/reset.css'

import OtherIndustry from './components/industries/OtherIndustry'
import PaperIndustry from './components/industries/PaperIndustry'
import FoodIndustry from './components/industries/FoodIndustry' 
import NonFerrousMetalsIndustry from './components/industries/NonFerrousMetalsIndustry' 
import LandTransportationIndustry from './components/industries/LandTransportationIndustry';
import MiningIndustry from './components/industries/MiningIndustry';
import MachineryManufacturingIndustry from './components/industries/MachineryManufacturingIndustry';
import PublicBuildingIndustry from './components/industries/PublicBuildingIndustry';
import FluorineChemicalIndustry from './components/industries/FluorineChemicalIndustry'; // 导入氟化工企业组件
import CementIndustry from './components/industries/cement/CementIndustry'; // 导入水泥行业组件
import PowerPlantIndustry from './components/industries/powerPlant/PowerPlantIndustry';
import SteelIndustry from './components/industries/steel/SteelIndustry';
import AluminumIndustryPage from './components/industries/aluminum/AluminumIndustryPage';
import ElectricIndustry from './components/industries/electric/ElectricIndustry'
import CokingIndustry from './components/industries/coking/CokingIndustry'
import { INDUSTRY_TYPES } from './config/industryConfig' 

function App() {
  // 使用INDUSTRY_TYPES中的默认值作为初始选择
  // add some logs
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRY_TYPES.COKING);

  // 从INDUSTRY_TYPES常量生成行业列表
  //const industries = Object.values(INDUSTRY_TYPES);
  const industries = [INDUSTRY_TYPES.CEMENT, 
    INDUSTRY_TYPES.POWER_PLANT, 
    INDUSTRY_TYPES.IRON_AND_STEEL, 
    INDUSTRY_TYPES.ALUMINUM_SMELTING,
    INDUSTRY_TYPES.ELECTRIC_GRID_COMPANY,
    INDUSTRY_TYPES.COKING
  ];

  // 根据选择的行业动态加载相应的组件
  // 渲染行业组件的函数
  const renderIndustryComponent = () => {
    switch (selectedIndustry) {
      case INDUSTRY_TYPES.PAPER:
        return <PaperIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.FOOD:
        return <FoodIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.NON_FERROUS_METALS:
        return <NonFerrousMetalsIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.LAND_TRANSPORTATION: 
        return <LandTransportationIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.MINING:
        return <MiningIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.MACHINERY_MANUFACTURING:
        return <MachineryManufacturingIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.PUBLIC_BUILDING:
        return <PublicBuildingIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.FLUORINE_CHEMICAL: // 添加氟化工企业
        return <FluorineChemicalIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.CEMENT: // 添加水泥行业
        return <CementIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.POWER_PLANT: // 添加发电设施
        // 由于组件尚未创建，暂时显示水泥行业组件
        return <PowerPlantIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.IRON_AND_STEEL: // 添加钢铁行业
        return <SteelIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.ALUMINUM_SMELTING: // 添加铝冶炼行业
        return <AluminumIndustryPage industry={selectedIndustry} />;
        case INDUSTRY_TYPES.ELECTRIC_GRID_COMPANY: // 添加电网企业
        return <ElectricIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.COKING: // 添加独立焦化企业
        return <CokingIndustry industry={selectedIndustry} />;
      case INDUSTRY_TYPES.OTHER:
      default:
        return <OtherIndustry industry={selectedIndustry} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>温室气体排放计算系统</h1>
      </header>
      
      {/* 行业选择器放在最前面，优先选择行业 */}
      <div className="industry-selector">
        <label htmlFor="industry-select">选择行业：</label>
        <select
          id="industry-select"
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
        >
          {industries.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>
      </div>
      
      {/* 显示选中行业的组件 */}
      <div className="industry-container">
        {renderIndustryComponent()}
      </div>
    </div>
  );
}

export default App;
