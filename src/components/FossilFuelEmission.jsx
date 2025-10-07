import { useState, useEffect, useCallback, useMemo } from 'react';
import { INDUSTRY_TYPES } from '../config/industryConfig';
import { 
  DEFAULT_FUEL_TYPES, 
  OTHER_INDUSTRY_REQUIRED_FUELS,
  LAND_TRANSPORTATION_REQUIRED_FUELS,
  PAPER_MANUFACTURING_REQUIRED_FUELS,
  FOOD_BEVERAGE_REQUIRED_FUELS,
  NON_FERROUS_METALS_REQUIRED_FUELS,
  CO2_CALCULATION_CONSTANTS 
} from '../config/fossilFuelConstants';

// 化石燃料燃烧排放量组件
function FossilFuelEmission({ industry = INDUSTRY_TYPES.OTHER, onEmissionChange }) {
  // 根据行业获取燃料类型
  const getFuelTypesByIndustry = useCallback((industryName) => {
    if (industryName === INDUSTRY_TYPES.OTHER) {
      return DEFAULT_FUEL_TYPES
        .filter(fuel => OTHER_INDUSTRY_REQUIRED_FUELS.includes(fuel.name))
        .sort((a, b) => OTHER_INDUSTRY_REQUIRED_FUELS.indexOf(a.name) - OTHER_INDUSTRY_REQUIRED_FUELS.indexOf(b.name));
    } else if (industryName === INDUSTRY_TYPES.LAND_TRANSPORTATION) {
      return DEFAULT_FUEL_TYPES
        .filter(fuel => LAND_TRANSPORTATION_REQUIRED_FUELS.includes(fuel.name))
        .sort((a, b) => LAND_TRANSPORTATION_REQUIRED_FUELS.indexOf(a.name) - LAND_TRANSPORTATION_REQUIRED_FUELS.indexOf(b.name));
    } else if (industryName === '造纸及纸制品业') {
      return DEFAULT_FUEL_TYPES
        .filter(fuel => PAPER_MANUFACTURING_REQUIRED_FUELS.includes(fuel.name))
        .sort((a, b) => PAPER_MANUFACTURING_REQUIRED_FUELS.indexOf(a.name) - PAPER_MANUFACTURING_REQUIRED_FUELS.indexOf(b.name));
    } else if (industryName === '食品、烟草及酒、饮料和精制茶行业') {
      return DEFAULT_FUEL_TYPES
        .filter(fuel => FOOD_BEVERAGE_REQUIRED_FUELS.includes(fuel.name))
        .sort((a, b) => FOOD_BEVERAGE_REQUIRED_FUELS.indexOf(a.name) - FOOD_BEVERAGE_REQUIRED_FUELS.indexOf(b.name));
    } else if (industryName === '其他有色金属冶炼和压延加工业') {
      return DEFAULT_FUEL_TYPES
        .filter(fuel => NON_FERROUS_METALS_REQUIRED_FUELS.includes(fuel.name))
        .sort((a, b) => NON_FERROUS_METALS_REQUIRED_FUELS.indexOf(a.name) - NON_FERROUS_METALS_REQUIRED_FUELS.indexOf(b.name));
    }
    
    return DEFAULT_FUEL_TYPES;
  }, []);

  // 使用根据行业筛选的燃料类型
  const [fuels, setFuels] = useState(getFuelTypesByIndustry(industry));
  // 存储计算数据
  const [data, setData] = useState([]);
  // 存储用户自定义的燃料数据
  const [customFuels, setCustomFuels] = useState([]);

  // 初始化数据
  useEffect(() => {
    const industryFuels = getFuelTypesByIndustry(industry);
    setFuels(industryFuels);
    
    const initialData = industryFuels.map(fuel => {
      const 低位发热量 = fuel.default低位发热量;
      const 单位热值含碳量 = fuel.default单位热值含碳量;
      const 含碳量 = 低位发热量 * 单位热值含碳量;
      
      return {
        ...fuel,
        燃烧量: '',
        低位发热量: 低位发热量,
        单位热值含碳量: 单位热值含碳量,
        碳氧化率: fuel.default碳氧化率,
        含碳量: 含碳量,
        CO2排放量: 0
      };
    });
    setData(initialData);
  }, [industry, getFuelTypesByIndustry]);

  // 计算含碳量和CO2排放量
  const calculateEmissions = useCallback((rowData) => {
    const 燃烧量 = parseFloat(rowData.燃烧量) || 0;
    const 低位发热量 = parseFloat(rowData.低位发热量) || 0;
    const 单位热值含碳量 = parseFloat(rowData.单位热值含碳量) || 0;
    const 碳氧化率 = parseFloat(rowData.碳氧化率) || 0;
    
    const 含碳量 = 低位发热量 * 单位热值含碳量;
    const CO2排放量 = 燃烧量 * 含碳量 * (碳氧化率 / 100) * CO2_CALCULATION_CONSTANTS.CARBON_TO_CO2_RATIO;
    
    return { 含碳量, CO2排放量 };
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback((id, field, value) => {
    setData(prevData => {
      const updatedData = prevData.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          const calculatedValues = calculateEmissions(updatedRow);
          return { ...updatedRow, ...calculatedValues };
        }
        return row;
      });
      return updatedData;
    });
  }, [calculateEmissions]);

  // 处理自定义燃料输入变化
  const handleCustomFuelChange = useCallback((index, field, value) => {
    setCustomFuels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // 添加新的自定义燃料行
  const addCustomFuel = useCallback(() => {
    setCustomFuels(prev => [...prev, { name: '', CO2排放量: '' }]);
  }, []);

  // 删除自定义燃料行
  const removeCustomFuel = useCallback((index) => {
    setCustomFuels(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 使用useMemo计算总排放量，避免重复计算
  const totalEmission = useMemo(() => {
    // 计算默认燃料的总排放量
    const totalDefault = data.reduce((total, row) => total + row.CO2排放量, 0);
    // 计算自定义燃料的总排放量
    const totalCustom = customFuels.reduce((total, fuel) => {
      return total + (parseFloat(fuel.CO2排放量) || 0);
    }, 0);
    return totalDefault + totalCustom;
  }, [data, customFuels]);

  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);

  return (
    <div className="fossil-fuel-emission">
      <h2>化石燃料燃烧排放量</h2>
      <div className="calculation-description">
        <p><strong>计算公式：</strong></p>
        <p>含碳量 = 低位发热量 × 单位热值含碳量</p>
        <p>CO2排放量 = 燃烧量 × 含碳量 × 碳氧化量 × 44/12</p>
        <p><strong>证明材料：</strong>各品种的化石燃料燃烧量应根据企业能源消费台帐或统计报表来确定，等于流入企业边界且明确送往各类燃烧设备作为燃料燃烧的化石燃料部分，不包括工业生产过程产生的副产品或可燃废气被回收并作为能源燃烧的部分。</p>
      </div>
      <table className="emission-table">
        <thead>
          <tr>
            <th>燃料品种</th>
            <th>燃烧量（吨或万Nm³）</th>
            <th>含碳量（tC/吨或tC/万Nm³）</th>
            <th>低位发热量（GJ/吨或GJ/万Nm³）</th>
            <th>单位热值含碳量（吨碳/GJ）</th>
            <th>碳氧化率（%）</th>
            <th>系数（44/12）</th>
            <th>CO2排放量（吨CO2当量）</th>
          </tr>
        </thead>
        <tbody>
          {/* 渲染默认燃料行 */}
          {data.map(row => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>
                <input
                  type="number"
                  value={row.燃烧量}
                  onChange={(e) => handleInputChange(row.id, '燃烧量', e.target.value)}
                  placeholder="请输入燃烧量"
                />
              </td>
              <td>{row.含碳量.toFixed(8)}</td>
              <td>{row.低位发热量}</td>
              <td>{row.单位热值含碳量}</td>
              <td>{row.碳氧化率}</td>
              <td>{CO2_CALCULATION_CONSTANTS.CARBON_TO_CO2_RATIO.toFixed(8)}</td>
              <td>{row.CO2排放量.toFixed(8)}</td>
            </tr>
          ))}
          
          {/* 渲染自定义燃料行 */}
          {customFuels.map((fuel, index) => (
            <tr key={`custom-${index}`} style={{ backgroundColor: '#f9f9f9' }}>
              <td>
                <input
                  type="text"
                  value={fuel.name}
                  onChange={(e) => handleCustomFuelChange(index, 'name', e.target.value)}
                  placeholder="燃料品种名称"
                  style={{ width: '100%' }}
                />
              </td>
              <td colSpan={6}>
                <input
                  type="number"
                  value={fuel.CO2排放量}
                  onChange={(e) => handleCustomFuelChange(index, 'CO2排放量', e.target.value)}
                  placeholder="CO2排放量（吨CO2当量）"
                  style={{ width: '100%' }}
                />
              </td>
              <td>
                {fuel.CO2排放量 ? parseFloat(fuel.CO2排放量).toFixed(8) : '0.00000000'}
                <button 
                  onClick={() => removeCustomFuel(index)}
                  style={{ marginLeft: '5px', padding: '2px 6px', background: 'red', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7} style={{ textAlign: 'right', fontWeight: 'bold' }}>总计：</td>
            <td style={{ fontWeight: 'bold' }}>{totalEmission.toFixed(8)}</td>
          </tr>
        </tfoot>
      </table>
      
      {/* 添加自定义燃料按钮 */}
      <button 
        onClick={addCustomFuel}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        添加其他能源品种
      </button>
    </div>
  );
}

export default FossilFuelEmission;