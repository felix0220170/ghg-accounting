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
  
  // 其他(移动燃烧设备)的燃料项
  const [otherMobileFuels, setOtherMobileFuels] = useState([]);
  
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
  
  // 从其他(移动燃烧设备)移除燃料
  const removeFuelFromOtherMobile = useCallback((fuelItemId) => {
    setOtherMobileFuels(otherMobileFuels.filter(item => item.id !== fuelItemId));
  }, [otherMobileFuels]);
  
  // 向其他(移动燃烧设备)添加燃料
  const addFuelToOtherMobile = useCallback((fuelId) => {
    // 先在默认燃料中查找
    let fuel = ALL_FUELS.find(f => f.id === fuelId);
    // 如果默认燃料中没有找到，在自定义燃料中查找
    if (!fuel) {
      fuel = customFuels.find(f => f.id === fuelId);
    }
    if (!fuel) return;

    // 检查是否已经添加了该燃料
    const fuelExists = otherMobileFuels.some(item => item.fuelId === fuelId);
    if (fuelExists) return;

    // 为不同类型的燃料设置默认氧化率
    let defaultOxidationRate = fuel.oxidationRate || 95;
    
    if (fuel.type === 'solid') {
      defaultOxidationRate = 95;
    } else if (fuel.type === 'liquid') {
      defaultOxidationRate = 98;
    } else if (fuel.type === 'gas') {
      defaultOxidationRate = 99;
    }

    const newFuelItem = {
      id: generateId(),
      fuelId: fuel.id,
      fuelName: fuel.name,
      fuelType: fuel.type,
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

    setOtherMobileFuels([...otherMobileFuels, newFuelItem]);
  }, [otherMobileFuels, customFuels]);

  // 更新月度数据，通过回调通知父组件
  const updateMonthlyData = useCallback((lineId, fuelItemId, monthIndex, field, value) => {
    // 处理生产线的月度数据更新
    if (onProductionLinesChange && lineId !== 'other-mobile') {
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
    // 处理其他(移动燃烧设备)的月度数据更新
    else if (lineId === 'other-mobile') {
      const updatedOtherMobileFuels = otherMobileFuels.map(fuelItem => {
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
      });
      setOtherMobileFuels(updatedOtherMobileFuels);
    }
  }, [productionLines, onProductionLinesChange, otherMobileFuels]);

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

  // 更新文件上传
  const updateFile = useCallback((lineId, fuelItemId, fileType, file) => {
    // 处理生产线的文件更新
    if (onProductionLinesChange && lineId !== 'other-mobile') {
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
    // 处理其他(移动燃烧设备)的文件更新
    else if (lineId === 'other-mobile') {
      const updatedOtherMobileFuels = otherMobileFuels.map(item => {
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
      });
      setOtherMobileFuels(updatedOtherMobileFuels);
    }
  }, [productionLines, onProductionLinesChange, otherMobileFuels]);

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

    // 计算其他(移动燃烧设备)的排放量
    if (Array.isArray(otherMobileFuels)) {
      otherMobileFuels.forEach(fuelItem => {
        if (fuelItem && Array.isArray(fuelItem.monthlyData)) {
          fuelItem.monthlyData.forEach(monthData => {
            total += calculateMonthlyEmission(monthData);
          });
        }
      });
    }

    return total;
  }, [productionLines, calculateMonthlyEmission, otherMobileFuels]);

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
    // 先确保customFuels是数组
    const safeCustomFuels = Array.isArray(customFuels) ? customFuels : [];
    
    // 处理其他(移动燃烧设备)的可用燃料
    if (lineId === 'other-mobile') {
      const addedFuelIds = otherMobileFuels.map(item => item.fuelId);
      return [...ALL_FUELS, ...safeCustomFuels].filter(fuel => !addedFuelIds.includes(fuel.id));
    }
    
    // 处理生产线的可用燃料
    // 先确保productionLines是数组
    if (!Array.isArray(productionLines)) return [...ALL_FUELS, ...safeCustomFuels]; // 返回所有燃料
    
    const line = productionLines.find(l => l.id === lineId);
    // 如果找不到生产线或生产线没有fuelItems，返回所有燃料
    if (!line || !Array.isArray(line.fuelItems)) return [...ALL_FUELS, ...safeCustomFuels];

    const addedFuelIds = line.fuelItems.map(item => item.fuelId);
    const availableFuels = [...ALL_FUELS, ...safeCustomFuels].filter(fuel => !addedFuelIds.includes(fuel.id));
    
    // 返回所有可用燃料
    return availableFuels;
  };

  return (
    <div className="fossil-fuel-emission">
      <h2>化石燃料燃烧排放量</h2>
      
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>企业级化石燃料燃烧排放：</strong></p>
        <p>化石燃料在各种类型的固定燃烧设备（生产线） 和其他（移动燃烧设备）中燃烧产生的二氧化碳排放。</p>
        <p><strong>计算公式：</strong></p>
        <p>CO2排放量 = 化石燃料消耗量 × 化石燃料收到基低位发热量 × 化石燃料单位热值含碳量 × 化石燃料碳氧化率 × 44/12</p>
        <p>其中：44/12 是二氧化碳与碳的相对分子质量之比</p>
      </div>

      {/* 生产线管理 */}
      {Array.isArray(productionLines) && productionLines.map((line, lineIndex) => (
        <div key={line.id} className="production-line" style={{ marginBottom: '30px', padding: '20px', border: '2px solid #4CAF50', borderRadius: '8px', backgroundColor: '#f9fff9' }}>
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
            <>
              {/* 按燃料类型分组显示 */}
              {['solid', 'liquid', 'gas'].map((fuelType, typeIndex) => {
                // 过滤当前类型的燃料
                const fuelsOfType = line.fuelItems.filter(item => item.fuelType === fuelType);
                if (fuelsOfType.length === 0) return null;
                
                // 获取燃料类型的中文名称
                const fuelTypeLabel = fuelType === 'solid' ? '固体燃料' : fuelType === 'liquid' ? '液体燃料' : '气体燃料';
                
                return (
                  <div key={fuelType} style={{ marginBottom: '25px' }}>
                    <h4 style={{ color: fuelType === 'solid' ? '#8B4513' : fuelType === 'liquid' ? '#0000CD' : '#4682B4', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fuelType === 'solid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="6" width="10" height="8" rx="1"/><path d="M7 4h6M6 8h8M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  {fuelType === 'liquid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8z" fillOpacity="0.3"/><path d="M6 10h8M5 12h10M6 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  {fuelType === 'gas' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="7" cy="8" r="2" fillOpacity="0.3"/><circle cx="13" cy="8" r="1.5" fillOpacity="0.3"/><circle cx="10" cy="12" r="2.5" fillOpacity="0.3"/><path d="M5 16c0-1.65 3.35-3 5-3s5 1.35 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  {fuelTypeLabel}
                </h4>
                    <div className="column-data-table" style={{ overflowX: 'auto' }}>
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
                          {/* 每个燃料生成5行数据 */}
                          {fuelsOfType.map(fuelItem => {
                            const fuelUnit = getFuelUnit(fuelItem.fuelType);
                            const yearlyConsumption = calculateYearlyTotal(fuelItem.monthlyData, 'consumption');
                            const yearlyEmission = calculateYearlyEmission(fuelItem.monthlyData);
                            
                            // 生成5行数据：消耗量、低位发热量、单位热值含碳量、碳氧化率、排放量
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
                              unit: `GJ/${fuelUnit}`,
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
                                      {fuelItem.fuelType === 'solid' && (
                                        <div>
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
                                      <button
                                        onClick={() => removeFuelFromLine(line.id, fuelItem.id)}
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
                                  // 获取原始值用于输入框，不在输入时进行格式化，提高用户体验
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
                                          onChange={(e) => updateMonthlyData(line.id, fuelItem.id, monthIndex, row.type, e.target.value)}
                                          placeholder="0"
                                          style={{ width: '60px', textAlign: 'center' }}
                                          step="any"
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
                  </div>
                );
              })}
            </>
          )}
        </div>
      ))}

      {/* 不再显示添加生产线按钮，由父组件控制生产线的添加和删除 */}

      {/* 其他(移动燃烧设备) */}
      <div key="other-mobile" className="production-line" style={{ marginBottom: '30px', padding: '20px', border: '2px solid #2196F3', borderRadius: '8px', backgroundColor: '#f0f7ff' }}>
        <div className="line-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: '10px 0' }}>其他(移动燃烧设备)</h3>
        </div>

        {/* 添加燃料 */}
        <div className="add-fuel" style={{ marginBottom: '20px' }}>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addFuelToOtherMobile(e.target.value);
                e.target.value = '';
              }
            }}
            style={{ padding: '5px' }}
          >
            <option value="">选择要添加的燃料</option>
            {getAvailableFuels('other-mobile').map(fuel => (
              <option key={fuel.id} value={fuel.id}>
                {fuel.name} ({fuel.type === 'solid' ? '固体' : fuel.type === 'liquid' ? '液体' : '气体'})
              </option>
            ))}
          </select>
        </div>

        {otherMobileFuels.length > 0 && (
          <>
            {/* 按燃料类型分组显示 */}
            {['solid', 'liquid', 'gas'].map((fuelType, typeIndex) => {
              // 过滤当前类型的燃料
              const fuelsOfType = otherMobileFuels.filter(item => item.fuelType === fuelType);
              if (fuelsOfType.length === 0) return null;
              
              // 获取燃料类型的中文名称
              const fuelTypeLabel = fuelType === 'solid' ? '固体燃料' : fuelType === 'liquid' ? '液体燃料' : '气体燃料';
              
              return (
                <div key={fuelType} style={{ marginBottom: '25px' }}>
                  <h4 style={{ color: fuelType === 'solid' ? '#8B4513' : fuelType === 'liquid' ? '#0000CD' : '#4682B4', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fuelType === 'solid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="6" width="10" height="8" rx="1"/><path d="M7 4h6M6 8h8M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {fuelType === 'liquid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8z" fillOpacity="0.3"/><path d="M6 10h8M5 12h10M6 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {fuelType === 'gas' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="7" cy="8" r="2" fillOpacity="0.3"/><circle cx="13" cy="8" r="1.5" fillOpacity="0.3"/><circle cx="10" cy="12" r="2.5" fillOpacity="0.3"/><path d="M5 16c0-1.65 3.35-3 5-3s5 1.35 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {fuelTypeLabel}
                  </h4>
                  <div className="column-data-table" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '150px' }}>燃料名称</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', width: '150px' }}>信息项</th>
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
                        {fuelsOfType.map(fuelItem => {
                          const fuelUnit = getFuelUnit(fuelItem.fuelType);
                          const yearlyConsumption = calculateYearlyTotal(fuelItem.monthlyData, 'consumption');
                          const yearlyEmission = calculateYearlyEmission(fuelItem.monthlyData);
                          
                          // 生成5行数据：消耗量、低位发热量、单位热值含碳量、碳氧化率、排放量
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
                              unit: `GJ/${fuelUnit}`,
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
                                {/* 燃料名称 */}
                                {rowIndex === 0 ? (
                                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', position: 'relative', verticalAlign: 'top' }} rowSpan="5">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <div>
                                        <strong style={{ color: fuelItem.fuelType === 'solid' ? '#8B4513' : fuelItem.fuelType === 'liquid' ? '#0000CD' : '#4682B4' }}>
                                          {fuelItem.fuelName}
                                        </strong>
                                      </div>
                                      <div>
                                        <button
                                          onClick={() => removeFuelFromOtherMobile(fuelItem.id)}
                                          style={{
                                            padding: '2px 6px',
                                            background: 'red',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                        >
                                          移除燃料
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                ) : null}
                                {/* 信息项 */}
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                  {row.label}
                                </td>
                              
                              {/* 单位 */}
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{row.unit}</td>
                              
                              {/* 1-12月数据 */}
                              {fuelItem.monthlyData.map((monthData, monthIndex) => {
                                // 获取原始值用于输入框，不在输入时进行格式化，提高用户体验
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
                                        onChange={(e) => updateMonthlyData('other-mobile', fuelItem.id, monthIndex, row.type, e.target.value)}
                                        placeholder="0"
                                        style={{ width: '60px', textAlign: 'center' }}
                                        step="any"
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
                                    onChange={(e) => updateFile('other-mobile', fuelItem.id, row.type, e.target.files[0])}
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
                </div>
              );
            })}
          </>
        )}
      </div>

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
      
      {/* 单位说明和小数位数说明 */}
      <div className="detailed-description" style={{ marginTop: '30px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <p><strong>单位说明：</strong></p>
            <p>- 固体和液体燃料消耗量：t</p>
            <p>- 气体燃料消耗量：104Nm³</p>
            <p>- 低位发热量：GJ/t 或 GJ/104Nm³</p>
            <p>- 单位热值含碳量：tC/GJ</p>
            <p>- 碳氧化率：%</p>
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <p><strong>小数位数说明：</strong></p>
            <p>- 化石燃料消耗量保留到小数点后两位</p>
            <p>- 低位发热量保留到小数点后三位</p>
            <p>- 单位热值含碳量保留到小数点后五位</p>
          </div>
        </div>
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