import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Table, InputNumber, Button } from 'antd';

// 月份数组
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 默认电力排放因子 (kgCO2/kWh)
const DEFAULT_ELECTRICITY_EMISSION_FACTOR = 0.5366;

// 初始化月度数据的函数
const initMonthData = (defaultValue = '') => {
  const data = {};
  MONTHS.forEach(month => {
    data[month] = defaultValue;
  });
  return data;
};

const PowerPlantElectricityEmission = ({ units = [], onEmissionChange, initialData = {} }) => {
  // 初始化电力使用数据
  const [electricityData, setElectricityData] = useState(initialData || {});
  // 电力排放因子
  const [emissionFactor, setEmissionFactor] = useState(DEFAULT_ELECTRICITY_EMISSION_FACTOR);
  // 用于防抖的定时器引用
  const updateTimerRef = useRef(null);
  // 标记是否所有必要数据都已填写
  const [allDataCompleted, setAllDataCompleted] = useState(false);
  
  // 当机组列表变化时，初始化对应的电力使用数据
  useEffect(() => {
    const newElectricityData = { ...electricityData };
    units.forEach(unit => {
      if (!newElectricityData[unit.id]) {
        newElectricityData[unit.id] = {
          consumption: initMonthData()
        };
      }
    });
    // 只在确实有新机组添加时才更新状态
    const hasNewUnits = Object.keys(newElectricityData).length > Object.keys(electricityData).length;
    if (hasNewUnits) {
      setElectricityData(newElectricityData);
    }
  }, [units.map(u => u.id).join(',')]);

  // 检查所有数据是否已完成填写
  const checkAllDataCompleted = (data) => {
    if (units.length === 0) return false;
    
    for (const unit of units) {
      const unitData = data[unit.id];
      if (!unitData || !unitData.consumption) return false;
      
      // 检查该机组是否有至少一个月有有效数据
      let hasData = false;
      for (const month of MONTHS) {
        if (unitData.consumption[month] && parseFloat(unitData.consumption[month]) > 0) {
          hasData = true;
          break;
        }
      }
      
      if (!hasData) return false;
    }
    
    return true;
  };

  // 更新月度电力使用量
  const updateMonthlyConsumption = (unitId, month, value) => {
    // 使用结构赋值进行正确的嵌套对象更新
    setElectricityData(prevData => {
      const newData = {
        ...prevData,
        [unitId]: {
          ...prevData[unitId],
          consumption: {
            ...prevData[unitId]?.consumption,
            [month]: value
          }
        }
      };
      
      // 检查数据是否已完成填写
      const isCompleted = checkAllDataCompleted(newData);
      setAllDataCompleted(isCompleted);
      
      // 清除之前的定时器
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      
      // 设置新的定时器 - 延迟通知父组件
      // 只有当数据完成或防抖时间到达时才通知
      updateTimerRef.current = setTimeout(() => {
        updateParentComponent(newData);
      }, isCompleted ? 100 : 300); // 数据完成时快速通知，否则使用更长的防抖时间
      
      return newData;
    });
  };

  // 更新排放因子
  const handleEmissionFactorChange = (value) => {
    setEmissionFactor(value);
    
    // 清除之前的定时器
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    // 设置新的定时器 - 延迟通知父组件
    updateTimerRef.current = setTimeout(() => {
      updateParentComponent(electricityData);
    }, 300); // 使用防抖时间
  };

  // 计算总排放量
  const calculateTotalEmission = (data) => {
    let totalEmission = 0;
    
    Object.values(data).forEach(unitData => {
      MONTHS.forEach(month => {
        // 数据已经是MW∙h单位，直接计算
        const consumptionMWh = parseFloat(unitData.consumption[month]) || 0;
        totalEmission += consumptionMWh * emissionFactor;
      });
    });
    
    return totalEmission;
  };

  // 直接根据数据计算月度排放汇总（确保使用最新数据）
  const calculateMonthlyEmissionsForData = (data) => {
    const summary = [];
    const totalByMonth = {};
    MONTHS.forEach(month => totalByMonth[month] = 0);
    
    units.forEach(unit => {
      const unitData = data[unit.id] || { consumption: {} };
      const unitSummary = { unitName: unit.name, monthlyData: {} };
      let unitTotal = 0;
      
      MONTHS.forEach(month => {
        // 数据已经是MW∙h单位，直接计算
        const consumptionMWh = parseFloat(unitData.consumption[month]) || 0;
        const monthlyEmission = consumptionMWh * emissionFactor;
        unitSummary.monthlyData[month] = monthlyEmission;
        unitTotal += monthlyEmission;
        totalByMonth[month] += monthlyEmission;
      });
      
      unitSummary.total = unitTotal;
      summary.push(unitSummary);
    });
    
    // 添加总计行
    summary.push({
      unitName: '总计',
      monthlyData: totalByMonth,
      total: Object.values(totalByMonth).reduce((sum, val) => sum + val, 0),
      isTotal: true
    });
    
    return summary;
  };

  // 更新父组件
  const updateParentComponent = (data) => {
    if (onEmissionChange) {
      const totalEmission = calculateTotalEmission(data);
      // 直接使用传入的data参数计算月度排放汇总，确保使用最新数据
      const emissionsSummary = calculateMonthlyEmissionsForData(data);
      // 准备月度机组排放数据，但不包含总计行
      const monthlyUnitEmissions = emissionsSummary
        .filter(item => !item.isTotal)
        .map(item => {
          // 转换monthlyData为直接属性
          const unitData = { unitName: item.unitName };
          MONTHS.forEach(month => {
            unitData[month] = item.monthlyData[month];
          });
          unitData.total = item.total;
          return unitData;
        });
      
      onEmissionChange({
        data: data,
        emissionFactor: emissionFactor,
        totalEmission: totalEmission,
        value: { CO2: totalEmission, CH4: 0, N2O: 0, total: totalEmission },
        monthlyUnitEmissions: monthlyUnitEmissions,
        isCompleted: allDataCompleted // 通知父组件数据是否已完成
      });
    }
  };
  
  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  // 计算各机组月度排放量汇总数据
  const calculateMonthlyEmissionsSummary = useMemo(() => {
    const summary = [];
    const totalByMonth = {};
    MONTHS.forEach(month => totalByMonth[month] = 0);
    
    units.forEach(unit => {
      const unitData = electricityData[unit.id] || { consumption: {} };
      const unitSummary = { unitName: unit.name, monthlyData: {} };
      let unitTotal = 0;
      
      MONTHS.forEach(month => {
        // 数据已经是MW∙h单位，直接计算
        const consumptionMWh = parseFloat(unitData.consumption[month]) || 0;
        const monthlyEmission = consumptionMWh * emissionFactor;
        unitSummary.monthlyData[month] = monthlyEmission;
        unitTotal += monthlyEmission;
        totalByMonth[month] += monthlyEmission;
      });
      
      unitSummary.total = unitTotal;
      summary.push(unitSummary);
    });
    
    // 添加总计行
    summary.push({
      unitName: '总计',
      monthlyData: totalByMonth,
      total: Object.values(totalByMonth).reduce((sum, val) => sum + val, 0),
      isTotal: true
    });
    
    return summary;
  }, [electricityData, units, emissionFactor]);

  // 渲染每个机组的电力使用表格
  const renderUnitElectricityTable = (unit) => {
    const unitData = electricityData[unit.id] || { consumption: initMonthData() };
    
    // 计算全年电力使用量和排放量
    const annualConsumptionMWh = MONTHS.reduce((sum, month) => {
      // 数据已经是MW∙h单位
      return sum + (parseFloat(unitData.consumption[month]) || 0);
    }, 0);
    
    const annualEmission = MONTHS.reduce((sum, month) => {
      // 数据已经是MW∙h单位，直接计算
      const consumptionMWh = parseFloat(unitData.consumption[month]) || 0;
      return sum + consumptionMWh * emissionFactor;
    }, 0);
    
    // 构建月度数据
    const monthlyData = {};
    const monthlyEmissions = {};
    MONTHS.forEach(month => {
      // 数据已经是MW∙h单位
      monthlyData[month] = parseFloat(unitData.consumption[month]) || 0;
      // 计算月度排放量
      monthlyEmissions[month] = monthlyData[month] * emissionFactor;
    });
    
    // 构建表格数据，改为两行
    const tableData = [
      {
        key: 'electricity-consumption',
        item: '购入使用电量',
        unit: 'MW∙h',
        ...monthlyData,
        annualValue: annualConsumptionMWh,
        isInput: true,
        originalUnitKey: unit.id
      },
      {
        key: 'electricity-emission',
        item: '购入使用电力排放量',
        unit: 'tCO2',
        ...monthlyEmissions,
        annualValue: annualEmission,
        isInput: false
      }
    ];
    
    // 构建列配置
    const columns = [
      { title: '项目', dataIndex: 'item', key: 'item', width: 150 },
      { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 }
    ];
    
    // 添加月份列
    MONTHS.forEach(month => {
      columns.push({
        title: month,
        dataIndex: month,
        key: month,
        width: 90,
        render: (value, record) => {
          if (record.isInput) {
            // 对于输入行，将显示值转换回 kWh 进行存储
            return (
              <InputNumber
                min={0}
                step={0.001}
                precision={3}
                value={value}
                onChange={(val) => {
                  // 直接存储MW∙h值
                  updateMonthlyConsumption(record.originalUnitKey, month, val);
                }}
                style={{ width: '100%' }}
              />
            );
          } else {
            // 对于计算行，直接显示计算结果
            return typeof value === 'number' ? value.toFixed(2) : '';
          }
        }
      });
    });
    
    // 添加全年列
    columns.push(
      { 
        title: '全年值', 
        dataIndex: 'annualValue', 
        key: 'annualValue',
        width: 100,
        render: (text, record) => {
          if (record.isInput) {
            // 电量显示三位小数
            return typeof text === 'number' ? text.toFixed(3) : text;
          } else {
            // 排放量显示两位小数
            return typeof text === 'number' ? text.toFixed(2) : text;
          }
        }
      }
    );
    
    return (
      <Card 
        title={`${unit.name} - 购入使用电力排放`} 
        key={unit.id}
        style={{ marginBottom: 20 }}
      >
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    );
  };

  return (
    <div className="power-plant-electricity-emission">
      <Card title="发电设施购入使用电力排放">
        {/* 排放因子设置 */}
        <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f5ff', borderRadius: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>电力排放因子（tCO2/MW∙h）：</span>
            <InputNumber
              min={0}
              step={0.0001}
              value={emissionFactor}
              onChange={handleEmissionFactorChange}
              style={{ width: 150 }}
              placeholder="请输入排放因子"
            />
            <span style={{ color: '#888', fontSize: '12px' }}>（默认值：{DEFAULT_ELECTRICITY_EMISSION_FACTOR} tCO2/MW∙h）</span>
          </div>
        </div>
        
        {/* 排放量按月汇总表格 */}
        {units.length > 0 && (
          <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #2196F3', borderRadius: '8px', backgroundColor: '#f0f7ff' }}>
            <h3 style={{ marginBottom: '15px' }}>各机组排放量月度汇总</h3>
            <Table
              columns={[
                { title: '机组名称', key: 'unitName', width: 150, render: (_, record) => (
                  <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{record.unitName}</span>
                )},
                ...MONTHS.map(month => ({
                  title: month,
                  key: month,
                  width: 80,
                  render: (_, record) => {
                    const value = record.monthlyData[month] || 0;
                    return value.toFixed(2);
                  }
                })),
                { 
                  title: '全年累计', 
                  key: 'total', 
                  width: 100,
                  render: (_, record) => {
                    const value = record.total || 0;
                    return (
                      <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal', color: record.isTotal ? '#f5222d' : '#333' }}>
                        {value.toFixed(2)}
                      </span>
                    );
                  }
                }
              ]}
              dataSource={calculateMonthlyEmissionsSummary}
              pagination={false}
              rowKey="unitName"
              scroll={{ x: 'max-content' }}
            />
          </div>
        )}

        {/* 机组电力使用表格 */}
        {units.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            请先添加机组
          </div>
        ) : (
          units.map(unit => renderUnitElectricityTable(unit))
        )}
        
        <div style={{ marginTop: 20, padding: 15, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          <h4>计算说明：</h4>
          <ul>
            <li>CO2排放量 = 电力使用量 (MW∙h) × 电力排放因子 (tCO2/MW∙h)</li>
            <li>注意：1 kgCO2/kWh = 1 tCO2/MW∙h，两者在数值上完全等价</li>
            <li>电力使用量输入显示单位为MW∙h，保留三位小数</li>
            <li>排放量计算结果单位为tCO2，显示时保留两位小数</li>
            <li>电力排放因子可根据实际情况调整</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default PowerPlantElectricityEmission;