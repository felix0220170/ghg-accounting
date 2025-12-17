import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CustomFuelForm from '../steel/CustomFuelForm';
import CustomFuelList from '../steel/CustomFuelList';

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
// 燃料氧化率默认值：固体燃料98%，液体燃料98%，气体燃料99%

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

// 铝行业化石燃料燃烧排放量组件（工序驱动）
function AeroFossilFuelEmission({ onEmissionChange, productionLines = [], onProductionLinesChange }) {
  // 将productionLines重命名为processes以符合工序驱动的概念
  const processes = productionLines;

  const [customFuels, setCustomFuels] = useState([]);
  
  // 自定义燃料列表通过props传入
  
  // 其他(移动燃烧设备)的燃料项
  const [otherMobileFuels, setOtherMobileFuels] = useState([]);
  
  // 保存上一次的排放量，用于比较是否真正发生变化
  const previousEmissionRef = useRef(null);

  // 添加燃料到工序，通过回调通知父组件
  const addFuelToProcess = useCallback((processId, fuelId) => {
    // 先在默认燃料中查找
    let fuel = ALL_FUELS.find(f => f.id === fuelId);
    // 如果默认燃料中没有找到，在自定义燃料中查找
    if (!fuel) {
      fuel = customFuels.find(f => f.id === fuelId);
    }
    if (!fuel || !onProductionLinesChange || !Array.isArray(processes)) return;

    const updatedProcesses = processes.map(process => {
      if (process.id === processId) {
        // 检查是否已经添加了该燃料
        const currentFuelItems = Array.isArray(process.fuelItems) ? process.fuelItems : [];
        const fuelExists = currentFuelItems.some(item => item.fuelId === fuelId);
        if (fuelExists) return process;

        // 为不同类型的燃料设置默认氧化率
        let defaultOxidationRate = fuel.oxidationRate || 98;
        
        if (fuel.type === 'solid') {
          defaultOxidationRate = 98; // 固体燃料默认氧化率
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
          biomassContent: fuel.biomassContent,
          // 不再需要燃烧设备字段
          files: {
            consumption: null,
            calorificValue: null
          },
          monthlyData: createInitialMonthlyData().map(monthData => ({
            ...monthData,
            calorificValue: fuel.calorificValue.toString(),
            carbonContent: fuel.carbonContent.toString(),
            receivedBaseCarbonContent: '',
            oxidationRate: defaultOxidationRate.toString()
          }))
        };

        return {
          ...process,
          fuelItems: [...currentFuelItems, newFuelItem]
        };
      }
      return process;
    });

    // 通过回调通知父组件更新
    onProductionLinesChange(updatedProcesses);
  }, [processes, customFuels, onProductionLinesChange]);

  // 从工序移除燃料，通过回调通知父组件
  const removeFuelFromProcess = useCallback((processId, fuelItemId) => {
    if (onProductionLinesChange) {
      const updatedProcesses = processes.map(process => {
        if (process.id === processId) {
          return {
            ...process,
            fuelItems: process.fuelItems.filter(item => item.id !== fuelItemId)
          };
        }
        return process;
      });
      onProductionLinesChange(updatedProcesses);
    }
  }, [processes, onProductionLinesChange]);
  
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

    // 为不同类型的燃料设置默认氧化率，与工序部分保持一致
    let defaultOxidationRate = fuel.oxidationRate || 98;
    
    if (fuel.type === 'solid') {
      defaultOxidationRate = 98; // 固体燃料默认氧化率，与工序部分保持一致
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
      biomassContent: fuel.biomassContent,
      files: {
        consumption: null,
        calorificValue: null
      },
      monthlyData: createInitialMonthlyData().map(monthData => ({
        ...monthData,
        calorificValue: fuel.calorificValue.toString(),
        carbonContent: fuel.carbonContent.toString(),
        receivedBaseCarbonContent: '',
        oxidationRate: defaultOxidationRate.toString()
      }))
    };

    setOtherMobileFuels([...otherMobileFuels, newFuelItem]);
  }, [otherMobileFuels, customFuels]);

  // 更新月度数据，通过回调通知父组件
  const updateMonthlyData = useCallback((processId, fuelItemId, monthIndex, field, value) => {
    // 处理工序的月度数据更新
    if (onProductionLinesChange && processId !== 'other-mobile') {
      const updatedProcesses = processes.map(process => {
        if (process.id === processId) {
          return {
            ...process,
            fuelItems: process.fuelItems.map(fuelItem => {
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
        return process;
      });
      onProductionLinesChange(updatedProcesses);
    }
    // 处理其他(移动燃烧设备)的月度数据更新
    else if (processId === 'other-mobile') {
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
  }, [processes, onProductionLinesChange, otherMobileFuels]);

  // 固体燃料不再需要燃烧设备，相关更新函数已移除

  // 添加自定义燃料
  const addCustomFuel = useCallback((fuelData) => {
    const customFuel = {
      id: `custom-${generateId()}`,
      name: fuelData.name,
      calorificValue: parseFloat(fuelData.calorificValue) || 0,
      carbonContent: parseFloat(fuelData.carbonContent) || 0,
      type: fuelData.type,
      isCustom: true,
      oxidationRate: fuelData.type === 'gas' ? 99 : 98, // 固体和液体燃料默认氧化率为98，气体为99
      biomassContent: parseFloat(fuelData.biomassContent) || 0 // 生物质含量，仅对混合燃料有效
    };
    setCustomFuels([...customFuels, customFuel]);
  }, [customFuels]);

  // 从自定义燃料列表中移除燃料
  const removeCustomFuel = useCallback((fuelId) => {
    setCustomFuels(customFuels.filter(fuel => fuel.id !== fuelId));
  }, [customFuels]);

  // 计算单个月的CO2排放量
  const calculateMonthlyEmission = useCallback((monthData, fuelType = 'solid', biomassContent = 0) => {
    const consumption = parseFloat(monthData.consumption) || 0;
    const calorificValue = parseFloat(monthData.calorificValue) || 0;
    const carbonContent = parseFloat(monthData.carbonContent) || 0;
    const receivedBaseCarbonContent = parseFloat(monthData.receivedBaseCarbonContent) || 0;
    const oxidationRate = parseFloat(monthData.oxidationRate) || 0;

    // 如果用户输入了收到基元素碳含量，则优先使用它
    let emission;
    if (receivedBaseCarbonContent > 0) {
      emission = consumption * receivedBaseCarbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
    } else {
      emission = consumption * calorificValue * carbonContent * (oxidationRate / 100) * CARBON_TO_CO2_RATIO;
    }
    
    // 对于生物质混合燃料，需要额外乘以(1 - biomassContent)以扣除生物质部分的碳排放
    // biomassContent以百分比形式存储，所以需要除以100转换为小数
    return fuelType === 'mix' ? emission * (1 - biomassContent / 100) : emission;
  }, []);

  // 计算年度合计值
  const calculateYearlyTotal = useCallback((monthlyData, field) => {
    return monthlyData.reduce((total, monthData) => {
      const value = parseFloat(monthData[field]) || 0;
      return total + value;
    }, 0);
  }, []);

  // 计算年度排放量
  const calculateYearlyEmission = useCallback((monthlyData, fuelType = 'solid', biomassContent = 0) => {
    return monthlyData.reduce((total, monthData) => {
      return total + calculateMonthlyEmission(monthData, fuelType, biomassContent);
    }, 0);
  }, [calculateMonthlyEmission]);

  // 更新文件上传
  const updateFile = useCallback((processId, fuelItemId, fileType, file) => {
    // 处理工序的文件更新
    if (onProductionLinesChange && processId !== 'other-mobile') {
      const updatedProcesses = processes.map(process => {
        if (process.id === processId) {
          return {
            ...process,
            fuelItems: process.fuelItems.map(item => {
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
        return process;
      });
      onProductionLinesChange(updatedProcesses);
    }
    // 处理其他(移动燃烧设备)的文件更新
    else if (processId === 'other-mobile') {
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
  }, [processes, onProductionLinesChange, otherMobileFuels]);

  // 计算总排放量和按工序分组的详细排放数据
  const { totalEmission, processEmissions } = useMemo(() => {
    let total = 0;
    const emissionsByProcess = {};

    // 添加空值检查，确保processes是数组
    if (Array.isArray(processes)) {
      processes.forEach(process => {
        // 添加空值检查，确保process和process.fuelItems存在且是数组
        if (process && Array.isArray(process.fuelItems)) {
          const processMonthlyEmissions = Array(12).fill(0);
          let processYearlyTotal = 0;
          
          process.fuelItems.forEach(fuelItem => {
            // 添加空值检查，确保fuelItem和fuelItem.monthlyData存在且是数组
            if (fuelItem && Array.isArray(fuelItem.monthlyData)) {
              // 获取燃料类型和生物质含量
              const fuel = [...ALL_FUELS, ...customFuels].find(f => f.id === fuelItem.fuelId);
              const fuelType = fuel?.type || 'solid';
              const biomassContent = fuel?.biomassContent || 0;
              
              fuelItem.monthlyData.forEach((monthData, index) => {
                const monthEmission = calculateMonthlyEmission(monthData, fuelType, biomassContent);
                processMonthlyEmissions[index] += monthEmission;
                processYearlyTotal += monthEmission;
                total += monthEmission;
              });
            }
          });
          
          emissionsByProcess[process.id] = {
            monthlyData: processMonthlyEmissions,
            yearlyTotal: processYearlyTotal
          };
        }
      });
    }

    // 计算其他(移动燃烧设备)的排放量
    if (Array.isArray(otherMobileFuels)) {
      const otherMonthlyEmissions = Array(12).fill(0);
      let otherYearlyTotal = 0;
      
      otherMobileFuels.forEach(fuelItem => {
        if (fuelItem && Array.isArray(fuelItem.monthlyData)) {
          // 获取燃料类型和生物质含量
          const fuel = [...ALL_FUELS, ...customFuels].find(f => f.id === fuelItem.fuelId);
          const fuelType = fuel?.type || 'solid';
          const biomassContent = fuel?.biomassContent || 0;
          
          fuelItem.monthlyData.forEach((monthData, index) => {
            const monthEmission = calculateMonthlyEmission(monthData, fuelType, biomassContent);
            otherMonthlyEmissions[index] += monthEmission;
            otherYearlyTotal += monthEmission;
            total += monthEmission;
          });
        }
      });
      
      emissionsByProcess['other-mobile'] = {
        monthlyData: otherMonthlyEmissions,
        yearlyTotal: otherYearlyTotal
      };
    }

    return { totalEmission: total, processEmissions: emissionsByProcess };
  }, [processes, calculateMonthlyEmission, otherMobileFuels, customFuels]);

  // 当总排放量变化时，通知父组件
  useEffect(() => {
    // 只有当排放量真正发生变化时，才通知父组件
    if (onEmissionChange && previousEmissionRef.current !== totalEmission) {
      previousEmissionRef.current = totalEmission;
      // 同时传递总排放量和按工序分组的详细排放数据
      onEmissionChange({ totalEmission, processEmissions });
    }
  }, [totalEmission, processEmissions, onEmissionChange]);

  // 处理单位显示的辅助函数
  const formatUnit = (baseUnit, suffix = '') => {
    if (baseUnit === 't') {
      return suffix ? `${baseUnit}${suffix}` : baseUnit;
    } else {
      // 对于气体燃料单位，使用JSX渲染上标
      if (suffix) {
        return <><span>{suffix}10</span><sup>4</sup><span>Nm³</span></>;
      }
      return <><span>10</span><sup>4</sup><span>Nm³</span></>;
    }
  };

  // 获取燃料的单位
  const getFuelUnit = (fuelType) => {
    switch (fuelType) {
      case 'solid':
      case 'liquid':
        return 't';
      case 'gas':
        return '104Nm³'; // 返回标识而不是具体单位
      default:
        return 't';
    }
  };

  // 获取可添加的燃料列表（排除已添加的）
  const getAvailableFuels = (processId) => {
    // 先确保customFuels是数组
    const safeCustomFuels = Array.isArray(customFuels) ? customFuels : [];
    
    // 处理其他(移动燃烧设备)的可用燃料
    if (processId === 'other-mobile') {
      const addedFuelIds = otherMobileFuels.map(item => item.fuelId);
      return [...ALL_FUELS, ...safeCustomFuels].filter(fuel => !addedFuelIds.includes(fuel.id));
    }
    
    // 处理工序的可用燃料
    // 先确保processes是数组
    if (!Array.isArray(processes)) return [...ALL_FUELS, ...safeCustomFuels]; // 返回所有燃料
    
    const process = processes.find(p => p.id === processId);
    // 如果找不到工序或工序没有fuelItems，返回所有燃料
    if (!process || !Array.isArray(process.fuelItems)) return [...ALL_FUELS, ...safeCustomFuels];

    const addedFuelIds = process.fuelItems.map(item => item.fuelId);
    const availableFuels = [...ALL_FUELS, ...safeCustomFuels].filter(fuel => !addedFuelIds.includes(fuel.id));
    
    // 返回所有可用燃料
    return availableFuels;
  };

  return (
    <div className="fossil-fuel-emission">
      <h2>化石燃料燃烧排放量</h2>
      
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>企业级化石燃料燃烧排放：</strong></p>
        <p>民用航空企业的燃料燃烧的二氧化碳排放包括公共航空运输和通用航空企业运输飞行中航空器消耗的航空汽油、航空煤油和生物质混合燃料燃烧的二氧化碳排放，以及民用航空企业地面活动涉及的其他移动源及固定源消耗的化石燃料燃烧的二氧化碳排放</p>
        <p><strong>计算公式：</strong></p>
        <p>国内航班/国际航班/地面活动CO2排放量 = Σ(国内航班/国际航班/地面活动各化石燃料消耗量 × （化石燃料收到基元素碳含量[如有] 或 （化石燃料收到基低位发热量 × 化石燃料单位热值含碳量）） × 化石燃料碳氧化率 × 44/12)</p>
        <p><strong>注：</strong>收到基元素碳含量 = 收到基低位发热量 × 单位热值含碳量。如用户输入了收到基元素碳含量，则优先使用该值进行计算；否则，使用收到基低位发热量和单位热值含碳量的乘积进行计算。</p>
        <p>企业总CO2排放量 = 国内航班CO2排放量 + 国际航班CO2排放量 + 地面活动CO2排放量</p>
        <p>其中：44/12 是二氧化碳与碳的相对分子质量之比</p>
        <p><strong>生物质混合燃料处理：</strong></p>
        <p>1. 添加方式：通过自定义燃料功能添加，选择"混合燃料"类型并输入生物质含量百分比。</p>
        <p>2. 计算方式：生物质混合燃料的CO2排放量需扣除生物质部分，计算公式为：</p>
        <p>   混合燃料CO2排放量 = 燃料消耗量 × （收到基元素碳含量或（收到基低位发热量 × 单位热值含碳量）） × 碳氧化率 × 44/12 × (1 - 生物质含量/100)</p>
      </div>

      {/* 工序管理 */}
      {Array.isArray(processes) && processes.map((process, processIndex) => (
        <div key={process.id} className="process-section" style={{ marginBottom: '30px', padding: '20px', border: '2px solid #4CAF50', borderRadius: '8px', backgroundColor: '#f9fff9' }}>
          <div className="process-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            {/* 工序信息由父组件控制 */}
            <h3 style={{ margin: 0, flex: 1, color: '#4CAF50' }}>{process.processName}</h3>
          </div>

          {/* 添加燃料 */}
          <div className="add-fuel" style={{ marginBottom: '20px' }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addFuelToProcess(process.id, e.target.value);
                  e.target.value = '';
                }
              }}
              style={{ padding: '5px' }}
            >
              <option value="">选择要添加的燃料</option>
              {getAvailableFuels(process.id).map(fuel => (
                <option key={fuel.id} value={fuel.id}>
                  {fuel.name} ({fuel.type === 'solid' ? '固体' : fuel.type === 'liquid' ? '液体' : fuel.type === 'gas' ? '气体' : '混合'})
                </option>
              ))}
            </select>
          </div>

          {process.fuelItems && Array.isArray(process.fuelItems) && process.fuelItems.length > 0 && (
            <>
              {/* 按燃料类型分组显示 */}
              {['solid', 'liquid', 'gas', 'mix'].map((fuelType, typeIndex) => {
                // 过滤当前类型的燃料
                const fuelsOfType = process.fuelItems.filter(item => item.fuelType === fuelType);
                if (fuelsOfType.length === 0) return null;
                
                // 获取燃料类型的中文名称
                const fuelTypeLabel = fuelType === 'solid' ? '固体燃料' : fuelType === 'liquid' ? '液体燃料' : fuelType === 'gas' ? '气体燃料' : '混合燃料';
                
                return (
                  <div key={fuelType} style={{ marginBottom: '25px' }}>
                    <h4 style={{ color: fuelType === 'solid' ? '#8B4513' : fuelType === 'liquid' ? '#0000CD' : '#4682B4', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fuelType === 'solid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="6" width="10" height="8" rx="1"/><path d="M7 4h6M6 8h8M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  {fuelType === 'liquid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8z" fillOpacity="0.3"/><path d="M6 10h8M5 12h10M6 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  {fuelType === 'gas' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="7" cy="8" r="2" fillOpacity="0.3"/><circle cx="13" cy="8" r="1.5" fillOpacity="0.3"/><circle cx="10" cy="12" r="2.5" fillOpacity="0.3"/><path d="M5 16c0-1.65 3.35-3 5-3s5 1.35 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  {fuelType === 'mix' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4C7.79 4 6 5.79 6 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fillOpacity="0.3"/><path d="M4 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fillOpacity="0.3"/></svg>}
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
                            // 获取生物质含量，默认为0
                            const biomassContent = fuelItem.biomassContent || 0;
                            const yearlyEmission = calculateYearlyEmission(fuelItem.monthlyData, fuelItem.fuelType, biomassContent);
                            
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
                              showUpload: true
                            },
                            {
                              type: 'receivedBaseCarbonContent',
                              label: '收到基元素碳含量',
                              unit: fuelUnit === 't' ? 'tC/t' : formatUnit('gas', 'tC/'),
                              getValue: (monthData) => monthData.receivedBaseCarbonContent,
                              yearlyValue: '',
                              yearlyValueType: '',
                              acquisitionMethod: '',
                              showUpload: true
                            },
                            {
                              type: 'oxidationRate',
                              label: '碳氧化率',
                              unit: '%',
                              getValue: (monthData) => monthData.oxidationRate,
                              yearlyValue: '',
                              yearlyValueType: '',
                              acquisitionMethod: '缺省值',
                              showUpload: true
                            },
                            {
                              type: 'emission',
                              label: '燃烧排放量',
                              unit: '吨CO2当量',
                              getValue: (monthData) => calculateMonthlyEmission(monthData, fuelItem.fuelType, biomassContent),
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
                                      {/* 固体燃料不再需要选择燃烧设备 */}
                                      <button
                                        onClick={() => removeFuelFromProcess(process.id, fuelItem.id)}
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
                                          onChange={(e) => updateMonthlyData(process.id, fuelItem.id, monthIndex, row.type, e.target.value)}
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
          <h3 style={{ margin: '10px 0' }}>地面活动</h3>
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
                {fuel.name} ({fuel.type === 'solid' ? '固体' : fuel.type === 'liquid' ? '液体' : fuel.type === 'gas' ? '气体' : '混合'})
              </option>
            ))}
          </select>
        </div>

        {otherMobileFuels.length > 0 && (
          <>
            {/* 按燃料类型分组显示 */}
            {['solid', 'liquid', 'gas', 'mix'].map((fuelType, typeIndex) => {
              // 过滤当前类型的燃料
              const fuelsOfType = otherMobileFuels.filter(item => item.fuelType === fuelType);
              if (fuelsOfType.length === 0) return null;
              
              // 获取燃料类型的中文名称
              const fuelTypeLabel = fuelType === 'solid' ? '固体燃料' : fuelType === 'liquid' ? '液体燃料' : fuelType === 'gas' ? '气体燃料' : '混合燃料';
              
              return (
                <div key={fuelType} style={{ marginBottom: '25px' }}>
                  <h4 style={{ color: fuelType === 'solid' ? '#8B4513' : fuelType === 'liquid' ? '#0000CD' : '#4682B4', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fuelType === 'solid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="6" width="10" height="8" rx="1"/><path d="M7 4h6M6 8h8M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {fuelType === 'liquid' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V8z" fillOpacity="0.3"/><path d="M6 10h8M5 12h10M6 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {fuelType === 'gas' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="7" cy="8" r="2" fillOpacity="0.3"/><circle cx="13" cy="8" r="1.5" fillOpacity="0.3"/><circle cx="10" cy="12" r="2.5" fillOpacity="0.3"/><path d="M5 16c0-1.65 3.35-3 5-3s5 1.35 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    {fuelType === 'mix' && <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4C7.79 4 6 5.79 6 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fillOpacity="0.3"/><path d="M4 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fillOpacity="0.3"/></svg>}
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
                          // 获取生物质含量，默认为0
                          const biomassContent = fuelItem.biomassContent || 0;
                          const yearlyEmission = calculateYearlyEmission(fuelItem.monthlyData, fuelItem.fuelType, biomassContent);
                          
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
                              showUpload: true
                            },
                            {
                              type: 'receivedBaseCarbonContent',
                              label: '收到基元素碳含量',
                              unit: fuelUnit === 't' ? 'tC/t' : formatUnit('gas', 'tC/'),
                              getValue: (monthData) => monthData.receivedBaseCarbonContent,
                              yearlyValue: '',
                              yearlyValueType: '',
                              acquisitionMethod: '',
                              showUpload: true
                            },
                            {
                              type: 'oxidationRate',
                              label: '碳氧化率',
                              unit: '%',
                              getValue: (monthData) => monthData.oxidationRate,
                              yearlyValue: '',
                              yearlyValueType: '',
                              acquisitionMethod: '缺省值',
                              showUpload: true
                            },
                            {
                              type: 'emission',
                              label: '燃烧排放量',
                              unit: '吨CO2当量',
                              getValue: (monthData) => calculateMonthlyEmission(monthData, fuelItem.fuelType, biomassContent),
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
                                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', position: 'relative', verticalAlign: 'top' }} rowSpan="6">
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
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '15px', color: '#1890ff' }}>添加自定义燃料</h3>
        <CustomFuelForm onAddCustomFuel={addCustomFuel} supportMixFuel={true} />
        <CustomFuelList customFuels={customFuels} setCustomFuels={removeCustomFuel} />
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
            <p>- 气体燃料消耗量：10<sup>4</sup>Nm³</p>
            <p>- 低位发热量：GJ/t 或 GJ/10<sup>4</sup>Nm³</p>
            <p>- 单位热值含碳量：tC/GJ</p>
            <p>- 碳氧化率：%</p>
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <p><strong>小数位数说明：</strong></p>
            <p>- 化石燃料消耗量保留到小数点后两位</p>
            <p>- 低位发热量保留到小数点后三位</p>
            <p>- 单位热值含碳量保留到小数点后五位</p>
            <p>- 收到基元素碳含量保留到小数点后四位</p>
            <p>- 化石燃料燃烧排放量保留到小数点后两位</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AeroFossilFuelEmission;
