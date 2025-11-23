import { useState, useEffect, useCallback, useMemo } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 创建初始的月度数据
const createInitialMonthlyData = () => {
  return MONTHS.map((month, index) => ({
    month: index + 1,
    monthName: month,
    value: ''
  }));
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 工序排放量汇总组件
function SteelProcessEmissionSummary({
  processes = [],
  fossilFuelEmissions = {},
  electricityEmissions = {},
  heatEmissions = {},
  onProcessUpdate
}) {
  // 产品产量数据
  const [productionData, setProductionData] = useState({});
  // 支撑材料文件
  const [supportingFiles, setSupportingFiles] = useState({});

  // 初始化每个工序的产品产量数据
  useEffect(() => {
    const initialData = {};
    processes.forEach(process => {
      if (!productionData[process.id]) {
        initialData[process.id] = {
          productName: '',
          productCode: '',
          monthlyData: createInitialMonthlyData()
        };
      }
    });
    if (Object.keys(initialData).length > 0) {
      setProductionData(prev => ({ ...prev, ...initialData }));
    }
  }, [processes]);

  // 产品名称和代码现在直接从process对象获取，不再需要单独更新

  // 更新月度产量数据
  const updateMonthlyProduction = useCallback((processId, monthIndex, value) => {
    setProductionData(prev => ({
      ...prev,
      [processId]: {
        ...prev[processId],
        monthlyData: prev[processId].monthlyData.map((month, index) => 
          index === monthIndex ? { ...month, value } : month
        )
      }
    }));
  }, []);

  // 计算年度合计值
  const calculateYearlyTotal = useCallback((monthlyData) => {
    return monthlyData.reduce((total, month) => {
      const value = parseFloat(month.value) || 0;
      return total + value;
    }, 0);
  }, []);

  // 获取工序的化石燃料排放量
  const getProcessFossilFuelEmission = useCallback((processId, monthIndex = null) => {
    // 处理新的数据结构，从processEmissions中获取数据
    const processData = fossilFuelEmissions.processEmissions?.[processId] || fossilFuelEmissions[processId];
    if (!processData) return 0;
    
    if (monthIndex !== null) {
      return processData.monthlyData?.[monthIndex] || 0;
    }
    
    return processData.yearlyTotal || 0;
  }, [fossilFuelEmissions]);

  // 获取工序的电力排放量
  const getProcessElectricityEmission = useCallback((processId, monthIndex = null) => {
    // 处理新的数据结构，从processEmissions中获取数据
    const processData = electricityEmissions.processEmissions?.[processId] || electricityEmissions[processId];
    if (!processData) return 0;
    
    if (monthIndex !== null) {
      return processData.monthlyData?.[monthIndex] || 0;
    }
    
    return processData.yearlyTotal || 0;
  }, [electricityEmissions]);

  // 获取工序的热力排放量
  const getProcessHeatEmission = useCallback((processId, monthIndex = null) => {
    // 处理新的数据结构，从processEmissions中获取数据
    const processData = heatEmissions.processEmissions?.[processId] || heatEmissions[processId];
    if (!processData) return 0;
    
    if (monthIndex !== null) {
      return processData.monthlyData?.[monthIndex] || 0;
    }
    
    return processData.yearlyTotal || 0;
  }, [heatEmissions]);

  // 计算总排放量
  const calculateTotalEmission = useCallback((processId, monthIndex = null) => {
    return (
      getProcessFossilFuelEmission(processId, monthIndex) +
      getProcessElectricityEmission(processId, monthIndex) +
      getProcessHeatEmission(processId, monthIndex)
    );
  }, [getProcessFossilFuelEmission, getProcessElectricityEmission, getProcessHeatEmission]);

  // 计算排放强度
  const calculateEmissionIntensity = useCallback((processId, monthIndex = null) => {
    const totalEmission = calculateTotalEmission(processId, monthIndex);
    const production = monthIndex !== null 
      ? parseFloat(productionData[processId]?.monthlyData?.[monthIndex]?.value || 0) 
      : calculateYearlyTotal(productionData[processId]?.monthlyData || []);
    
    return production > 0 ? totalEmission / production : 0;
  }, [productionData, calculateTotalEmission, calculateYearlyTotal]);

  // 更新支撑材料文件
  const updateSupportingFile = useCallback((processId, file) => {
    setSupportingFiles(prev => ({
      ...prev,
      [processId]: file
    }));
  }, []);

  // 渲染工序汇总表格
  const renderProcessSummaryTable = (process) => {
    const processProduction = productionData[process.id] || {
      // 直接从process对象获取产品名称和代码
      productName: process.productName || '',
      productCode: process.productCode || '',
      monthlyData: createInitialMonthlyData()
    };
    const yearlyProduction = calculateYearlyTotal(processProduction.monthlyData);
    
    return (
      <div key={process.id} className="process-summary-section" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '20px' }}>{process.processTypeName || process.name}</h3>
        
        <table className="summary-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'left', width: '200px' }}>信息项</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>单位</th>
              {MONTHS.map((month, index) => (
                <th key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>{month}</th>
              ))}
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>全年</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>获取方式</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>数据来源</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>支撑材料</th>
            </tr>
          </thead>
          <tbody>
            {/* 产品名称行 - 只读显示 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>产品名称: {process.productName || processProduction.productName}</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              {MONTHS.map((month, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center'  }}>-</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center'  }}>-</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>-</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>-</td>
            </tr>
            
            {/* 产品代码行 - 只读显示 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>产品代码: {process.productCode || processProduction.productCode}</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              {MONTHS.map((month, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center'  }}>-</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center'  }}>-</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>-</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>-</td>
            </tr>
            
            {/* 产品产量行 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>产品产量</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>t</td>
              {processProduction.monthlyData.map((month, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={month.value}
                    onChange={(e) => updateMonthlyProduction(process.id, index, e.target.value)}
                    style={{ width: '100%', padding: '4px', textAlign: 'center' }}
                    placeholder="0"
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                {yearlyProduction.toFixed(2)}
              </td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>计算</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                <input
                  type="file"
                  onChange={(e) => updateSupportingFile(process.id, e.target.files[0])}
                />
                {supportingFiles[process.id] && (
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {supportingFiles[process.id].name}
                  </div>
                )}
              </td>
            </tr>
            
            {/* 化石燃料排放量行 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>化石燃料排放量</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>tCO₂</td>
              {MONTHS.map((_, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                  {getProcessFossilFuelEmission(process.id, index).toFixed(2)}
                </td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                {getProcessFossilFuelEmission(process.id).toFixed(2)}
              </td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
            </tr>
            
            {/* 电力排放量行 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>消耗电力产生的排放量</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>tCO₂</td>
              {MONTHS.map((_, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                  {getProcessElectricityEmission(process.id, index).toFixed(2)}
                </td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                {getProcessElectricityEmission(process.id).toFixed(2)}
              </td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
            </tr>
            
            {/* 热力排放量行 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>消耗热力产生的排放量</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>tCO₂</td>
              {MONTHS.map((_, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                  {getProcessHeatEmission(process.id, index).toFixed(2)}
                </td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                {getProcessHeatEmission(process.id).toFixed(2)}
              </td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
            </tr>
            
            {/* 总排放量行 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>二氧化碳排放量</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>tCO₂</td>
              {MONTHS.map((_, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                  {calculateTotalEmission(process.id, index).toFixed(2)}
                </td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                {calculateTotalEmission(process.id).toFixed(2)}
              </td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>计算</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
            </tr>
            
            {/* 排放强度行 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>排放强度</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>tCO₂/t</td>
              {MONTHS.map((_, index) => (
                <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                  {calculateEmissionIntensity(process.id, index).toFixed(4)}
                </td>
              ))}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                {calculateEmissionIntensity(process.id).toFixed(4)}
              </td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>计算</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="process-emission-summary">
      <h2>工序排放量汇总</h2>
      
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>工序排放量汇总说明：</strong></p>
        <p>本表格汇总展示各工序的产品产量、各项排放量以及排放强度。</p>
        <p><strong>计算公式：</strong></p>
        <p>1. 二氧化碳排放量 = 化石燃料排放量 + 消耗电力产生的排放量 + 消耗热力产生的排放量</p>
        <p>2. 排放强度 = 二氧化碳排放量 / 产品产量</p>
      </div>

      <div className="total-emission-summary" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h3 style={{ marginBottom: '20px' }}>所有工序月度排放量汇总</h3>
        
        <table className="summary-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'left', width: '200px' }}>信息项</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>单位</th>
              {MONTHS.map((month, index) => (
                <th key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>{month}</th>
              ))}
              <th style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>全年</th>
            </tr>
          </thead>
          <tbody>
            {/* 总排放量行 */}
            <tr>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', fontWeight: 'bold' }}>总二氧化碳排放量</td>
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>t CO₂e</td>
              {MONTHS.map((month, index) => {
                // 计算该月所有工序的总排放量
                const monthlyTotal = processes.reduce((total, process) => {
                  return total + calculateTotalEmission(process.id, index);
                }, 0);
                return (
                  <td key={index} style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center' }}>
                    {monthlyTotal.toFixed(2)}
                  </td>
                );
              })}
              {/* 计算全年总排放量 */}
              <td style={{ border: '1px solid #e0e0e0', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                {processes.reduce((total, process) => {
                  return total + calculateTotalEmission(process.id);
                }, 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {processes.map(process => renderProcessSummaryTable(process))}
    </div>
  );
}

export default SteelProcessEmissionSummary;