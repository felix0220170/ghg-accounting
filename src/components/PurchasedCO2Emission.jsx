import React, { useState, useEffect, useCallback } from 'react';

// 修改组件的prop名称，从onChange改为onEmissionChange
const PurchasedCO2Emission = ({ onEmissionChange, initialData = [] }) => {
  const [records, setRecords] = useState(initialData.length > 0 ? initialData : [{ 
    id: Date.now(), 
    amount: '',
    lossRatio: ''
  }]);

  // 计算单条记录排放量
  const calculateRecordEmission = (record) => {
    const amount = parseFloat(record.amount) || 0;
    const lossRatio = parseFloat(record.lossRatio) || 0;
    return amount * lossRatio / 100;
  };

  // 计算总排放量
  const calculateTotalEmission = useCallback(() => {
    return records.reduce((total, record) => {
      return total + calculateRecordEmission(record);
    }, 0);
  }, [records]);

  // 当排放量变化时通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange({
        records,
        totalEmission: calculateTotalEmission()
      });
    }
  }, [records, calculateTotalEmission, onEmissionChange]);

  // 添加新记录
  const addRecord = () => {
    setRecords([...records, { 
      id: Date.now(), 
      amount: '',
      lossRatio: ''
    }]);
  };

  // 删除记录
  const removeRecord = (id) => {
    setRecords(records.filter(record => record.id !== id));
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
    <div className="purchased-co2-emission">
      <div className="calculation-description">
        <h3>外购工业生产的二氧化碳核算</h3>
        <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h4>计算公式</h4>
          <p><strong>CO2排放量（吨）</strong> = 外购工业生产的二氧化碳消耗量（吨） × 二氧化碳的损耗比例（%）÷ 100</p>
        </div>
        <p><strong>单位说明：</strong>二氧化碳量单位为吨。</p>
        <p><strong>证明材料：</strong>使用工业生产的二氧化碳作为原料，其使用量应根据企业台账或统计报表来确定，如果没有，可采用供应商提供的发票或结算单等结算凭证上的数据。</p>
        
        <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
          <h5>生产流程损耗比例参考</h5>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #d9d9d9', padding: '8px' }}>生产流程</th>
                <th style={{ border: '1px solid #d9d9d9', padding: '8px' }}>建议损耗比例</th>
                <th style={{ border: '1px solid #d9d9d9', padding: '8px' }}>损耗范围</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>一次灌装</td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>40%</td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>40%~60%</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>二次灌装</td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>60%</td>
                <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>40%~60%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h4>外购工业生产的二氧化碳记录</h4>
      {records.map((record, index) => (
        <div key={record.id} className="record-container">
          <div className="record-header">
            <h5>记录 {index + 1}</h5>
            {records.length > 1 && (
              <button 
                className="remove-record-btn" 
                onClick={() => removeRecord(record.id)}
                style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
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
                <td>外购工业生产的二氧化碳消耗量 (吨)</td>
                <td>
                  <input
                    type="number"
                    value={record.amount}
                    onChange={(e) => updateRecord(record.id, 'amount', e.target.value)}
                    placeholder="请输入二氧化碳消耗量"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>外购的工业生产二氧化碳总量</td>
              </tr>
              <tr>
                <td>二氧化碳的损耗比例 (%)</td>
                <td>
                  <input
                    type="number"
                    value={record.lossRatio}
                    onChange={(e) => updateRecord(record.id, 'lossRatio', e.target.value)}
                    placeholder="请输入损耗比例"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </td>
                <td>根据生产流程参考损耗比例填写</td>
              </tr>
              <tr>
                <td><strong>本记录 CO2 排放量 (吨)</strong></td>
                <td colSpan={2}><strong>{calculateRecordEmission(record).toFixed(4)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      
      <button 
        className="add-record-btn" 
        onClick={addRecord}
        style={{
          backgroundColor: '#52c41a',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '15px'
        }}
      >
        添加记录
      </button>
      
      <div className="total-emission-section" style={{ marginTop: '30px' }}>
        <h4>总计</h4>
        <table className="emission-table">
          <tbody>
            <tr style={{ fontWeight: 'bold' }}>
              <td>外购工业生产的二氧化碳总排放量 (吨 CO2)</td>
              <td>{calculateTotalEmission().toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchasedCO2Emission;