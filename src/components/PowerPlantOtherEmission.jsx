import { useState, useEffect, useCallback, useMemo } from 'react';

// 发电设施及其他非水泥熟料生产设施排放量组件
function PowerPlantOtherEmission({ onEmissionChange }) {
  // 月份列表
  const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // 初始化数据
  const [emissionData, setEmissionData] = useState([
    {
      id: 1,
      name: '发电设施排放量',
      unit: 'tCO2',
      months: Array(12).fill(''),
      yearlyTotal: 0,
      acquisitionMethod: '计算值',
      dataSource: '',
      supportingMaterial: null
    },
    {
      id: 2,
      name: '其他非水泥熟料产品生产设施排放量',
      unit: 'tCO2',
      months: Array(12).fill(''),
      yearlyTotal: 0,
      acquisitionMethod: '计算值',
      dataSource: '',
      supportingMaterial: null
    }
  ]);

  // 计算全年合计值（内部函数移到handleMonthChange内，减少依赖）
  const handleMonthChange = useCallback((id, monthIndex, value) => {
    setEmissionData(prevData => {
      const updatedData = prevData.map(item => {
        if (item.id === id) {
          const updatedMonths = [...item.months];
          updatedMonths[monthIndex] = value;
          
          // 直接在函数内部计算全年合计，避免额外的依赖
          const yearlyTotal = updatedMonths.reduce((total, val) => {
            return total + (parseFloat(val) || 0);
          }, 0);
          
          return { ...item, months: updatedMonths, yearlyTotal };
        }
        return item;
      });
      return updatedData;
    });
  }, []); // 现在没有外部依赖

  // 处理数据来源变化
  const handleDataSourceChange = useCallback((id, value) => {
    setEmissionData(prevData => {
      return prevData.map(item => {
        if (item.id === id) {
          return { ...item, dataSource: value };
        }
        return item;
      });
    });
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback((id, file) => {
    setEmissionData(prevData => {
      return prevData.map(item => {
        if (item.id === id) {
          return { ...item, supportingMaterial: file };
        }
        return item;
      });
    });
  }, []);

  // 计算总排放量（优化：添加更稳定的计算逻辑）
  const totalEmission = useMemo(() => {
    return emissionData.reduce((total, item) => {
      // 确保数值类型正确
      const yearlyTotal = typeof item.yearlyTotal === 'number' ? item.yearlyTotal : 0;
      return total + yearlyTotal;
    }, 0);
  }, [emissionData]);

  // 当总排放量变化时，通知父组件（优化：添加防抖逻辑避免频繁调用）
  useEffect(() => {
    if (onEmissionChange) {
      // 使用setTimeout来避免频繁触发父组件更新
      const timer = setTimeout(() => {
        onEmissionChange(totalEmission);
      }, 100); // 100ms的防抖时间
      
      return () => clearTimeout(timer); // 清理定时器
    }
  }, [totalEmission, onEmissionChange]);

  return (
    <div className="power-plant-other-emission">
      <div className="calculation-description">
        <p><strong>说明：</strong></p>
        <p>本表格用于记录发电设施及其他非水泥熟料生产设施的CO2排放量。</p>
        <p><strong>单位说明：</strong>排放量单位为吨CO2 (tCO2)。</p>
      </div>
      
      <table className="emission-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>信息项</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>单位</th>
            {/* 月份列 */}
            {MONTHS.map((month, index) => (
              <th key={index} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                {month}
              </th>
            ))}
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>全年值</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>获取方式</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>数据来源</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>支撑材料</th>
          </tr>
        </thead>
        <tbody>
          {emissionData.map((item) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{item.unit}</td>
              {/* 月度输入框 */}
              {item.months.map((monthValue, monthIndex) => (
                <td key={monthIndex} style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={monthValue}
                    onChange={(e) => handleMonthChange(item.id, monthIndex, e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', textAlign: 'center', padding: '4px' }}
                    min="0"
                    step="0.001"
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                {Math.round(item.yearlyTotal)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {item.acquisitionMethod}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                <input
                  type="text"
                  value={item.dataSource}
                  onChange={(e) => handleDataSourceChange(item.id, e.target.value)}
                  placeholder="数据来源"
                  style={{ width: '100%', textAlign: 'center', padding: '4px' }}
                />
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(item.id, e.target.files[0])}
                  style={{ fontSize: '12px' }}
                />
                {item.supportingMaterial && (
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#1890ff' }}>
                    {item.supportingMaterial.name}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>总计：</td>
            <td colSpan={16} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#4CAF50' }}>
              {Math.round(totalEmission)} tCO2
            </td>
          </tr>
        </tfoot>
      </table>

      {/* 总排放量显示 */}
      <div className="total-emission" style={{ marginTop: '30px', padding: '20px', border: '2px solid #4CAF50', borderRadius: '8px', textAlign: 'center' }}>
        <h3>总排放量</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
          {Math.round(totalEmission)} 吨CO2当量
        </p>
      </div>
    </div>
  );
}

export default PowerPlantOtherEmission;