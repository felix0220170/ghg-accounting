import { useState } from 'react'
import './App.css'
import 'antd/dist/reset.css'

import OtherIndustry from './components/industries/OtherIndustry'
import PaperIndustry from './components/industries/PaperIndustry'
import FoodIndustry from './components/industries/FoodIndustry' 
import NonFerrousMetalsIndustry from './components/industries/NonFerrousMetalsIndustry' 
import LandTransportationIndustry from './components/industries/LandTransportationIndustry';
import MiningIndustry from './components/industries/MiningIndustry';
import MachineryManufacturingIndustry from './components/industries/MachineryManufacturingIndustry'; // 导入机械设备制造企业组件
import PublicBuildingIndustry from './components/industries/PublicBuildingIndustry'; // 导入公共建筑运营单位组件
import { INDUSTRY_TYPES } from './config/industryConfig' 

function App() {
  // 使用INDUSTRY_TYPES中的默认值作为初始选择
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRY_TYPES.OTHER);

  // 从INDUSTRY_TYPES常量生成行业列表
  const industries = Object.values(INDUSTRY_TYPES);

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
      case INDUSTRY_TYPES.PUBLIC_BUILDING: // 添加公共建筑运营单位
        return <PublicBuildingIndustry industry={selectedIndustry} />;
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
