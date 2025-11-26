import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 固体燃料数据
const SOLID_FUELS = [
  { id: 'anthracite', name: '无烟煤', calorificValue: 22.867, carbonContent: 0.02749, type: 'solid' },
  { id: 'bituminous', name: '烟煤', calorificValue: 23.076, carbonContent: 0.02308, type: 'solid' }, // 修正了单位热值含碳量
  { id: 'lignite', name: '褐煤', calorificValue: 14.759, carbonContent: 0.02797, type: 'solid' },
  { id: 'gangue', name: '煤矸石', calorificValue: 8.374, carbonContent: 0.02541, type: 'solid' },
  { id: 'sludge', name: '煤泥', calorificValue: 12.545, carbonContent: 0.02541, type: 'solid' },
  { id: 'coke', name: '焦炭', calorificValue: 28.435, carbonContent: 0.02942, type: 'solid' },
  { id: 'petroleumCoke', name: '石油焦', calorificValue: 32.500, carbonContent: 0.02750, type: 'solid' }
];

// 液体燃料数据
const LIQUID_FUELS = [
  { id: 'crudeOil', name: '原油', calorificValue: 41.816, carbonContent: 0.02008, type: 'liquid', oxidationRate: 98 },
  { id: 'fuelOil', name: '燃料油', calorificValue: 41.816, carbonContent: 0.02110, type: 'liquid', oxidationRate: 98 },
  { id: 'gasoline', name: '汽油', calorificValue: 43.070, carbonContent: 0.01890, type: 'liquid', oxidationRate: 98 },
  { id: 'diesel', name: '柴油', calorificValue: 42.652, carbonContent: 0.02020, type: 'liquid', oxidationRate: 98 },
  { id: 'kerosene', name: '煤油', calorificValue: 43.070, carbonContent: 0.01960, type: 'liquid', oxidationRate: 98 },
  { id: 'lng', name: '液化天然气', calorificValue: 51.498, carbonContent: 0.01720, type: 'liquid', oxidationRate: 98 },
  { id: 'lpg', name: '液化石油气', calorificValue: 50.179, carbonContent: 0.01720, type: 'liquid', oxidationRate: 98 },
  { id: 'coalTar', name: '煤焦油', calorificValue: 33.453, carbonContent: 0.02200, type: 'liquid', oxidationRate: 98 },
  { id: 'refineryGas', name: '炼厂干气', calorificValue: 45.998, carbonContent: 0.01820, type: 'liquid', oxidationRate: 98 }
];

// 气体燃料数据
const GAS_FUELS = [
  { id: 'naturalGas', name: '天然气', calorificValue: 389.310, carbonContent: 0.01532, type: 'gas', oxidationRate: 99 },
  { id: 'bfGas', name: '高炉煤气', calorificValue: 33.000, carbonContent: 0.07080, type: 'gas', oxidationRate: 99 },
  { id: 'converterGas', name: '转炉煤气', calorificValue: 84.000, carbonContent: 0.04960, type: 'gas', oxidationRate: 99 },
  { id: 'cokeOvenGas', name: '焦炉煤气', calorificValue: 173.854, carbonContent: 0.01210, type: 'gas', oxidationRate: 99 }
];

// 所有燃料列表
const ALL_FUELS = [...SOLID_FUELS, ...LIQUID_FUELS, ...GAS_FUELS];

// CO2计算常量
const CARBON_TO_CO2_RATIO = 44 / 12;

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 创建初始的月度数据
const createInitialMonthlyData = () => {
  return MONTHS.map((month, index) => ({
    month: index + 1,
    monthName: month,
    consumption: '', // 消耗量
    calorificValue: '', // 低位发热量
    carbonContent: '', // 单位热值含碳量
    receivedBaseCarbonContent: '', // 收到基元素碳含量
    oxidationRate: '', // 碳氧化率
    co2Emission: 0 // CO2排放量
  }));
};

// 钢铁行业化石燃料燃烧排放量组件（工序驱动）
function SteelProcessFossilFuelEmission({ onEmissionChange, productionLines = [], onProductionLinesChange, customFuels = [] }) {
  // 将productionLines重命名为processes以符合工序驱动的概念
  const processes = productionLines;
  
  // 保存上一次的排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);
  
  // 计算特定燃料类型的排放量
  const calculateFuelTypeEmissions = useCallback((process, fuelType) => {
    const fuels = fuelType === 'input' ? (process.inputFuels || []) : fuelType === 'output' ? (process.outputFuels || []) : [];
    const netEmissions = fuels.reduce((total, fuelItem) => {
      const monthlyEmissions = fuelItem.monthlyData || [];
      const fuelEmission = monthlyEmissions.reduce((sum, monthData) => sum + (parseFloat(monthData.co2Emission) || 0), 0);
      return total + fuelEmission;
    }, 0);
    return netEmissions;
  }, []);
  
  // 添加燃料到工序，通过回调通知父组件
  const addFuelToProcess = useCallback((processId, fuelId, fuelType = 'input') => {
    // 先在默认燃料中查找
    let fuel = ALL_FUELS.find(f => f.id === fuelId);
    // 如果默认燃料中没有找到，在自定义燃料中查找
    if (!fuel) {
      fuel = customFuels.find(f => f.id === fuelId);
    }
    if (!fuel || !onProductionLinesChange || !Array.isArray(processes)) return;
    
    const updatedProcesses = processes.map(process => {
      if (process.id !== processId) return process;
      
      const fuelItems = fuelType === 'input' ? (process.inputFuels || []) : (process.outputFuels || []);
      
      // 检查燃料是否已经存在
      const existingFuel = fuelItems.find(item => item.fuelId === fuelId);
      if (existingFuel) return process;
      
      // 创建新的燃料项
      const newFuelItem = {
        id: generateId(),
        fuelId: fuel.id,
        fuelName: fuel.name,
        fuelType: fuel.type,
        monthlyData: createInitialMonthlyData().map(monthData => ({
            ...monthData,
            calorificValue: fuel.calorificValue.toString(),
            carbonContent: fuel.carbonContent.toString(),
            receivedBaseCarbonContent: '',
            oxidationRate: fuel.oxidationRate || (fuel.type === 'solid' || fuel.type === 'liquid' ? 98 : 99)
          })),
      };
      
      const updatedFuelItems = [...fuelItems, newFuelItem];
      
      return {
        ...process,
        [fuelType === 'input' ? 'inputFuels' : 'outputFuels']: updatedFuelItems
      };
    });
    
    onProductionLinesChange(updatedProcesses);
  }, [processes, onProductionLinesChange, customFuels]);
  
  // 从工序中移除燃料
  const removeFuelFromProcess = useCallback((processId, fuelItemId, fuelType = 'input') => {
    if (!onProductionLinesChange || !Array.isArray(processes)) return;
    
    const updatedProcesses = processes.map(process => {
      if (process.id !== processId) return process;
      
      const fuelItems = fuelType === 'input' ? (process.inputFuels || []) : (process.outputFuels || []);
      const updatedFuelItems = fuelItems.filter(item => item.id !== fuelItemId);
      
      return {
        ...process,
        [fuelType === 'input' ? 'inputFuels' : 'outputFuels']: updatedFuelItems
      };
    });
    
    onProductionLinesChange(updatedProcesses);
  }, [processes, onProductionLinesChange]);
  
  // 更新燃料的月度数据
  const updateFuelMonthlyData = useCallback((processId, fuelItemId, monthIndex, field, value, fuelType = 'input') => {
    if (!onProductionLinesChange || !Array.isArray(processes)) return;
    
    const updatedProcesses = processes.map(process => {
      if (process.id !== processId) return process;
      
      const fuelItems = fuelType === 'input' ? (process.inputFuels || []) : (process.outputFuels || []);
      const updatedFuelItems = fuelItems.map(item => {
        if (item.id !== fuelItemId) return item;
        
        const updatedMonthlyData = item.monthlyData.map((monthData, index) => {
          if (index !== monthIndex) return monthData;
          
          const updatedMonthData = { ...monthData, [field]: value };
          
          // 重新计算CO2排放量
          const consumption = parseFloat(updatedMonthData.consumption) || 0;
          const calorificValue = parseFloat(updatedMonthData.calorificValue) || 0;
          const carbonContent = parseFloat(updatedMonthData.carbonContent) || 0;
          const oxidationRate = parseFloat(updatedMonthData.oxidationRate) || (item.oxidationRate || 98);

          // 如果用户输入了收到基元素碳含量，则优先使用它
          const receivedBaseCarbonContent = parseFloat(updatedMonthData.receivedBaseCarbonContent) || 0;
          let co2Emission = 0;
          if (receivedBaseCarbonContent > 0) {
             co2Emission =  consumption * receivedBaseCarbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
          } else {
             co2Emission = consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
          }
          
          // 使用单位热值含碳量计算CO2排放量
          //const co2Emission = consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
          
          return {
            ...updatedMonthData,
            co2Emission: co2Emission
          };
        });
        
        return {
          ...item,
          monthlyData: updatedMonthlyData
        };
      });
      
      return {
        ...process,
        [fuelType === 'input' ? 'inputFuels' : 'outputFuels']: updatedFuelItems
      };
    });
    
    onProductionLinesChange(updatedProcesses);
  }, [processes, onProductionLinesChange]);
  
  // 添加自定义燃料
  const addCustomFuel = useCallback((formData) => {
    if (!onProductionLinesChange || !Array.isArray(processes) || processes.length === 0) return;
    
    // 创建新的自定义燃料对象
    const newCustomFuel = {
      id: generateId(),
      name: formData.name,
      type: formData.type,
      calorificValue: parseFloat(formData.calorificValue) || 0,
      carbonContent: parseFloat(formData.carbonContent) || 0,
      oxidationRate: parseFloat(formData.oxidationRate) || (formData.type === 'solid' || formData.type === 'liquid' ? 98 : 99)
    };
    
    // 根据燃料类型决定添加到输入还是输出
    const fuelCategory = formData.fuelCategory || 'input';
    
    // 将新创建的自定义燃料添加到第一个工序
    const firstProcessId = processes[0].id;
    addFuelToProcess(firstProcessId, newCustomFuel.id, fuelCategory);
  }, [processes, addFuelToProcess, onProductionLinesChange]);
  
  // 移除自定义燃料
  const removeCustomFuel = useCallback((fuelId) => {
    if (!onProductionLinesChange || !Array.isArray(processes)) return;
    
    // 从所有工序的输入和输出燃料中移除该自定义燃料
    const updatedProcesses = processes.map(process => {
      const updatedInputFuels = process.inputFuels && Array.isArray(process.inputFuels)
        ? process.inputFuels.filter(item => item.fuelId !== fuelId)
        : [];
      
      const updatedOutputFuels = process.outputFuels && Array.isArray(process.outputFuels)
        ? process.outputFuels.filter(item => item.fuelId !== fuelId)
        : [];
      
      return {
        ...process,
        inputFuels: updatedInputFuels,
        outputFuels: updatedOutputFuels
      };
    });
    
    onProductionLinesChange(updatedProcesses);
  }, [processes, onProductionLinesChange]);
  
  // 计算总排放量
  const calculateTotalEmissions = useCallback(() => {
    return processes.reduce((total, process) => {
      const inputEmissions = calculateFuelTypeEmissions(process, 'input');
      const outputEmissions = calculateFuelTypeEmissions(process, 'output');
      return total + (inputEmissions - outputEmissions);
    }, 0);
  }, [processes, calculateFuelTypeEmissions]);
  
  // 使用useEffect来通知父组件排放量的变化
  useEffect(() => {
    const currentEmission = calculateTotalEmissions();
    
    // 只有当排放量真正发生变化时才通知父组件
    if (onEmissionChange && currentEmission !== previousEmissionRef.current) {
      onEmissionChange(currentEmission);
      previousEmissionRef.current = currentEmission;
    }
  }, [calculateTotalEmissions, onEmissionChange]);
  
  // 使用useEffect来更新工序数据
  useEffect(() => {
    // 移除不必要的processes更新，避免无限循环
    // 净排放量信息可以在需要时直接计算，不需要在每个process对象中存储
  }, []);
  
  // 辅助函数：获取燃料单位
  const getFuelUnit = useCallback((fuelType) => {
    switch (fuelType) {
      case 'solid':
      case 'liquid':
        return 't';
      case 'gas':
        return '万Nm³';
      default:
        return 't';
    }
  }, []);

  // 辅助函数：计算年度总计
  const calculateYearlyTotal = useCallback((monthlyData, field) => {
    return monthlyData.reduce((total, monthData) => {
      return total + (parseFloat(monthData[field]) || 0);
    }, 0);
  }, []);

  // 辅助函数：计算年度排放量
  const calculateYearlyEmission = useCallback((monthlyData) => {
    return monthlyData.reduce((total, monthData) => {
      return total + (parseFloat(monthData.co2Emission) || 0);
    }, 0);
  }, []);

  // 辅助函数：格式化单位
  const formatUnit = useCallback((fuelType, prefix) => {
    return prefix + (fuelType === 'gas' ? '万Nm³' : 't');
  }, []);

  // 辅助函数：计算月度排放量
  const calculateMonthlyEmission = useCallback((monthData) => {
    return monthData.co2Emission || 0;
  }, []);

  // 更新文件（模拟）
  const updateFile = useCallback((processId, fuelItemId, field, file) => {
    // 实际实现可以根据需要进行
    console.log('File updated:', { processId, fuelItemId, field, fileName: file?.name });
  }, []);

  // 渲染燃料表格的函数
  const renderFuelTable = useCallback((process, fuelItems, fuelType) => {
    // 按燃料类型分组显示
    return ['solid', 'liquid', 'gas'].map((itemFuelType, typeIndex) => {
      // 过滤当前类型的燃料
      const fuelsOfType = fuelItems.filter(item => item.fuelType === itemFuelType);
      if (fuelsOfType.length === 0) return null;

      // 获取燃料类型的中文名称
      const fuelTypeLabel = itemFuelType === 'solid' ? '固体燃料' : itemFuelType === 'liquid' ? '液体燃料' : '气体燃料';

      return (
        <div key={`${fuelType}-${itemFuelType}`} style={{ marginBottom: '25px' }}>
          <h4 style={{ color: itemFuelType === 'solid' ? '#8B4513' : itemFuelType === 'liquid' ? '#0000CD' : '#4682B4', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {fuelTypeLabel}
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '120px' }}>燃料名称</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '200px' }}>信息项</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '100px' }}>单位</th>
                {/* 1-12月 */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                  <th key={month} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '80px' }}>{month}月</th>
                ))}
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '100px' }}>全年值</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '100px' }}>获取方式</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '120px' }}>数据来源</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '150px' }}>支撑材料</th>
              </tr>
            </thead>
            <tbody>
              {/* 每个燃料生成6行数据 */}
              {fuelsOfType.map(fuelItem => {
                const fuelUnit = getFuelUnit(fuelItem.fuelType);
                const yearlyConsumption = calculateYearlyTotal(fuelItem.monthlyData, 'consumption');
                const yearlyEmission = calculateYearlyEmission(fuelItem.monthlyData);
                
                // 生成6行数据：消耗量、低位发热量、单位热值含碳量、收到基元素碳含量、碳氧化率、排放量
                const rows = [
                  {
                    type: 'consumption',
                    label: '消耗量',
                    unit: fuelUnit,
                    getValue: (monthData) => monthData.consumption,
                    yearlyValue: yearlyConsumption,
                    yearlyValueType: '合计',
                    acquisitionMethod: '',
                    showUpload: true
                  },
                  {
                    type: 'calorificValue',
                    label: '收到基低位发热量',
                    unit: fuelUnit === 't' ? 'GJ/t' : formatUnit('gas', 'GJ/'),
                    getValue: (monthData) => monthData.calorificValue,
                    yearlyValue: '',
                    yearlyValueType: '',
                    acquisitionMethod: '',
                    showUpload: true
                  },
                  {
                    type: 'carbonContent',
                    label: '单位热值含碳量',
                    unit: 'tC/GJ',
                    getValue: (monthData) => monthData.carbonContent,
                    yearlyValue: '',
                    yearlyValueType: '',
                    acquisitionMethod: '缺省值',
                    showUpload: false
                  },
                  {
                    type: 'receivedBaseCarbonContent',
                    label: '收到基元素碳含量',
                    unit: fuelUnit === 't' ? 'tC/t' : formatUnit('gas', 'tC/'),
                    getValue: (monthData) => monthData.receivedBaseCarbonContent,
                    yearlyValue: '',
                    yearlyValueType: '',
                    acquisitionMethod: '',
                    showUpload: false
                  },
                  {
                    type: 'oxidationRate',
                    label: '碳氧化率',
                    unit: '%',
                    getValue: (monthData) => monthData.oxidationRate,
                    yearlyValue: '',
                    yearlyValueType: '',
                    acquisitionMethod: '缺省值',
                    showUpload: false
                  },
                  {
                    type: 'emission',
                    label: '燃烧排放量',
                    unit: '吨CO2当量',
                    getValue: (monthData) => calculateMonthlyEmission(monthData),
                    yearlyValue: yearlyEmission,
                    yearlyValueType: '合计',
                    acquisitionMethod: '计算值',
                    showUpload: false
                  }
                ];

                return rows.map((row, rowIndex) => (
                  <tr key={`${fuelItem.id}-${row.type}`}>
                    {/* 燃料名称（仅在第一行显示） */}
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      {rowIndex === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <strong style={{ color: fuelItem.fuelType === 'solid' ? '#8B4513' : fuelItem.fuelType === 'liquid' ? '#0000CD' : '#4682B4' }}>{fuelItem.fuelName}</strong>
                          {/* 移除燃料按钮 */}
                          <button
                            onClick={() => removeFuelFromProcess(process.id, fuelItem.id, fuelType)}
                            style={{
                              padding: '2px 6px',
                              background: 'red',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              width: '100%'
                            }}
                          >
                            移除燃料
                          </button>
                        </div>
                      )}
                    </td>
                    
                    {/* 信息项 */}
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{row.label}</td>
                    
                    {/* 单位 */}
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{row.unit}</td>
                    
                    {/* 1-12月数据 */}
                    {fuelItem.monthlyData.map((monthData, monthIndex) => {
                      // 获取原始值用于输入框
                      let value = row.getValue(monthData);
                      // 只对非空字符串进行处理，避免空值导致的错误
                      if (value !== '' && !isNaN(parseFloat(value))) {
                        value = parseFloat(value).toString();
                      }
                      
                      return (
                        <td key={monthIndex} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          {row.type === 'emission' ? (
                            value !== '' && !isNaN(parseFloat(value)) ? parseFloat(value).toFixed(2) : value
                          ) : (
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => updateFuelMonthlyData(process.id, fuelItem.id, monthIndex, row.type, e.target.value, fuelType)}
                              placeholder="0"
                              style={{ width: '60px', textAlign: 'center' }}
                              step={row.type === 'receivedBaseCarbonContent' ? '0.0001' : 'any'}
                            />
                          )}
                        </td>
                      );
                    })}
                    
                    {/* 全年值 */}
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {row.type === 'emission' ? (
                        // 化石燃料燃烧排放量全年值保留到小数点后两位
                        parseFloat(row.yearlyValue).toFixed(2)
                      ) : row.type === 'consumption' && row.yearlyValue ? (
                        // 化石燃料消耗量全年值保留到小数点后两位
                        parseFloat(row.yearlyValue).toFixed(2)
                      ) : row.yearlyValue ? (
                        row.yearlyValue
                      ) : ''}
                    </td>
                    
                    {/* 获取方式 */}
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{row.acquisitionMethod}</td>
                    
                    {/* 数据来源 */}
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      <input
                        type="text"
                        placeholder="数据来源"
                        style={{ width: '100%', textAlign: 'center' }}
                      />
                    </td>
                    
                    {/* 支撑材料 */}
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      {row.showUpload ? (
                        <input
                          type="file"
                          onChange={(e) => updateFile(process.id, fuelItem.id, row.type, e.target.files[0])}
                          style={{ fontSize: '12px' }}
                        />
                      ) : ''}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      );
    });
  }, [updateFuelMonthlyData, removeFuelFromProcess, getFuelUnit, calculateYearlyTotal, calculateYearlyEmission, formatUnit, calculateMonthlyEmission, updateFile]);

  // 自定义燃料表单组件
  const CustomFuelForm = ({ onAddCustomFuel }) => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'solid',
      calorificValue: '',
      carbonContent: '',
      oxidationRate: '',
      fuelCategory: 'input'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onAddCustomFuel(formData);
      // 重置表单
      setFormData({
        name: '',
        type: 'solid',
        calorificValue: '',
        carbonContent: '',
        oxidationRate: '',
        fuelCategory: 'input'
      });
    };

    return (
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
        <h4 style={{ marginBottom: '15px' }}>添加自定义燃料</h4>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>燃料名称:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>燃料类型:</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="solid">固体燃料</option>
                <option value="liquid">液体燃料</option>
                <option value="gas">气体燃料</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>低位发热量 (GJ/t):</label>
              <input
                type="number"
                step="0.001"
                value={formData.calorificValue}
                onChange={(e) => setFormData({ ...formData, calorificValue: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>单位热值含碳量 (tC/GJ):</label>
              <input
                type="number"
                step="0.00001"
                value={formData.carbonContent}
                onChange={(e) => setFormData({ ...formData, carbonContent: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>碳氧化率 (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.oxidationRate}
                onChange={(e) => setFormData({ ...formData, oxidationRate: e.target.value })}
                placeholder={formData.type === 'solid' || formData.type === 'liquid' ? '98' : '99'}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>燃料类别:</label>
              <select
                value={formData.fuelCategory}
                onChange={(e) => setFormData({ ...formData, fuelCategory: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="input">输入燃料</option>
                <option value="output">输出燃料</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>添加燃料</button>
        </form>
      </div>
    );
  };

  // 组件返回JSX结构
  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '20px', color: '#333' }}>主要工序消耗化石燃料排放</h3>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
        <h5 style={{ marginBottom: '10px', color: '#666' }}>计算说明</h5>
        <p style={{ marginBottom: '8px' }}>• 排放量计算采用单位热值含碳量法: 消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × (44/12)</p>
        <p style={{ marginBottom: '8px' }}>• 单位热值含碳量单位: tC/GJ</p>
        <p style={{ marginBottom: '8px' }}>• 低位发热量单位: GJ/t (固体燃料), GJ/t (液体燃料), GJ/万Nm³ (气体燃料)</p>
        <p style={{ marginBottom: '8px' }}>• 默认碳氧化率: 固体燃料98%, 液体燃料98%, 气体燃料99%</p>
        <p style={{ marginBottom: '8px' }}>• <strong>工序汇总计算逻辑</strong>:</p>
        <p style={{ marginBottom: '8px', marginLeft: '20px' }}>✓ 输入燃料排放量汇总: 各燃料输入量按上述公式分别计算后求和</p>
        <p style={{ marginBottom: '8px', marginLeft: '20px' }}>✓ 输出燃料排放量汇总: 各燃料输出量按上述公式分别计算后求和</p>
        <p style={{ marginBottom: '8px', marginLeft: '20px' }}>✓ 净排放量(输入-输出): 输入燃料排放量减去输出燃料排放量</p>
        <p style={{ marginBottom: '8px' }}>• <strong>月度计算</strong>: 每月排放量独立计算，全年合计为12个月排放量之和</p>
        <p style={{ marginBottom: '8px' }}>• <strong>优先计算规则</strong>: 如用户输入了收到基元素碳含量，则优先使用收到基元素碳含量计算，公式为: 消耗量 × 收到基元素碳含量 × 碳氧化率 × (44/12)</p>
        <p style={{ marginBottom: '8px' }}>• <strong>所有工序汇总</strong>: 汇总所有工序的月度净排放量，得出企业整体月度排放数据</p>
      </div>

      {/* 所有工序按月净排放汇总 */}
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fff3f3', border: '1px solid #e57373', borderRadius: '6px' }}>
        <h4 style={{ marginBottom: '15px', color: '#c62828', fontWeight: 'bold' }}>所有工序净排放汇总</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '150px' }}>项目</th>
              {/* 1-12月 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <th key={month} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '80px' }}>{month}月</th>
              ))}
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '100px' }}>全年合计</th>
            </tr>
          </thead>
          <tbody>
            {/* 所有工序的净排放汇总 */}
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ffebee', color: '#b71c1c' }}>净排放量（所有工序）</td>
              {(() => {
                // 初始化12个月的总净排放量为0
                const monthlyNetEmissions = [];
                let yearlyTotal = 0;
                
                for (let i = 0; i < 12; i++) {
                  monthlyNetEmissions.push(0);
                }
                
                // 计算每个工序的净排放量
                processes.forEach(process => {
                  // 计算输入燃料各月份排放量
                  if (process.inputFuels && Array.isArray(process.inputFuels)) {
                    process.inputFuels.forEach(fuelItem => {
                      if (fuelItem.monthlyData && Array.isArray(fuelItem.monthlyData)) {
                        fuelItem.monthlyData.forEach((monthData, monthIndex) => {
                          const emission = parseFloat(monthData.co2Emission) || 0;
                          monthlyNetEmissions[monthIndex] += emission;
                        });
                      }
                    });
                  }
                  
                  // 减去输出燃料各月份排放量
                  if (process.outputFuels && Array.isArray(process.outputFuels)) {
                    process.outputFuels.forEach(fuelItem => {
                      if (fuelItem.monthlyData && Array.isArray(fuelItem.monthlyData)) {
                        fuelItem.monthlyData.forEach((monthData, monthIndex) => {
                          const emission = parseFloat(monthData.co2Emission) || 0;
                          monthlyNetEmissions[monthIndex] -= emission;
                        });
                      }
                    });
                  }
                });
                
                // 计算全年总计
                yearlyTotal = monthlyNetEmissions.reduce((sum, value) => sum + value, 0);
                
                // 渲染每个月的数据
                const cells = [];
                monthlyNetEmissions.forEach((emission, index) => {
                  cells.push(
                    <td key={`month-${index}`} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {emission.toFixed(2)}
                    </td>
                  );
                });
                
                // 添加全年合计
                cells.push(
                  <td key="yearly-total" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#ffebee', color: '#d32f2f' }}>
                    {yearlyTotal.toFixed(2)}
                  </td>
                );
                
                return cells;
              })()}
            </tr>
          </tbody>
        </table>
      </div>

      {processes.map(process => (
        <div key={process.id} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '20px', color: '#2196F3' }}>{process.processTypeName}</h3>
          {/* 工序汇总表 */}
          <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f0f7ff', border: '1px solid #2196F3', borderRadius: '6px' }}>
            <h5 style={{ marginBottom: '15px', color: '#2196F3', fontWeight: 'bold' }}>工序汇总表</h5>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '150px' }}>项目</th>
                  {/* 1-12月 */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                    <th key={month} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '80px' }}>{month}月</th>
                  ))}
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '100px' }}>全年合计</th>
                </tr>
              </thead>
              <tbody>
                {/* 第一行：输入燃料按月汇总 */}
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f8fff8', color: '#4CAF50' }}>输入燃料排放量</td>
                  {(() => {
                    // 计算每个月的输入燃料排放量汇总
                    const monthlyTotals = [];
                    let yearlyTotal = 0;
                    
                    // 初始化12个月的数据为0
                    for (let i = 0; i < 12; i++) {
                      monthlyTotals.push(0);
                    }
                    
                    // 汇总所有输入燃料的排放量
                    if (process.inputFuels && Array.isArray(process.inputFuels)) {
                      process.inputFuels.forEach(fuelItem => {
                        if (fuelItem.monthlyData && Array.isArray(fuelItem.monthlyData)) {
                          fuelItem.monthlyData.forEach((monthData, monthIndex) => {
                            const emission = parseFloat(monthData.co2Emission) || 0;
                            monthlyTotals[monthIndex] += emission;
                            yearlyTotal += emission;
                          });
                        }
                      });
                    }
                    
                    // 渲染每个月的数据
                    const cells = [];
                    monthlyTotals.forEach((total, index) => {
                      cells.push(
                        <td key={`input-${index}`} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          {total.toFixed(2)}
                        </td>
                      );
                    });
                    
                    // 添加全年合计
                    cells.push(
                      <td key="input-yearly" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                        {yearlyTotal.toFixed(2)}
                      </td>
                    );
                    
                    return cells;
                  })()}
                </tr>
                
                {/* 第二行：输出燃料按月汇总 */}
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff9f0', color: '#FF9800' }}>输出燃料排放量</td>
                  {(() => {
                    // 计算每个月的输出燃料排放量汇总
                    const monthlyTotals = [];
                    let yearlyTotal = 0;
                    
                    // 初始化12个月的数据为0
                    for (let i = 0; i < 12; i++) {
                      monthlyTotals.push(0);
                    }
                    
                    // 汇总所有输出燃料的排放量
                    if (process.outputFuels && Array.isArray(process.outputFuels)) {
                      process.outputFuels.forEach(fuelItem => {
                        if (fuelItem.monthlyData && Array.isArray(fuelItem.monthlyData)) {
                          fuelItem.monthlyData.forEach((monthData, monthIndex) => {
                            const emission = parseFloat(monthData.co2Emission) || 0;
                            monthlyTotals[monthIndex] += emission;
                            yearlyTotal += emission;
                          });
                        }
                      });
                    }
                    
                    // 渲染每个月的数据
                    const cells = [];
                    monthlyTotals.forEach((total, index) => {
                      cells.push(
                        <td key={`output-${index}`} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          {total.toFixed(2)}
                        </td>
                      );
                    });
                    
                    // 添加全年合计
                    cells.push(
                      <td key="output-yearly" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                        {yearlyTotal.toFixed(2)}
                      </td>
                    );
                    
                    return cells;
                  })()}
                </tr>
                
                {/* 第三行：输入-输出的按月汇总（净排放） */}
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff3f3', color: '#f44336' }}>净排放量（输入-输出）</td>
                  {(() => {
                    // 计算每个月的输入和输出燃料排放量
                    const inputMonthlyTotals = [];
                    const outputMonthlyTotals = [];
                    let yearlyTotal = 0;
                    
                    // 初始化12个月的数据为0
                    for (let i = 0; i < 12; i++) {
                      inputMonthlyTotals.push(0);
                      outputMonthlyTotals.push(0);
                    }
                    
                    // 汇总输入燃料排放量
                    if (process.inputFuels && Array.isArray(process.inputFuels)) {
                      process.inputFuels.forEach(fuelItem => {
                        if (fuelItem.monthlyData && Array.isArray(fuelItem.monthlyData)) {
                          fuelItem.monthlyData.forEach((monthData, monthIndex) => {
                            inputMonthlyTotals[monthIndex] += parseFloat(monthData.co2Emission) || 0;
                          });
                        }
                      });
                    }
                    
                    // 汇总输出燃料排放量
                    if (process.outputFuels && Array.isArray(process.outputFuels)) {
                      process.outputFuels.forEach(fuelItem => {
                        if (fuelItem.monthlyData && Array.isArray(fuelItem.monthlyData)) {
                          fuelItem.monthlyData.forEach((monthData, monthIndex) => {
                            outputMonthlyTotals[monthIndex] += parseFloat(monthData.co2Emission) || 0;
                          });
                        }
                      });
                    }
                    
                    // 渲染每个月的净排放量
                    const cells = [];
                    for (let i = 0; i < 12; i++) {
                      const netEmission = inputMonthlyTotals[i] - outputMonthlyTotals[i];
                      yearlyTotal += netEmission;
                      cells.push(
                        <td key={`net-${i}`} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          {netEmission.toFixed(2)}
                        </td>
                      );
                    }
                    
                    // 添加全年合计
                    cells.push(
                      <td key="net-yearly" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                        {yearlyTotal.toFixed(2)}
                      </td>
                    );
                    
                    return cells;
                  })()}
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8fff8', border: '1px solid #4CAF50', borderRadius: '6px' }}>
            <h5 style={{ marginBottom: '15px', color: '#4CAF50', fontWeight: 'bold' }}>输入燃料</h5>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ marginRight: '10px' }}>添加输入燃料:</label>
              <select
                onChange={(e) => {
                  const fuelId = e.target.value;
                  if (fuelId) {
                    addFuelToProcess(process.id, fuelId, 'input');
                    e.target.value = '';
                  }
                }}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">选择燃料...</option>
                {ALL_FUELS.map(fuel => (
                  <option key={fuel.id} value={fuel.id}>{fuel.name}</option>
                ))}
              </select>
            </div>
            {renderFuelTable(process, process.inputFuels || [], 'input')}
          </div>
          
          <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fff9f0', border: '1px solid #FF9800', borderRadius: '6px' }}>
            <h5 style={{ marginBottom: '15px', color: '#FF9800', fontWeight: 'bold' }}>输出燃料</h5>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ marginRight: '10px' }}>添加输出燃料:</label>
              <select
                onChange={(e) => {
                  const fuelId = e.target.value;
                  if (fuelId) {
                    addFuelToProcess(process.id, fuelId, 'output');
                    e.target.value = '';
                  }
                }}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">选择燃料...</option>
                {ALL_FUELS.map(fuel => (
                  <option key={fuel.id} value={fuel.id}>{fuel.name}</option>
                ))}
              </select>
            </div>
            {renderFuelTable(process, process.outputFuels || [], 'output')}
          </div>
          

        </div>
      ))}
      
      <CustomFuelForm onAddCustomFuel={addCustomFuel} />
      

      
    </div>
  );
};

export default SteelProcessFossilFuelEmission;