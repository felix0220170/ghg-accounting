import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  METHANE_PRODUCTION_CAPACITY,
  DEFAULT_MCF_OPTIONS,
  FOOD_INDUSTRY_MCF_OPTIONS,
  PAPER_INDUSTRY_MCF_RECOMMENDED
} from '../config/wastewaterConstants';
import { INDUSTRY_TYPES } from '../config/industryConfig';

const WastewaterTreatmentEmission = ({ onEmissionChange, industry = INDUSTRY_TYPES.OTHER }) => {
  // 根据行业类型确定是否需要食品行业子分类
  const [foodSubCategory, setFoodSubCategory] = useState(FOOD_INDUSTRY_MCF_OPTIONS[0].value);

  // 多条废水记录的状态管理
  const [wastewaterRecords, setWastewaterRecords] = useState([{
    id: Date.now(),
    wastewaterVolume: '',
    inletCOD: '',
    outletCOD: '',
    removedCOD: '',
    sludgeCOD: '',
    mcf: industry === INDUSTRY_TYPES.PAPER ? PAPER_INDUSTRY_MCF_RECOMMENDED : 0.8,
    customMcf: industry === INDUSTRY_TYPES.PAPER ? PAPER_INDUSTRY_MCF_RECOMMENDED : null
  }]);

  // 自定义记录的状态管理
  const [customRecords, setCustomRecords] = useState([{
    id: Date.now(),
    name: '',
    emission: ''
  }]);

  // 根据行业和食品子分类获取当前的MCF值
  const getCurrentMcfValue = useCallback((record) => {
    if (industry === INDUSTRY_TYPES.PAPER) {
      // 造纸行业使用自定义MCF值
      return parseFloat(record.customMcf) || PAPER_INDUSTRY_MCF_RECOMMENDED;
    } else if (industry === INDUSTRY_TYPES.FOOD) {
      // 食品行业根据子分类获取推荐值
      const selectedOption = FOOD_INDUSTRY_MCF_OPTIONS.find(
        option => option.value === foodSubCategory
      );
      return selectedOption ? selectedOption.recommendedValue : 0.7;
    } else {
      // 其他行业使用选择的MCF值
      return record.mcf;
    }
  }, [industry, foodSubCategory]);

  // 计算单条废水记录的CH4排放量
  const calculateSingleEmission = useCallback((record) => {
    // 解析输入值
    const volume = parseFloat(record.wastewaterVolume) || 0;
    const inlet = parseFloat(record.inletCOD) || 0;
    const outlet = parseFloat(record.outletCOD) || 0;
    const removed = parseFloat(record.removedCOD) || 0;
    const sludge = parseFloat(record.sludgeCOD) || 0;
    const mcfValue = getCurrentMcfValue(record);

    let emission = 0;
    
    // 优先使用厌氧处理系统去除的COD量
    if (removed > 0) {
      // 使用直接提供的去除COD量计算（优先）
      emission = (removed - sludge) * METHANE_PRODUCTION_CAPACITY * mcfValue;
    } else if (volume > 0 && inlet > 0 && outlet > 0) {
      // 使用废水量和进出水浓度计算
      const calculatedRemovedCOD = volume * (inlet - outlet);
      emission = (calculatedRemovedCOD - sludge) * METHANE_PRODUCTION_CAPACITY * mcfValue;
    }

    return Math.max(0, emission / 1000); // 确保排放量不为负数
  }, [getCurrentMcfValue]);

  // 计算所有废水记录的总排放量
  const calculateTotalWastewaterEmission = useCallback(() => {
    return wastewaterRecords.reduce((total, record) => {
      return total + calculateSingleEmission(record);
    }, 0);
  }, [wastewaterRecords, calculateSingleEmission]);

  // 计算所有自定义记录的总排放量
  const calculateTotalCustomEmission = useCallback(() => {
    return customRecords.reduce((total, record) => {
      const emission = parseFloat(record.emission) || 0;
      return total + emission;
    }, 0);
  }, [customRecords]);

  // 计算总体总排放量
  const totalEmission = useMemo(() => {
    return calculateTotalWastewaterEmission() + calculateTotalCustomEmission();
  }, [calculateTotalWastewaterEmission, calculateTotalCustomEmission]);

  // 当排放量变化时通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);

  // 添加新的废水记录
  const addWastewaterRecord = () => {
    const defaultMcf = industry === INDUSTRY_TYPES.PAPER ? PAPER_INDUSTRY_MCF_RECOMMENDED : 0.8;
    setWastewaterRecords([...wastewaterRecords, {
      id: Date.now(),
      wastewaterVolume: '',
      inletCOD: '',
      outletCOD: '',
      removedCOD: '',
      sludgeCOD: '',
      mcf: defaultMcf,
      customMcf: industry === INDUSTRY_TYPES.PAPER ? defaultMcf : null
    }]);
  };

  // 删除废水记录
  const removeWastewaterRecord = (id) => {
    setWastewaterRecords(wastewaterRecords.filter(record => record.id !== id));
  };

  // 更新废水记录
  const updateWastewaterRecord = (id, field, value) => {
    setWastewaterRecords(wastewaterRecords.map(record => {
      if (record.id === id) {
        return { ...record, [field]: value };
      }
      return record;
    }));
  };

  // 添加新的自定义记录
  const addCustomRecord = () => {
    setCustomRecords([...customRecords, {
      id: Date.now(),
      name: '',
      emission: ''
    }]);
  };

  // 删除自定义记录
  const removeCustomRecord = (id) => {
    setCustomRecords(customRecords.filter(record => record.id !== id));
  };

  // 更新自定义记录
  const updateCustomRecord = (id, field, value) => {
    setCustomRecords(customRecords.map(record => {
      if (record.id === id) {
        return { ...record, [field]: value };
      }
      return record;
    }));
  };

  // 获取MCF描述
  const getMcfDescription = (value) => {
    const option = DEFAULT_MCF_OPTIONS.find(opt => opt.value === value);
    return option ? option.description : '';
  };

  // 获取食品行业当前子分类的MCF信息
  const getCurrentFoodMcfInfo = useMemo(() => {
    return FOOD_INDUSTRY_MCF_OPTIONS.find(option => option.value === foodSubCategory) || FOOD_INDUSTRY_MCF_OPTIONS[0];
  }, [foodSubCategory]);

  return (
    <div className="emission-section">
      <div className="calculation-description">
        <h3>工业废水厌氧处理 CH4 排放量计算</h3>
        <p><strong>计算说明：</strong></p>
        <p>1. 若已知废水量和进出水COD浓度：</p>
        <p>   工业废水厌氧处理 CH4 排放量 = (废水量 * (进水浓度 - 出水浓度) - 以污泥方式清除掉的 COD 量) * 甲烷最大生产能力 * 甲烷修正因子</p>
        <p>2. 若已知厌氧处理系统去除的COD量：</p>
        <p>   工业废水厌氧处理 CH4 排放量 = (厌氧处理系统去除的 COD 量 - 以污泥方式清除掉的 COD 量) * 甲烷最大生产能力 * 甲烷修正因子</p>
        <p><strong>单位说明：</strong>废水量单位为m³/年，COD浓度单位为kg COD/m³，COD量单位为千克COD，甲烷最大生产能力单位为千克 CH4/千克 COD。</p>
        <p><strong>证明材料：</strong>1、请提供企业台帐或统计报表来证明工业废水量。2、进出水COD浓度数据，请提供有资质的专业机构出具的检测报告。</p>
      </div>

      {/* 食品行业子分类选择 */}
      {industry === INDUSTRY_TYPES.FOOD && (
        <div className="industry-subcategory-selector" style={{ marginBottom: '20px' }}>
          <label htmlFor="foodSubCategory">选择食品行业子分类：</label>
          <select 
            id="foodSubCategory"
            value={foodSubCategory}
            onChange={(e) => setFoodSubCategory(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            {FOOD_INDUSTRY_MCF_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <p style={{ marginTop: '5px', color: '#666', fontSize: '14px' }}>
            推荐值: {getCurrentFoodMcfInfo.recommendedValue}, 建议范围: {getCurrentFoodMcfInfo.range}
          </p>
        </div>
      )}

      <h4>废水处理记录</h4>
      {wastewaterRecords.map((record, index) => (
        <div key={record.id} className="record-container">
          <div className="record-header">
            <h5>记录 {index + 1}</h5>
            {wastewaterRecords.length > 1 && (
              <button 
                className="remove-record-btn" 
                onClick={() => removeWastewaterRecord(record.id)}
              >
                删除记录
              </button>
            )}
          </div>
          
          <table className="emission-table">
            <thead>
              <tr>
                <th>参数</th>
                <th>数值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>厌氧处理的工业废水量 (m³/年)</td>
                <td>
                  <input
                    type="number"
                    value={record.wastewaterVolume}
                    onChange={(e) => updateWastewaterRecord(record.id, 'wastewaterVolume', e.target.value)}
                    placeholder="请输入废水量"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>用于计算COD去除量</td>
              </tr>
              <tr>
                <td>进水 COD 浓度 (kg COD/m³)</td>
                <td>
                  <input
                    type="number"
                    value={record.inletCOD}
                    onChange={(e) => updateWastewaterRecord(record.id, 'inletCOD', e.target.value)}
                    placeholder="请输入进水COD浓度"
                    min="0"
                    step="0.001"
                  />
                </td>
                <td>废水进入处理系统时的COD浓度</td>
              </tr>
              <tr>
                <td>出水 COD 浓度 (kg COD/m³)</td>
                <td>
                  <input
                    type="number"
                    value={record.outletCOD}
                    onChange={(e) => updateWastewaterRecord(record.id, 'outletCOD', e.target.value)}
                    placeholder="请输入出水COD浓度"
                    min="0"
                    step="0.001"
                  />
                </td>
                <td>废水排出处理系统时的COD浓度</td>
              </tr>
              <tr>
                <td>厌氧处理系统去除的 COD 量 (千克 COD)</td>
                <td>
                  <input
                    type="number"
                    value={record.removedCOD}
                    onChange={(e) => updateWastewaterRecord(record.id, 'removedCOD', e.target.value)}
                    placeholder="直接输入去除的COD量（优先使用）"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td><strong>优先使用此值计算</strong></td>
              </tr>
              <tr>
                <td>以污泥方式清除掉的 COD 量 (千克 COD)</td>
                <td>
                  <input
                    type="number"
                    value={record.sludgeCOD}
                    onChange={(e) => updateWastewaterRecord(record.id, 'sludgeCOD', e.target.value)}
                    placeholder="请输入污泥清除的COD量"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>随污泥排出系统的COD量</td>
              </tr>
              <tr>
                <td>甲烷最大生产能力 (千克 CH4/千克 COD)</td>
                <td>
                  <input
                    type="number"
                    value={METHANE_PRODUCTION_CAPACITY}
                    readOnly
                  />
                </td>
                <td>默认为0.25（固定值）</td>
              </tr>
              <tr>
                <td>甲烷修正因子 (MCF)</td>
                <td>
                  {industry === INDUSTRY_TYPES.PAPER ? (
                    // 造纸行业：仅允许自定义输入
                    <div>
                      <input
                        type="number"
                        value={record.customMcf || PAPER_INDUSTRY_MCF_RECOMMENDED}
                        onChange={(e) => updateWastewaterRecord(record.id, 'customMcf', e.target.value)}
                        placeholder="请输入MCF值"
                        min="0"
                        max="1"
                        step="0.01"
                      />
                      <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                        推荐值: {PAPER_INDUSTRY_MCF_RECOMMENDED}
                      </span>
                    </div>
                  ) : industry === INDUSTRY_TYPES.FOOD ? (
                    // 食品行业：显示当前子分类的推荐值（不可修改）
                    <div>
                      <input
                        type="number"
                        value={getCurrentFoodMcfInfo.recommendedValue}
                        readOnly
                      />
                      <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                        建议范围: {getCurrentFoodMcfInfo.range}
                      </span>
                    </div>
                  ) : (
                    // 其他行业：可选择或自定义
                    <select 
                      value={record.mcf} 
                      onChange={(e) => updateWastewaterRecord(record.id, 'mcf', parseFloat(e.target.value))}
                    >
                      {DEFAULT_MCF_OPTIONS.map((option, idx) => (
                        <option key={idx} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  {industry === INDUSTRY_TYPES.PAPER ? (
                    '造纸行业推荐使用0.5'
                  ) : industry === INDUSTRY_TYPES.FOOD ? (
                    getCurrentFoodMcfInfo.description
                  ) : (
                    getMcfDescription(record.mcf)
                  )}
                </td>
              </tr>
              <tr>
                <td><strong>本记录 CH4 排放量 (千克 CH4)</strong></td>
                <td colSpan={2}><strong>{calculateSingleEmission(record).toFixed(4)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <button className="add-record-btn" onClick={addWastewaterRecord}>添加废水处理记录</button>
      
      <h4 style={{ marginTop: '30px' }}>自定义排放量记录</h4>
      {customRecords.map((record, index) => (
        <div key={record.id} className="record-container">
          <div className="record-header">
            <h5>自定义记录 {index + 1}</h5>
            {customRecords.length > 1 && (
              <button 
                className="remove-record-btn" 
                onClick={() => removeCustomRecord(record.id)}
              >
                删除记录
              </button>
            )}
          </div>
          
          <table className="emission-table">
            <thead>
              <tr>
                <th>记录名称</th>
                <th>CH4排放量 (千克 CH4)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="text"
                    value={record.name}
                    onChange={(e) => updateCustomRecord(record.id, 'name', e.target.value)}
                    placeholder="请输入记录名称"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={record.emission}
                    onChange={(e) => updateCustomRecord(record.id, 'emission', e.target.value)}
                    placeholder="请输入CH4排放量"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <button className="add-record-btn" onClick={addCustomRecord}>添加自定义记录</button>
      
      <div className="total-emission-section" style={{ marginTop: '30px' }}>
        <h4>总计</h4>
        <table className="emission-table">
          <tbody>
            <tr>
              <td>废水处理记录总排放量 (千克 CH4)</td>
              <td>{calculateTotalWastewaterEmission().toFixed(4)}</td>
            </tr>
            <tr>
              <td>自定义记录总排放量 (千克 CH4)</td>
              <td>{calculateTotalCustomEmission().toFixed(4)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>工业废水厌氧处理 CH4 总排放量 (千克 CH4)</td>
              <td>{totalEmission.toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WastewaterTreatmentEmission;