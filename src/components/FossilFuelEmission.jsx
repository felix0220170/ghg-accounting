import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { INDUSTRY_TYPES } from '../config/industryConfig';

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

// 固体燃料燃烧设备
const SOLID_FUEL_EQUIPMENTS = [
  { id: 'cementKiln', name: '水泥窑', oxidationRate: 99 },
  { id: 'powerBoiler', name: '发电锅炉', oxidationRate: 95 },
  { id: 'industrialBoiler', name: '工业锅炉', oxidationRate: 85 }
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
    oxidationRate: '', // 碳氧化率
    co2Emission: 0 // CO2排放量
  }));
};

// 化石燃料燃烧排放量组件
function FossilFuelEmission({ industry = INDUSTRY_TYPES.OTHER, onEmissionChange, productionLines = [], onProductionLinesChange }) {
  
  // 自定义燃料列表
  const [customFuels, setCustomFuels] = useState([]);
  
  // 保存上一次的排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);

  // 不再需要内部添加生产线功能，由父组件控制

  // 不再需要内部删除生产线功能，由父组件控制

  // 不再需要updateProductionLineName函数，生产线名称完全由父组件管理

  // 添加燃料到生产线，通过回调通知父组件
  const addFuelToLine = useCallback((lineId, fuelId) => {
    // 先在默认燃料中查找
    let fuel = ALL_FUELS.find(f => f.id === fuelId);
    // 如果默认燃料中没有找到，在自定义燃料中查找
    if (!fuel) {
      fuel = customFuels.find(f => f.id === fuelId);
    }
    if (!fuel || !onProductionLinesChange || !Array.isArray(productionLines)) return;

    const updatedLines = productionLines.map(line => {
      if (line.id === lineId) {
        // 检查是否已经添加了该燃料
        const currentFuelItems = Array.isArray(line.fuelItems) ? line.fuelItems : [];
        const fuelExists = currentFuelItems.some(item => item.fuelId === fuelId);
        if (fuelExists) return line;

        // 为不同类型的燃料设置默认氧化率
        let defaultOxidationRate = fuel.oxidationRate || 95;
        let equipmentId = null;
        
        if (fuel.type === 'solid') {
          defaultOxidationRate = 95; // 默认发电锅炉
          equipmentId = 'powerBoiler';
        } else if (fuel.type === 'liquid') {
          defaultOxidationRate = 98; // 液体燃料默认氧化率
        } else if (fuel.type === 'gas') {
          defaultOxidationRate = 99; // 气体燃料默认氧化率
        }

        const newFuelItem = {
          id: generateId(),
          fuelId: fuel.id,
          fuelName: fuel.name,
          fuelType: fuel.type,
          equipmentId: equipmentId,
          files: {
            consumption: null,
            calorificValue: null
          },
          monthlyData: createInitialMonthlyData().map(monthData => ({
            ...monthData,
            calorificValue: fuel.calorificValue.toString(),
            carbonContent: fuel.carbonContent.toString(),
            oxidationRate: defaultOxidationRate.toString()
          }))
        };

        return {
          ...line,
          fuelItems: [...currentFuelItems, newFuelItem]
        };
      }
      return line;
    });

    // 通过回调通知父组件更新
    onProductionLinesChange(updatedLines);
  }, [productionLines, customFuels, onProductionLinesChange]);

  // 从生产线移除燃料，通过回调通知父组件
  const removeFuelFromLine = useCallback((lineId, fuelItemId) => {
    if (onProductionLinesChange) {
      const updatedLines = productionLines.map(line => {
        if (line.id === lineId) {
          return {
            ...line,
            fuelItems: line.fuelItems.filter(item => item.id !== fuelItemId)
          };
        }
        return line;
      });
      onProductionLinesChange(updatedLines);
    }
  }, [productionLines, onProductionLinesChange]);

  // 更新月度数据，通过回调通知父组件
  const updateMonthlyData = useCallback((lineId, fuelItemId, monthIndex, field, value) => {
    if (onProductionLinesChange) {
      const updatedLines = productionLines.map(line => {
        if (line.id === lineId) {
          return {
            ...line,
            fuelItems: line.fuelItems.map(fuelItem => {
              if (fuelItem.id === fuelItemId) {
                const updatedMonthlyData = [...fuelItem.monthlyData];
                updatedMonthlyData[monthIndex] = {
                  ...updatedMonthlyData[monthIndex],
                  [field]: value
                };
                return {
                  ...fuelItem,
                  monthlyData: updatedMonthlyData
                };
              }
              return fuelItem;
            })
          };
        }
        return line;
      });
      onProductionLinesChange(updatedLines);
    }
  }, [productionLines, onProductionLinesChange]);

  // 更新固体燃料的燃烧设备，通过回调通知父组件
  const updateSolidFuelEquipment = useCallback((lineId, fuelItemId, equipmentId) => {
    const equipment = SOLID_FUEL_EQUIPMENTS.find(e => e.id === equipmentId);
    if (!equipment || !onProductionLinesChange) return;

    const updatedLines = productionLines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          fuelItems: line.fuelItems.map(fuelItem => {
            if (fuelItem.id === fuelItemId) {
              // 更新所有月份的氧化率
              const updatedMonthlyData = fuelItem.monthlyData.map(monthData => ({
                ...monthData,
                oxidationRate: equipment.oxidationRate.toString()
              }));
              return {
                ...fuelItem,
                equipmentId: equipmentId,
                monthlyData: updatedMonthlyData
              };
            }
            return fuelItem;
          })
        };
      }
      return line;
    });

    onProductionLinesChange(updatedLines);
  }, [productionLines, onProductionLinesChange]);

  // 添加自定义燃料
  const addCustomFuel = useCallback((fuelData) => {
    const customFuel = {
      id: `custom-${generateId()}`,
      name: fuelData.name,
      calorificValue: parseFloat(fuelData.calorificValue) || 0,
      carbonContent: parseFloat(fuelData.carbonContent) || 0,
      type: fuelData.type,
      isCustom: true,
      oxidationRate: fuelData.type === 'solid' ? 95 : (fuelData.type === 'liquid' ? 98 : 99)
    };
    setCustomFuels([...customFuels, customFuel]);
  }, [customFuels]);

  // 从自定义燃料列表中移除燃料
  const removeCustomFuel = useCallback((fuelId) => {
    setCustomFuels(customFuels.filter(fuel => fuel.id !== fuelId));
  }, [customFuels]);

  // 计算单个月的CO2排放量
  const calculateMonthlyEmission = useCallback((monthData) => {
    const consumption = parseFloat(monthData.consumption) || 0;
    const calorificValue = parseFloat(monthData.calorificValue) || 0;
    const carbonContent = parseFloat(monthData.carbonContent) || 0;
    const oxidationRate = parseFloat(monthData.oxidationRate) || 0;

    return consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
  }, []);

  // 计算年度合计值
  const calculateYearlyTotal = useCallback((monthlyData, field) => {
    return monthlyData.reduce((total, monthData) => {
      const value = parseFloat(monthData[field]) || 0;
      return total + value;
    }, 0);
  }, []);

  // 计算年度排放量
  const calculateYearlyEmission = useCallback((monthlyData) => {
    return monthlyData.reduce((total, monthData) => {
      return total + calculateMonthlyEmission(monthData);
    }, 0);
  }, [calculateMonthlyEmission]);

  // 更新文件上传，通过回调通知父组件
  const updateFile = useCallback((lineId, fuelItemId, fileType, file) => {
    if (onProductionLinesChange) {
      const updatedLines = productionLines.map(line => {
        if (line.id === lineId) {
          return {
            ...line,
            fuelItems: line.fuelItems.map(item => {
              if (item.id === fuelItemId) {
                return {
                  ...item,
                  files: {
                    ...item.files,
                    [fileType]: file
                  }
                };
              }
              return item;
            })
          };
        }
        return line;
      });
      onProductionLinesChange(updatedLines);
    }
  }, [productionLines, onProductionLinesChange]);

  // 计算总排放量
  const totalEmission = useMemo(() => {
    let total = 0;

    // 添加空值检查，确保productionLines是数组
    if (Array.isArray(productionLines)) {
      productionLines.forEach(line => {
        // 添加空值检查，确保line和line.fuelItems存在且是数组
        if (line && Array.isArray(line.fuelItems)) {
          line.fuelItems.forEach(fuelItem => {
            // 添加空值检查，确保fuelItem和fuelItem.monthlyData存在且是数组
            if (fuelItem && Array.isArray(fuelItem.monthlyData)) {
              fuelItem.monthlyData.forEach(monthData => {
                total += calculateMonthlyEmission(monthData);
              });
            }
          });
        }
      });
    }

    return total;
  }, [productionLines, calculateMonthlyEmission]);

  // 当总排放量变化时，通知父组件
  useEffect(() => {
    // 只有当排放量真正发生变化时，才通知父组件
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);

  // 获取燃料的单位
  const getFuelUnit = (fuelType) => {
    switch (fuelType) {
      case 'solid':
      case 'liquid':
        return 't';
      case 'gas':
        return '104Nm³';
      default:
        return '';
    }
  };

  // 获取可添加的燃料列表（排除已添加的）
  const getAvailableFuels = (lineId) => {
    // 先确保productionLines是数组
    if (!Array.isArray(productionLines)) return ALL_FUELS; // 返回所有燃料
    
    const line = productionLines.find(l => l.id === lineId);
    // 如果找不到生产线或生产线没有fuelItems，返回所有燃料
    if (!line || !Array.isArray(line.fuelItems)) return ALL_FUELS;

    const addedFuelIds = line.fuelItems.map(item => item.fuelId);
    // 确保customFuels是数组
    const safeCustomFuels = Array.isArray(customFuels) ? customFuels : [];
    const availableFuels = [...ALL_FUELS, ...safeCustomFuels].filter(fuel => !addedFuelIds.includes(fuel.id));
    
    // 返回所有可用燃料
    return availableFuels;
  };

  return (
    <div className="fossil-fuel-emission">
      <h2>化石燃料燃烧排放量</h2>
      
      <div className="calculation-description">
        <p><strong>计算公式：</strong></p>
        <p>CO2排放量 = 化石燃料消耗量 × 化石燃料收到基低位发热量 × 化石燃料单位热值含碳量 × 化石燃料碳氧化率 × 44/12</p>
        <p>其中：44/12 是二氧化碳与碳的相对分子质量之比</p>
        <p><strong>单位说明：</strong></p>
        <p>- 固体和液体燃料消耗量：t</p>
        <p>- 气体燃料消耗量：104Nm³</p>
        <p>- 低位发热量：GJ/t 或 GJ/104Nm³</p>
        <p>- 单位热值含碳量：tC/GJ</p>
        <p>- 碳氧化率：%</p>
      </div>

      {/* 生产线管理 */}
      {Array.isArray(productionLines) && productionLines.map((line, lineIndex) => (
        <div key={line.id} className="production-line" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <div className="line-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: '10px 0' }}>{line.name}</h3>
            {/* 不再显示删除生产线按钮，由父组件控制生产线的添加和删除 */}
          </div>

          {/* 添加燃料 */}
          <div className="add-fuel" style={{ marginBottom: '20px' }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addFuelToLine(line.id, e.target.value);
                  e.target.value = '';
                }
              }}
              style={{ padding: '5px' }}
            >
              <option value="">选择要添加的燃料</option>
              {getAvailableFuels(line.id).map(fuel => (
                <option key={fuel.id} value={fuel.id}>
                  {fuel.name} ({fuel.type === 'solid' ? '固体' : fuel.type === 'liquid' ? '液体' : '气体'})
                </option>
              ))}
            </select>
          </div>

          {line.fuelItems && Array.isArray(line.fuelItems) && line.fuelItems.length > 0 && (
            <div className="column-data-table" style={{ marginBottom: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '120px' }}>生产线名称</th>
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
                  {/* 每个燃料生成5行数据 */}
                  {line.fuelItems.map(fuelItem => {
                    const fuelUnit = getFuelUnit(fuelItem.fuelType);
                    const yearlyConsumption = calculateYearlyTotal(fuelItem.monthlyData, 'consumption');
                    const yearlyEmission = calculateYearlyEmission(fuelItem.monthlyData);
                    
                    // 生成5行数据：消耗量、低位发热量、单位热值含碳量、碳氧化率、排放量
                    const rows = [
                      {
                        type: 'consumption',
                        label: `${fuelItem.fuelName}消耗量`,
                        unit: fuelUnit,
                        getValue: (monthData) => monthData.consumption,
                        yearlyValue: yearlyConsumption,
                        yearlyValueType: '合计',
                        acquisitionMethod: '',
                        showUpload: true
                      },
                      {
                        type: 'calorificValue',
                        label: `${fuelItem.fuelName}收到基低位发热量`,
                        unit: `GJ/${fuelUnit}`,
                        getValue: (monthData) => monthData.calorificValue,
                        yearlyValue: '',
                        yearlyValueType: '',
                        acquisitionMethod: '',
                        showUpload: true
                      },
                      {
                        type: 'carbonContent',
                        label: `${fuelItem.fuelName}单位热值含碳量`,
                        unit: 'tC/GJ',
                        getValue: (monthData) => monthData.carbonContent,
                        yearlyValue: '',
                        yearlyValueType: '',
                        acquisitionMethod: '缺省值',
                        showUpload: false
                      },
                      {
                        type: 'oxidationRate',
                        label: `${fuelItem.fuelName}碳氧化率`,
                        unit: '%',
                        getValue: (monthData) => monthData.oxidationRate,
                        yearlyValue: '',
                        yearlyValueType: '',
                        acquisitionMethod: '缺省值',
                        showUpload: false
                      },
                      {
                        type: 'emission',
                        label: `${fuelItem.fuelName}燃烧排放量`,
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
                        {/* 生产线名称（仅在第一行显示） */}
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          {rowIndex === 0 ? line.name : ''}
                          {rowIndex === 0 && fuelItem.fuelType === 'solid' && (
                            <div style={{ marginTop: '5px' }}>
                              <select
                                value={fuelItem.equipmentId || ''}
                                onChange={(e) => updateSolidFuelEquipment(line.id, fuelItem.id, e.target.value)}
                                style={{ padding: '3px', fontSize: '12px', width: '100%' }}
                              >
                                {SOLID_FUEL_EQUIPMENTS.map(equipment => (
                                  <option key={equipment.id} value={equipment.id}>
                                    {equipment.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {rowIndex === 0 && (
                            <button
                              onClick={() => removeFuelFromLine(line.id, fuelItem.id)}
                              style={{
                                marginTop: '5px',
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
                          )}
                        </td>
                        
                        {/* 信息项 */}
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{row.label}</td>
                        
                        {/* 单位 */}
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{row.unit}</td>
                        
                        {/* 1-12月数据 */}
                        {fuelItem.monthlyData.map((monthData, monthIndex) => {
                          // 根据不同参数类型设置不同的小数位保留规则
                          let value;
                          if (row.type === 'emission') {
                            // 化石燃料燃烧排放量保留到小数点后两位
                            value = parseFloat(row.getValue(monthData)).toFixed(2);
                          } else if (row.type === 'consumption') {
                            // 化石燃料消耗量保留到小数点后两位
                            value = row.getValue(monthData) !== '' ? parseFloat(row.getValue(monthData)).toFixed(2) : '';
                          } else if (row.type === 'calorificValue') {
                            // 收到基低位发热量保留到小数点后三位
                            value = row.getValue(monthData) !== '' ? parseFloat(row.getValue(monthData)).toFixed(3) : '';
                          } else if (row.type === 'carbonContent') {
                            // 单位热值含碳量保留到小数点后五位
                            value = row.getValue(monthData) !== '' ? parseFloat(row.getValue(monthData)).toFixed(5) : '';
                          } else {
                            // 其他参数保持原样
                            value = row.getValue(monthData);
                          }
                          
                          return (
                            <td key={monthIndex} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                              {row.type === 'emission' ? (
                                value
                              ) : (
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => updateMonthlyData(line.id, fuelItem.id, monthIndex, row.type, e.target.value)}
                                  placeholder="0"
                                  style={{ width: '60px', textAlign: 'center' }}
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
                              onChange={(e) => updateFile(line.id, fuelItem.id, row.type, e.target.files[0])}
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
          )}
        </div>
      ))}

      {/* 不再显示添加生产线按钮，由父组件控制生产线的添加和删除 */}

      {/* 自定义燃料添加区域 */}
      <div className="custom-fuel-section" style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>添加自定义燃料</h3>
        <CustomFuelForm onAdd={addCustomFuel} />
        
        {customFuels.length > 0 && (
          <div className="custom-fuels-list">
            <h4>已添加的自定义燃料：</h4>
            <ul>
              {customFuels.map(fuel => (
                <li key={fuel.id} style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
                  {fuel.name} ({fuel.type === 'solid' ? '固体' : fuel.type === 'liquid' ? '液体' : '气体'})
                  <button
                    onClick={() => removeCustomFuel(fuel.id)}
                    style={{
                      marginLeft: '10px',
                      padding: '2px 6px',
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 总排放量显示 */}
      <div className="total-emission" style={{ marginTop: '30px', padding: '20px', border: '2px solid #4CAF50', borderRadius: '8px', textAlign: 'center' }}>
        <h3>总排放量</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
          {parseFloat(totalEmission).toFixed(2)} 吨CO2当量
        </p>
      </div>
    </div>
  );
}

// 自定义燃料表单组件
function CustomFuelForm({ onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'solid',
    calorificValue: '',
    carbonContent: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.calorificValue && formData.carbonContent) {
      onAdd(formData);
      setFormData({
        name: '',
        type: 'solid',
        calorificValue: '',
        carbonContent: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'end' }}>
      <div>
        <label>燃料名称：</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={{ marginLeft: '5px', padding: '5px' }}
        />
      </div>
      <div>
        <label>燃料类型：</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          style={{ marginLeft: '5px', padding: '5px' }}
        >
          <option value="solid">固体</option>
          <option value="liquid">液体</option>
          <option value="gas">气体</option>
        </select>
      </div>
      <div>
        <label>低位发热量：</label>
        <input
          type="number"
          value={formData.calorificValue}
          onChange={(e) => setFormData({ ...formData, calorificValue: e.target.value })}
          required
          min="0"
          step="0.001"
          style={{ marginLeft: '5px', padding: '5px' }}
        />
      </div>
      <div>
        <label>单位热值含碳量：</label>
        <input
          type="number"
          value={formData.carbonContent}
          onChange={(e) => setFormData({ ...formData, carbonContent: e.target.value })}
          required
          min="0"
          step="0.00001"
          style={{ marginLeft: '5px', padding: '5px' }}
        />
      </div>
      <button
        type="submit"
        style={{
          padding: '6px 15px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        添加燃料
      </button>
    </form>
  );
}

export default FossilFuelEmission;