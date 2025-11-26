import { useState } from 'react';

// 10个预设工序类型
const PROCESS_TYPES = [
  { value: 'coking', label: '焦化工序' },
  { value: 'sintering', label: '烧结工序' },
  { value: 'pelletizing', label: '球团工序' },
  { value: 'blastFurnace', label: '高炉炼铁工序' },
  { value: 'converter', label: '转炉炼钢工序' },
  { value: 'eaf', label: '电炉炼钢工序' },
  { value: 'refining', label: '精炼工序' },
  { value: 'continuousCasting', label: '连铸工序' },
  { value: 'rolling', label: '钢压延加工工序' },
  { value: 'lime', label: '石灰工序' }
];

// 工序产品缺省值映射
const DEFAULT_PRODUCT_INFO = {
  coking: { name: '焦炭', code: '250401', facilityName: '顶装焦炉',  facilityUnit: '米'},
  sintering: { name: '烧结铁矿', code: '08010301', facilityName: '带式烧结机', facilityUnit: '平方米' },
  pelletizing: { name: '球团铁矿', code: '08010302', facilityName: '链篦机-回转窑', facilityUnit: '平方米' },
  blastFurnace: { name: '生铁', code: '3201', facilityName: '高炉', facilityUnit: '立方米' },
  converter: { name: '粗钢（转炉钢）', code: '320641', facilityName: '转炉', facilityUnit: '吨' },
  eaf: { name: '粗钢（电炉钢）', code: '320642', facilityName: '电炉', facilityUnit: '吨' },
  lime: { name: '石灰', code: '31020101', facilityName: '', facilityUnit: '' }
};


// 初始化10个固定工序
const initializeDefaultProcesses = () => {
  return PROCESS_TYPES.map(type => {
    const defaultProduct = DEFAULT_PRODUCT_INFO[type.value] || { name: '', code: '', facilityName: '', facilityUnit: '' };
    return {
      id: `default-${type.value}-${Date.now()}`,
      processType: type.value,
      processTypeName: type.label,
      productName: defaultProduct.name,
      productCode: defaultProduct.code,
      productionCapacity: '',
      cokingMethod: type.value === 'coking' ? '' : undefined,
      facilities: [{
        id: `default-${type.value}-facility-${Date.now()}`,
        facilityName: defaultProduct.facilityName,
        facilityUnit: defaultProduct.facilityUnit,
        facilitySpec: '',
        transportTime: ''
      }],
      description: '',
      supportingMaterials: {},
      isDefault: true // 标记为默认工序
    };
  });
};
import { Card, Tabs, Typography } from 'antd';
import SteelFossilFuelEmission from './SteelFossilFuelEmission';
import SteelProcessEmission from './SteelProcessEmission';
import SteelProcessEmissionSummary from './SteelProcessEmissionSummary';
import SteelIndustrySummary from './SteelIndustrySummary';
import ProcessManagement from './ProcessManagement';
import CarbonSequestrationProductEmission from './CarbonSequestrationProductEmission';
import SteelOtherEmission from './SteelOtherEmission';
import SteelCarbonInventory from './SteelCarbonInventory';
import SteelProcessFossilFuelEmission from './SteelProcessFossilFuelEmission';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

function SteelIndustry({ onEmissionChange }) {
   const [fuelProcesses, setFuelProcesses] = useState([{
      id: 'fule-process-1',
      processName: '化石燃料工序placeholder',
    }]);

  const [emissionData, setEmissionData] = useState({
    fossilFuel: 0,
    steelFossilFuel: 0,
    electricity: 0,
    heat: 0,
    processEmission: 0,
    carbonSequestration: 0,
    otherEmission: 0
  });
  
  // 详细排放数据，用于工序排放量汇总组件
  const [fossilFuelEmissions, setFossilFuelEmissions] = useState({});
  const [electricityEmissions, setElectricityEmissions] = useState({});
  const [heatEmissions, setHeatEmissions] = useState({});
  
  // 工序状态管理，使用初始化函数创建10个固定工序
  const [processes, setProcesses] = useState(() => initializeDefaultProcesses());
  
  // 处理工序变化
  const handleProcessesChange = (updatedProcesses) => {
    setProcesses(updatedProcesses);
    // 通知父组件工序信息变化
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: calculateTotalEmission(),
        processes: updatedProcesses
      });
    }
  };

  const handleFuelProcessesChange = (updatedProcesses) => {
    setFuelProcesses(updatedProcesses);
  };

  // 处理各组件排放量变化
  const handleEmissionChange = (key, value) => {
    // 更新总排放量数据
    setEmissionData(prev => ({
      ...prev,
      [key]: typeof value === 'object' && value !== null ? value.totalEmission || 0 : value || 0
    }));
    
    // 更新详细排放数据
    if (typeof value === 'object' && value !== null) {
      switch (key) {
        case 'steelFossilFuel':
          setFossilFuelEmissions(value.processEmissions || {});
          break;
        case 'electricity':
          setElectricityEmissions(value.processEmissions || {});
          break;
        case 'heat':
          setHeatEmissions(value.processEmissions || {});
          break;
        default:
          break;
      }
    }
  };

  // 计算总排放量并通知父组件
  const calculateTotalEmission = () => {
    const total = Object.values(emissionData).reduce((sum, value) => sum + value, 0);
    if (onEmissionChange) {
      onEmissionChange({
        emissionData,
        totalEmission: total,
        processes // 同时传递工序信息
      });
    }
    return total;
  };

  // 准备传递给Summary组件的数据格式
  const prepareSummaryData = () => ({
    steelFossilFuelEmission: emissionData.fossilFuel,
    processEmission: emissionData.processEmission,
    carbonSequestrationEmission: emissionData.carbonSequestration,
    otherEmission: emissionData.otherEmission
  });

  return (
    <div className="steel-industry">
      <Card title="钢铁行业温室气体排放核算" style={{ marginBottom: '20px' }}>
        <Title level={4}>行业说明</Title>
        <Paragraph>
          本模块适用于钢铁行业企业开展温室气体排放核算。钢铁行业是重要的基础原材料产业，
          其碳排放主要来自化石燃料燃烧、生产过程等环节。
        </Paragraph>
        <Paragraph>
          核算范围包括：化石燃料燃烧排放、钢铁生产过程排放、含碳产品隐含的排放等。
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="summary" onChange={() => calculateTotalEmission()}>
        <TabPane tab="企业级排放汇总" key="summary">
          <SteelIndustrySummary emissionData={prepareSummaryData()} />
        </TabPane>
        <TabPane tab="企业级化石燃料燃烧排放" key="fossilFuel">
              <SteelFossilFuelEmission 
                onEmissionChange={(value) => handleEmissionChange('fossilFuel', value)}
                productionLines={fuelProcesses} 
                onProductionLinesChange={handleFuelProcessesChange}
              />
          </TabPane>
          <TabPane tab="工业生产过程排放" key="processEmission">
          <SteelProcessEmission 
            onEmissionChange={(value) => handleEmissionChange('processEmission', value)}
            onProductionLinesChange={handleProcessesChange} // 传递工序变化回调
          />
        </TabPane>
        <TabPane tab="固碳产品隐含排放" key="carbonSequestration">
          <CarbonSequestrationProductEmission 
            onEmissionChange={(value) => handleEmissionChange('carbonSequestration', value)}
          />
        </TabPane>
        <TabPane tab="工序管理" key="processManagement">
          <ProcessManagement 
            processes={processes}
            onProcessesChange={handleProcessesChange}
          />
        </TabPane>
        
        <TabPane tab="工序化石燃料排放" key="steelFossilFuel">
          <SteelProcessFossilFuelEmission 
            onEmissionChange={(value) => handleEmissionChange('steelFossilFuel', value)}
            productionLines={processes} // 传递工序信息给子组件，使用productionLines名称匹配组件要求
            onProductionLinesChange={handleProcessesChange} // 添加工序变化回调，使用onProductionLinesChange名称
          />
        </TabPane>
        {
        /* 
        <TabPane tab="工序生产数据及排放量汇总" key="processEmissionSummary">
          <SteelProcessEmissionSummary 
            processes={processes}
            onProcessesChange={handleProcessesChange}
            fossilFuelEmissions={fossilFuelEmissions}
            electricityEmissions={electricityEmissions}
            heatEmissions={heatEmissions}
            onProcessUpdate={(processId, updates) => {
              const updatedProcesses = processes.map(process => 
                process.id === processId ? { ...process, ...updates } : process
              );
              handleProcessesChange(updatedProcesses);
            }}
          />
        </TabPane> */
        }
        
        <TabPane tab="发电设施及其他排放" key="otherEmission">
          <SteelOtherEmission 
            onEmissionChange={(value) => handleEmissionChange('otherEmission', value)}
          />
        </TabPane>
        <TabPane tab="碳排查材料清单" key="carbonInventory">
          <SteelCarbonInventory 
            onEmissionChange={(value) => handleEmissionChange('carbonInventory', value)}
            productionLines={processes} 
            onProductionLinesChange={handleProcessesChange}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default SteelIndustry;