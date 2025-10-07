import React, { useState, useEffect, useCallback, useMemo } from 'react';

const MethaneRecoveryEmission = ({ onEmissionChange, industry }) => {
  // CH4密度常量：吨/万Nm³
  const CH4_DENSITY = 7.17;

  // 记录状态管理 - 为平均销毁效率设置98%的默认值
  const [records, setRecords] = useState([{
    id: Date.now(),
    selfUsageVolume: '', // 甲烷气回收现场自用量（Nm³）
    selfUsageConcentration: '', // 回收自用甲烷气中CH4体积浓度（%）
    selfUsageOxidationRate: '', // 回收自用过程的甲烷氧化系数（%）
    externalSupplyVolume: '', // 回收外供第三方的甲烷气量（Nm³）
    externalSupplyConcentration: '', // 回收外供甲烷气中CH4体积浓度（%）
    flareDestructionVolume: '', // 火炬销毁的甲烷气体积量（Nm³）
    flareDestructionConcentration: '', // 火炬销毁装置CH4平均体积浓度（%）
    flareDestructionEfficiency: '98', // 火炬销毁的甲烷气平均销毁效率（%）- 设置默认值为98%
    // 直接输入的排放量
    selfUsageEmission: '', // CH4回收自用量的排放量
    externalSupplyEmission: '', // CH4回收外供第三方的量的排放量
    flareDestructionEmission: '' // CH4火炬销毁量的排放量
  }]);

  // 计算单条记录的CH4回收自用量排放量
  const calculateSelfUsageEmission = useCallback((record) => {
    // 优先使用直接输入的排放量
    if (record.selfUsageEmission) {
      return parseFloat(record.selfUsageEmission) || 0;
    }

    // 否则根据公式计算
    const volume = parseFloat(record.selfUsageVolume) || 0;
    const concentration = parseFloat(record.selfUsageConcentration) || 0;
    const oxidationRate = parseFloat(record.selfUsageOxidationRate) || 0;
    
    // 计算公式：自用量体积 * 体积浓度 * 氧化系数 * CH4密度 / 10000 (转换为万吨)
    return (volume * concentration * oxidationRate * CH4_DENSITY) / (100 * 100 * 10000);
  }, []);

  // 计算单条记录的CH4回收外供第三方排放量
  const calculateExternalSupplyEmission = useCallback((record) => {
    // 优先使用直接输入的排放量
    if (record.externalSupplyEmission) {
      return parseFloat(record.externalSupplyEmission) || 0;
    }

    // 否则根据公式计算
    const volume = parseFloat(record.externalSupplyVolume) || 0;
    const concentration = parseFloat(record.externalSupplyConcentration) || 0;
    
    // 计算公式：回收外供第三方体积 * 体积浓度 * CH4密度 / 10000 (转换为万吨)
    return (volume * concentration * CH4_DENSITY) / (100 * 10000);
  }, []);

  // 计算单条记录的CH4火炬销毁排放量
  const calculateFlareDestructionEmission = useCallback((record) => {
    // 优先使用直接输入的排放量
    if (record.flareDestructionEmission) {
      return parseFloat(record.flareDestructionEmission) || 0;
    }

    // 否则根据公式计算
    const volume = parseFloat(record.flareDestructionVolume) || 0;
    const concentration = parseFloat(record.flareDestructionConcentration) || 0;
    const efficiency = parseFloat(record.flareDestructionEfficiency) || 98; // 默认为98%
    
    // 计算公式：火炬销毁的体积 * 平均浓度 * CH4密度 * 平均销毁效率 / 10000 (转换为万吨)
    return (volume * concentration * CH4_DENSITY * efficiency) / (100 * 100 * 10000);
  }, []);

  // 计算单条记录的总排放量
  const calculateRecordTotalEmission = useCallback((record) => {
    return calculateSelfUsageEmission(record) + 
           calculateExternalSupplyEmission(record) + 
           calculateFlareDestructionEmission(record);
  }, [calculateSelfUsageEmission, calculateExternalSupplyEmission, calculateFlareDestructionEmission]);

  // 计算所有记录的总排放量
  const calculateTotalEmission = useCallback(() => {
    return records.reduce((total, record) => {
      return total + calculateRecordTotalEmission(record);
    }, 0);
  }, [records, calculateRecordTotalEmission]);

  // 计算所有记录的自用量排放总量
  const calculateTotalSelfUsageEmission = useCallback(() => {
    return records.reduce((total, record) => {
      return total + calculateSelfUsageEmission(record);
    }, 0);
  }, [records, calculateSelfUsageEmission]);

  // 计算所有记录的外供第三方排放总量
  const calculateTotalExternalSupplyEmission = useCallback(() => {
    return records.reduce((total, record) => {
      return total + calculateExternalSupplyEmission(record);
    }, 0);
  }, [records, calculateExternalSupplyEmission]);

  // 计算所有记录的火炬销毁排放总量
  const calculateTotalFlareDestructionEmission = useCallback(() => {
    return records.reduce((total, record) => {
      return total + calculateFlareDestructionEmission(record);
    }, 0);
  }, [records, calculateFlareDestructionEmission]);

  // 当总排放量变化时通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange(calculateTotalEmission());
    }
  }, [calculateTotalEmission, onEmissionChange]);

  // 添加新记录
  const addRecord = () => {
    setRecords([...records, {
      id: Date.now(),
      selfUsageVolume: '',
      selfUsageConcentration: '',
      selfUsageOxidationRate: '',
      externalSupplyVolume: '',
      externalSupplyConcentration: '',
      flareDestructionVolume: '',
      flareDestructionConcentration: '',
      flareDestructionEfficiency: '98', // 新记录也设置默认值为98%
      selfUsageEmission: '',
      externalSupplyEmission: '',
      flareDestructionEmission: ''
    }]);
  };

  // 删除记录
  const removeRecord = (id) => {
    if (records.length > 1) {
      setRecords(records.filter(record => record.id !== id));
    }
  };

  // 更新记录
  const updateRecord = (id, field, value) => {
    setRecords(records.map(record => {
      if (record.id === id) {
        return { ...record, [field]: value };
      }
      return record;
    }));
  };

  return (
    <div className="emission-section">
      <div className="calculation-description">
        <h3>CH4回收与销毁排放量计算</h3>
        <p><strong>计算说明：</strong></p>
        <p>1. CH4回收自用量的排放量 = 自用量体积 * 体积浓度 * 氧化系数 * CH4密度</p>
        <p>2. CH4回收外供第三方的量的排放量 = 回收外供第三方体积 * 体积浓度 * CH4密度</p>
        <p>3. 火炬销毁量的排放量 = 火炬销毁的体积 * 平均浓度 * CH4密度 * 平均销毁效率</p>
        <p><strong>单位说明：</strong>体积单位为Nm³，浓度和效率单位为%，CH4密度为7.17吨/万Nm³（标准状况下）。</p>
        <p><strong>注意：</strong>您可以直接输入排放量，或者通过输入基础参数进行计算。平均销毁效率默认值为98%。</p>
      </div>

      {records.map((record, index) => (
        <div key={record.id} className="record-container">
          <div className="record-header">
            <h5>记录 {index + 1}</h5>
            {records.length > 1 && (
              <button 
                className="remove-record-btn" 
                onClick={() => removeRecord(record.id)}
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
                <td>甲烷气回收现场自用量（Nm³）</td>
                <td>
                  <input
                    type="number"
                    value={record.selfUsageVolume}
                    onChange={(e) => updateRecord(record.id, 'selfUsageVolume', e.target.value)}
                    placeholder="请输入自用量体积"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>回收后现场自用的甲烷气体积</td>
              </tr>
              <tr>
                <td>回收自用甲烷气中CH4体积浓度（%）</td>
                <td>
                  <input
                    type="number"
                    value={record.selfUsageConcentration}
                    onChange={(e) => updateRecord(record.id, 'selfUsageConcentration', e.target.value)}
                    placeholder="请输入体积浓度"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td>自用甲烷气中CH4的体积百分比</td>
              </tr>
              <tr>
                <td>回收自用过程的甲烷氧化系数（%）</td>
                <td>
                  <input
                    type="number"
                    value={record.selfUsageOxidationRate}
                    onChange={(e) => updateRecord(record.id, 'selfUsageOxidationRate', e.target.value)}
                    placeholder="请输入氧化系数"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td>自用过程中甲烷氧化的比例</td>
              </tr>
              <tr>
                <td>CH4回收自用量的排放量（吨）</td>
                <td>
                  <input
                    type="number"
                    value={record.selfUsageEmission}
                    onChange={(e) => updateRecord(record.id, 'selfUsageEmission', e.target.value)}
                    placeholder="直接输入排放量或留空自动计算"
                    min="0"
                    step="0.001"
                  />
                </td>
                <td>计算结果: {calculateSelfUsageEmission(record).toFixed(6)} 吨</td>
              </tr>

              <tr>
                <td>回收外供第三方的甲烷气量（Nm³）</td>
                <td>
                  <input
                    type="number"
                    value={record.externalSupplyVolume}
                    onChange={(e) => updateRecord(record.id, 'externalSupplyVolume', e.target.value)}
                    placeholder="请输入外供体积"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>回收后供应给第三方的甲烷气体积</td>
              </tr>
              <tr>
                <td>回收外供甲烷气中CH4体积浓度（%）</td>
                <td>
                  <input
                    type="number"
                    value={record.externalSupplyConcentration}
                    onChange={(e) => updateRecord(record.id, 'externalSupplyConcentration', e.target.value)}
                    placeholder="请输入体积浓度"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td>外供甲烷气中CH4的体积百分比</td>
              </tr>
              <tr>
                <td>CH4回收外供第三方的排放量（吨）</td>
                <td>
                  <input
                    type="number"
                    value={record.externalSupplyEmission}
                    onChange={(e) => updateRecord(record.id, 'externalSupplyEmission', e.target.value)}
                    placeholder="直接输入排放量或留空自动计算"
                    min="0"
                    step="0.001"
                  />
                </td>
                <td>计算结果: {calculateExternalSupplyEmission(record).toFixed(6)} 吨</td>
              </tr>

              <tr>
                <td>火炬销毁的甲烷气体积量（Nm³）</td>
                <td>
                  <input
                    type="number"
                    value={record.flareDestructionVolume}
                    onChange={(e) => updateRecord(record.id, 'flareDestructionVolume', e.target.value)}
                    placeholder="请输入销毁体积"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>通过火炬销毁的甲烷气体积</td>
              </tr>
              <tr>
                <td>火炬销毁装置CH4平均体积浓度（%）</td>
                <td>
                  <input
                    type="number"
                    value={record.flareDestructionConcentration}
                    onChange={(e) => updateRecord(record.id, 'flareDestructionConcentration', e.target.value)}
                    placeholder="请输入平均浓度"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td>火炬中CH4的平均体积百分比</td>
              </tr>
              <tr>
                <td>火炬销毁的甲烷气平均销毁效率（%）</td>
                <td>
                  <input
                    type="number"
                    value={record.flareDestructionEfficiency}
                    onChange={(e) => updateRecord(record.id, 'flareDestructionEfficiency', e.target.value)}
                    placeholder="请输入销毁效率"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td>火炬销毁系统的平均销毁效率（默认98%）</td>
              </tr>
              <tr>
                <td>CH4火炬销毁排放量（吨）</td>
                <td>
                  <input
                    type="number"
                    value={record.flareDestructionEmission}
                    onChange={(e) => updateRecord(record.id, 'flareDestructionEmission', e.target.value)}
                    placeholder="直接输入排放量或留空自动计算"
                    min="0"
                    step="0.001"
                  />
                </td>
                <td>计算结果: {calculateFlareDestructionEmission(record).toFixed(6)} 吨</td>
              </tr>

              <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                <td>本记录总排放量（吨）</td>
                <td colSpan={2}>{calculateRecordTotalEmission(record).toFixed(6)} 吨</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <button className="add-record-btn" onClick={addRecord}>添加记录</button>

      <div className="total-emission-section" style={{ marginTop: '30px' }}>
        <h4>总计</h4>
        <table className="emission-table">
          <tbody>
            <tr>
              <td>CH4回收自用量总排放量（吨）</td>
              <td>{calculateTotalSelfUsageEmission().toFixed(6)}</td>
            </tr>
            <tr>
              <td>CH4回收外供第三方总排放量（吨）</td>
              <td>{calculateTotalExternalSupplyEmission().toFixed(6)}</td>
            </tr>
            <tr>
              <td>CH4火炬销毁总排放量（吨）</td>
              <td>{calculateTotalFlareDestructionEmission().toFixed(6)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>CH4回收与销毁总排放量（吨）</td>
              <td>{calculateTotalEmission().toFixed(6)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MethaneRecoveryEmission;