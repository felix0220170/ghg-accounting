import { useState, useEffect, useCallback, useMemo } from 'react';

// 碳酸盐排放量组件
function CarbonateEmission({ onEmissionChange }) {
  // 碳酸盐数据，包含中文和英文名称以及排放因子
  const defaultCarbonates = [
    { id: 1, name: '碳酸钙 (CaCO₃) - 俗称：石灰石', formula: 'CaCO₃', emissionFactor: 0.4397 },
    { id: 2, name: '碳酸镁 (MgCO₃) - 俗称：菱镁矿', formula: 'MgCO₃', emissionFactor: 0.5220 },
    { id: 3, name: '碳酸钠 (Na₂CO₃) - 俗称：纯碱、苏打', formula: 'Na₂CO₃', emissionFactor: 0.4149 },
    { id: 4, name: '碳酸氢钠 (NaHCO₃) - 俗称：小苏打', formula: 'NaHCO₃', emissionFactor: 0.5237 },
    { id: 5, name: '碳酸亚铁 (FeCO₃) - 俗称：菱铁矿', formula: 'FeCO₃', emissionFactor: 0.3799 },
    { id: 6, name: '碳酸锰 (MnCO₃) - 俗称：菱锰矿', formula: 'MnCO₃', emissionFactor: 0.3829 },
    { id: 7, name: '碳酸钡 (BaCO₃) - 俗称：碳酸钡矿', formula: 'BaCO₃', emissionFactor: 0.2230 },
    { id: 8, name: '碳酸锂 (Li₂CO₃) - 俗称：锂矿产品', formula: 'Li₂CO₃', emissionFactor: 0.5955 },
    { id: 9, name: '碳酸钾 (K₂CO₃) - 俗称：钾碱', formula: 'K₂CO₃', emissionFactor: 0.3184 },
    { id: 10, name: '碳酸锶 (SrCO₃) - 俗称：碳酸锶矿', formula: 'SrCO₃', emissionFactor: 0.2980 },
    { id: 11, name: '碳酸镁钙 (CaMg(CO₃)₂) - 俗称：白云石', formula: 'CaMg(CO₃)₂', emissionFactor: 0.4773 },
  ];

  // 存储计算数据
  const [data, setData] = useState([]);
  // 存储用户自定义的碳酸盐数据
  const [customCarbonates, setCustomCarbonates] = useState([]);

  // 初始化数据
  useEffect(() => {
    // 初始化数据
    const initialData = defaultCarbonates.map(carbonate => ({
      ...carbonate,
      消耗量: '',
      纯度: '',
      CO2排放量: 0
    }));
    setData(initialData);
  }, []);

  // 计算CO2排放量
  const calculateEmission = useCallback((rowData) => {
    const 消耗量 = parseFloat(rowData.消耗量) || 0;
    const 纯度 = parseFloat(rowData.纯度) || 0;
    const emissionFactor = parseFloat(rowData.emissionFactor) || 0;
    
    // CO2排放量 = 消耗量 * 纯度 * 排放因子
    // 注意：纯度需要转换为小数形式
    const CO2排放量 = 消耗量 * (纯度 / 100) * emissionFactor;
    
    return CO2排放量;
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback((id, field, value) => {
    setData(prevData => {
      const updatedData = prevData.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          // 重新计算CO2排放量
          const CO2排放量 = calculateEmission(updatedRow);
          return { ...updatedRow, CO2排放量 };
        }
        return row;
      });
      return updatedData;
    });
  }, [calculateEmission]);

  // 处理自定义碳酸盐输入变化
  const handleCustomCarbonateChange = useCallback((index, field, value) => {
    setCustomCarbonates(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // 添加新的自定义碳酸盐行
  const addCustomCarbonate = useCallback(() => {
    setCustomCarbonates(prev => [...prev, { name: '', CO2排放量: '' }]);
  }, []);

  // 删除自定义碳酸盐行
  const removeCustomCarbonate = useCallback((index) => {
    setCustomCarbonates(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 使用useMemo计算总排放量，避免重复计算
  const totalEmission = useMemo(() => {
    // 计算默认碳酸盐的总排放量
    const defaultTotal = data.reduce((total, row) => total + row.CO2排放量, 0);
    // 计算自定义碳酸盐的总排放量
    const customTotal = customCarbonates.reduce((total, carbonate) => {
      return total + (parseFloat(carbonate.CO2排放量) || 0);
    }, 0);
    return defaultTotal + customTotal;
  }, [data, customCarbonates]);

  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);

  return (
    <div className="carbonate-emission">
      <div className="calculation-description">
        <p><strong>计算公式：</strong></p>
        <p>CO2排放量 = 消耗量 × 纯度 × 排放因子</p>
        <p><strong>单位说明：</strong>消耗量单位为吨/年，纯度为百分比，排放因子单位为吨CO2/吨碳酸盐。</p>
        <p><strong>证明材料：</strong>1、请提供企业台帐或统计报表来证明碳酸盐的消耗量。
2、碳酸盐的纯度和CO2排放因子数据，请提供采用供应商提供的商品性状数据，或有资质的专业机构出具的检测报告。</p>
      </div>
      <table className="emission-table">
        <thead>
          <tr>
            <th>碳酸盐种类</th>
            <th>消耗量（吨/年）</th>
            <th>碳酸盐质量百分比纯度（%）</th>
            <th>CO2排放因子（吨CO2/吨碳酸盐）</th>
            <th>CO2排放量（吨CO2当量）</th>
          </tr>
        </thead>
        <tbody>
          {/* 渲染默认碳酸盐行 */}
          {data.map(row => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>
                <input
                  type="number"
                  value={row.消耗量}
                  onChange={(e) => handleInputChange(row.id, '消耗量', e.target.value)}
                  placeholder="请输入消耗量"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={row.纯度}
                  onChange={(e) => handleInputChange(row.id, '纯度', e.target.value)}
                  placeholder="请输入纯度"
                />
              </td>
              <td>{row.emissionFactor}</td>
              <td>{row.CO2排放量.toFixed(8)}</td>
            </tr>
          ))}
          
          {/* 渲染自定义碳酸盐行 */}
          {customCarbonates.map((carbonate, index) => (
            <tr key={`custom-${index}`} style={{ backgroundColor: '#f9f9f9' }}>
              <td>
                <input
                  type="text"
                  value={carbonate.name}
                  onChange={(e) => handleCustomCarbonateChange(index, 'name', e.target.value)}
                  placeholder="碳酸盐名称"
                  style={{ width: '100%' }}
                />
              </td>
              <td colSpan={3}>
                <input
                  type="number"
                  value={carbonate.CO2排放量}
                  onChange={(e) => handleCustomCarbonateChange(index, 'CO2排放量', e.target.value)}
                  placeholder="CO2排放量（吨CO2当量）"
                  style={{ width: '100%' }}
                />
              </td>
              <td>
                {carbonate.CO2排放量 ? parseFloat(carbonate.CO2排放量).toFixed(8) : '0.00000000'}
                <button 
                  onClick={() => removeCustomCarbonate(index)}
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
            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>总计：</td>
            <td style={{ fontWeight: 'bold' }}>{totalEmission.toFixed(8)}</td>
          </tr>
        </tfoot>
      </table>
      
      {/* 添加自定义碳酸盐按钮 */}
      <button 
        onClick={addCustomCarbonate}
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
        添加其他碳酸盐种类
      </button>
    </div>
  );
}

export default CarbonateEmission;