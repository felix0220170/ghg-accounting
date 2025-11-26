import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 固体燃料数据 - 从SteelFossilFuelEmission.jsx中获取的固体燃料列表
const SOLID_FUELS = [
  { id: 'anthracite', name: '无烟煤', calorificValue: 22.867, carbonContent: 0.02749, type: 'solid' },
  { id: 'bituminous', name: '烟煤', calorificValue: 23.076, carbonContent: 0.02308, type: 'solid' },
  { id: 'lignite', name: '褐煤', calorificValue: 14.759, carbonContent: 0.02797, type: 'solid' },
  { id: 'gangue', name: '煤矸石', calorificValue: 8.374, carbonContent: 0.02541, type: 'solid' },
  { id: 'sludge', name: '煤泥', calorificValue: 12.545, carbonContent: 0.02541, type: 'solid' },
  { id: 'coke', name: '焦炭', calorificValue: 28.435, carbonContent: 0.02942, type: 'solid' },
  { id: 'petroleumCoke', name: '石油焦', calorificValue: 32.500, carbonContent: 0.02750, type: 'solid' }
];

// 默认值
const DEFAULT_VALUE = 0;

// 固体燃料消耗计算指标
const FOSSIL_FUEL_INDICATORS = [
  {
    key: 'netConsumption',
    name: '固体化石燃料的净消耗量',
    unit: 't',
    isCalculated: false,
    precision: 2, // 四舍五入保留到小数点后两位
    description: '用户输入值'
  },
  {
    key: 'waterContent',
    name: '固体化石燃料水分检测月度平均值',
    unit: '%',
    isCalculated: false,
    precision: 2, // 四舍五入保留到小数点后两位
    description: '用户输入值'
  }
];

// 创建初始的月度数据
const createInitialMonthlyData = () => {
  return MONTHS.map((month, index) => ({
    month: index + 1,
    monthName: month,
    netConsumption: '', // 净消耗量
    waterContent: ''    // 水分均值
  }));
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

function SteelFossilFuelConsumption({ onFuelConsumptionChange, fossilFuelData = [], onFossilFuelDataChange }) {
  // 从props获取燃料数据，如果没有则使用默认的固体燃料列表初始化
  const [fuelData, setFuelData] = useState([]);
  
  // 格式化数值显示，根据指标类型使用不同的小数位数
  const formatValue = (value, precision = 2) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    
    // 解析为浮点数
    const numValue = parseFloat(value);
    // 确保是有效数字
    if (isNaN(numValue)) return '';
    
    return numValue.toFixed(precision);
  };
  
  // 初始化燃料数据 - 仅在组件首次挂载时执行一次
  useEffect(() => {
    // 如果从props传入了数据，使用props数据；否则使用默认固体燃料初始化
    if (Array.isArray(fossilFuelData) && fossilFuelData.length > 0) {
      setFuelData(fossilFuelData);
    } else {
      // 使用默认固体燃料初始化数据
      const initialFuelData = SOLID_FUELS.map(fuel => ({
        id: generateId(),
        fuelId: fuel.id,
        fuelName: fuel.name,
        monthlyData: createInitialMonthlyData(),
        files: {} // 初始化files对象用于存储支撑材料
      }));
      setFuelData(initialFuelData);
    }
  }, []);
  
  // 当fuelData变化时，通知父组件
  useEffect(() => {
    if (onFossilFuelDataChange && fuelData.length > 0) {
      onFossilFuelDataChange(fuelData);
    }
  }, [fuelData, onFossilFuelDataChange]);
  
  // 处理数据变化
  const handleDataChange = useCallback((fuelId, indicatorKey, month, value) => {
    setFuelData(prevFuelData => {
      return prevFuelData.map(fuel => {
        if (fuel.id === fuelId) {
          // 创建新数组以避免直接修改原数组
          const updatedMonthlyData = [...fuel.monthlyData];
          const monthIndex = updatedMonthlyData.findIndex(m => m.month === month);
          
          if (monthIndex !== -1) {
            // 更新现有月份数据
            if (updatedMonthlyData[monthIndex][indicatorKey] !== value) {
              updatedMonthlyData[monthIndex] = {
                ...updatedMonthlyData[monthIndex],
                [indicatorKey]: value
              };
              
              return {
                ...fuel,
                monthlyData: updatedMonthlyData
              };
            }
          }
        }
        return fuel;
      });
    });
  }, []);
  
  // 更新支撑材料文件
  const updateFile = useCallback((fuelId, indicatorKey, file) => {
    if (!file) return;
    
    // 创建一个文件对象，包含文件名和模拟的文件路径
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      path: `/uploads/${Date.now()}_${file.name}` // 模拟文件路径
    };
    
    setFuelData(prevFuelData => {
      return prevFuelData.map(fuel => {
        if (fuel.id === fuelId) {
          // 如果fuel中还没有files对象，创建一个
          const existingFiles = fuel.files || {};
          return {
            ...fuel,
            files: {
              ...existingFiles,
              [indicatorKey]: fileInfo
            }
          };
        }
        return fuel;
      });
    });
    
    // 可以在这里添加实际的文件上传逻辑
    console.log('上传文件:', fileInfo, '到燃料:', fuelId, '指标:', indicatorKey);
  }, []);

  // 计算燃料的全年总计值
  const calculateYearlyTotal = useCallback((fuelId, indicatorKey) => {
    const fuel = fuelData.find(f => f.id === fuelId);
    if (!fuel || !fuel.monthlyData) return 0;
    
    return fuel.monthlyData.reduce((total, monthData) => {
      const value = parseFloat(monthData[indicatorKey]) || 0;
      return total + value;
    }, 0);
  }, [fuelData]);

  // 渲染燃料表格的函数
  const renderFuelTable = (fuel) => {
    // 检查fuel和相关数据是否存在
    if (!fuel || !fuel.monthlyData) {
      return null;
    }

    return FOSSIL_FUEL_INDICATORS.map(indicator => (
      <tr key={`${fuel.id}-${indicator.key}`}>
        {/* 指标名称列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{indicator.name}</td>
        
        {/* 单位列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{indicator.unit}</td>
        
        {/* 12个月份列 */}
        {MONTHS.map((month, monthIndex) => {
          const monthNum = monthIndex + 1;
          const monthData = fuel.monthlyData?.find(m => m.month === monthNum);
          const currentValue = monthData ? monthData[indicator.key] || '' : '';
          
          return (
            <td key={`${fuel.id}-${indicator.key}-${monthNum}`} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
              <input
                type="number"
                step="0.001"
                value={currentValue}
                style={{ width: '100%', textAlign: 'center' }}
                onChange={(e) => {
                  // 直接传递输入值，不进行任何格式化处理
                  handleDataChange(fuel.id, indicator.key, monthNum, e.target.value);
                }}
              />
            </td>
          );
        })}
        
        {/* 全年值列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
          {indicator.key === 'waterContent' ? '' : formatValue(calculateYearlyTotal(fuel.id, indicator.key), indicator.precision)}
        </td>
        
        {/* 获取方式列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
          {indicator.isCalculated ? '计算' : '填写'}
        </td>
        
        {/* 数据来源列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="数据来源"
            style={{
              width: '100%',
              padding: '2px 4px',
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              fontSize: '12px'
            }}
          />
        </td>
        
        {/* 支撑材料列 */}
        <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                updateFile(fuel.id, indicator.key, e.target.files[0]);
                e.target.value = ''; // 重置input以允许再次选择同一文件
              }
            }}
            style={{ fontSize: '12px' }}
          />
          {fuel.files && fuel.files[indicator.key] && (
            <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
              {fuel.files[indicator.key].name}
            </div>
          )}
        </td>
      </tr>
    ));
  };

  // 渲染纵向布局表格
  const renderVerticalLayoutTable = () => {
    // 检查fuelData是否存在且为数组
    if (!Array.isArray(fuelData) || fuelData.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无燃料数据</div>;
    }

    const tableHeaders = (
      <thead>
        <tr style={{ backgroundColor: '#f5f5f5' }}>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>指标名称</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>单位</th>
          {MONTHS.map((month, index) => (
            <th key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>{month}</th>
          ))}
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>全年值</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '100px' }}>获取方式</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '120px' }}>数据来源</th>
          <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', width: '150px' }}>支撑材料</th>
        </tr>
      </thead>
    );

    return (
      <div style={{ overflowX: 'auto' }}>
        {fuelData.map((fuel) => (
          <div key={fuel.id} className="fuel-section" style={{ marginBottom: '30px', padding: '20px', border: '2px solid #2196F3', borderRadius: '8px', backgroundColor: '#f0f8ff' }}>
            <div className="fuel-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: '10px 0' }}>{fuel.fuelName}</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              {tableHeaders}
              <tbody>
                {renderFuelTable(fuel)}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>辅助参数报告项：固体化石燃料消耗</h2>
      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
        <p><strong>净消耗量单位为 t，水分均值单位为 %，均四舍五入保留到小数点后两位</strong></p>
        <p style={{color: 'red'}}><strong>注：这里的固体燃料指企业层级核算边界内的外购固体化石燃料的净消耗量（干燥基），具体实现逻辑有待确认。</strong></p>
      </div>

      {/* 纵向布局表格 */}
      {renderVerticalLayoutTable()}
    </div>
  );
};

export default SteelFossilFuelConsumption;