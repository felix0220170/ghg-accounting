import { useState, useEffect, useCallback, useMemo } from 'react';

function EnergyRawMaterialEmission({ industry = '其他', onEmissionChange }) {
  // 预设的还原剂类型及其排放因子
  const PRESET_REDUCTANTS = [
    { id: 1, name: '蓝炭作还原剂', emissionFactor: 2.853, factorUnit: 'tCO2/t', unit: 't' },
    { id: 2, name: '焦炭作还原剂', emissionFactor: 2.862, factorUnit: 'tCO2/t', unit: 't' },
    { id: 3, name: '无烟煤作还原剂', emissionFactor: 1.924, factorUnit: 'tCO2/t', unit: 't' },
    { id: 4, name: '天然气作还原剂', emissionFactor: 21.622, factorUnit: 'tCO2/万 Nm3', unit: '万 Nm3' }
  ];

  // 状态管理：预设还原剂的数据
  const [presetData, setPresetData] = useState([]);
  // 状态管理：自定义还原剂的数据
  const [customData, setCustomData] = useState([]);

  // 初始化预设还原剂数据
  useEffect(() => {
    const initialData = PRESET_REDUCTANTS.map(reductant => ({
      ...reductant,
      quantity: '',
      emission: 0
    }));
    setPresetData(initialData);
  }, []);

  // 计算单条预设还原剂的排放量
  const calculatePresetEmission = useCallback((data) => {
    const quantity = parseFloat(data.quantity) || 0;
    return quantity * data.emissionFactor;
  }, []);

  // 处理预设还原剂输入变化
  const handlePresetInputChange = useCallback((id, field, value) => {
    setPresetData(prevData => {
      const updatedData = prevData.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          const emission = calculatePresetEmission(updatedRow);
          return { ...updatedRow, emission };
        }
        return row;
      });
      return updatedData;
    });
  }, [calculatePresetEmission]);

  // 处理自定义还原剂输入变化
  const handleCustomInputChange = useCallback((index, field, value) => {
    setCustomData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // 添加新的自定义还原剂行
  const addCustomReductant = useCallback(() => {
    setCustomData(prev => [...prev, { name: '', quantity: '', emission: '', emissionFactor: '' }]);
  }, []);

  // 删除自定义还原剂行
  const removeCustomReductant = useCallback((index) => {
    setCustomData(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 使用useMemo计算总排放量，避免重复计算
  const totalEmission = useMemo(() => {
    // 计算预设还原剂的总排放量
    const totalPreset = presetData.reduce((total, row) => total + row.emission, 0);
    // 计算自定义还原剂的总排放量
    const totalCustom = customData.reduce((total, reductant) => {
      const quantity = parseFloat(reductant.quantity) || 0;
      const emissionFactor = parseFloat(reductant.emissionFactor) || 0;
      return total + quantity * emissionFactor;
    }, 0);
    return totalPreset + totalCustom;
  }, [presetData, customData]);

  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange({ totalEmission });
    }
  }, [totalEmission, onEmissionChange]);

  return (
    <div className="energy-raw-material-emission">
      <h2>能源的原材料用途（还原剂）</h2>
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>计算公式：</strong></p>
        <p>E 原材料 = AD 还原剂 × EF 还原剂</p>
        <p>其中：</p>
        <ul>
          <li>E 原材料：核算和报告年度内，能源作为原材料用途导致的二氧化碳排放量，单位为吨二氧化碳（tCO2）</li>
          <li>EF 还原剂：能源产品作为还原剂用途的二氧化碳排放因子，单位为吨二氧化碳／吨还原剂（tCO2／t还原剂）</li>
          <li>AD 还原剂：活动水平，即核算和报告年度内能源产品作为还原剂的消耗量</li>
        </ul>
        <p><strong>证明材料：</strong>各品种的还原剂消耗量应根据企业能源消费台帐或统计报表来确定，等于流入企业边界且明确作为还原剂使用的能源产品部分。</p>
      </div>
      
      <table className="emission-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>还原剂品种</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>消耗量（吨或万Nm³）</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>排放因子（tCO2/t 或 tCO2/万 Nm³）</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>CO2排放量（吨CO2）</th>
          </tr>
        </thead>
        <tbody>
          {/* 渲染预设还原剂行 */}
          {presetData.map(row => (
            <tr key={row.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => handlePresetInputChange(row.id, 'quantity', e.target.value)}
                  placeholder={`请输入消耗量（${row.unit}）`}
                  style={{ width: '100%', padding: '4px' }}
                  min="0"
                  step="0.0001"
                />
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.emissionFactor}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.emission.toFixed(8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* 自定义还原剂部分 */}
      <div className="custom-reductants">
        <h3 style={{ marginBottom: '10px' }}>自定义还原剂</h3>
        
        <table className="emission-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>还原剂名称</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>消耗量</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>排放因子</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {/* 渲染自定义还原剂行 */}
            {customData.map((reductant, index) => (
              <tr key={`custom-${index}`} style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <input
                    type="text"
                    value={reductant.name}
                    onChange={(e) => handleCustomInputChange(index, 'name', e.target.value)}
                    placeholder="输入还原剂名称"
                    style={{ width: '100%', padding: '4px' }}
                  />
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <input
                    type="number"
                    value={reductant.quantity}
                    onChange={(e) => handleCustomInputChange(index, 'quantity', e.target.value)}
                    placeholder="输入消耗量"
                    style={{ width: '100%', padding: '4px' }}
                    min="0"
                    step="0.0001"
                  />
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <input
                    type="number"
                    value={reductant.emissionFactor}
                    onChange={(e) => handleCustomInputChange(index, 'emissionFactor', e.target.value)}
                    placeholder="输入排放因子"
                    style={{ width: '100%', padding: '4px' }}
                    min="0"
                    step="0.0001"
                  />
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => removeCustomReductant(index)}
                    style={{ padding: '4px 8px', background: 'red', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 添加自定义还原剂按钮 */}
        <button 
          onClick={addCustomReductant}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          添加自定义还原剂
        </button>
      </div>
      
      {/* 总排放量 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '16px' }}>能源的原材料用途总排放量：{totalEmission.toFixed(8)} 吨 CO2</p>
      </div>
    </div>
  );
}

export default EnergyRawMaterialEmission;