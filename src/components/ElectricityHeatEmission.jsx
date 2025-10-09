import React, { useState, useEffect } from 'react';
import { electricityEmissionFactors, regionEmissionFactors, DEFAULT_HEAT_EMISSION_FACTOR } from '../config/emissionConstants';
import {
  saturatedSteamTable,
  superheatedSteamTable,
  WATER_SPECIFIC_HEAT,
  AMBIENT_TEMPERATURE,
  BASE_ENTHALPY,
  HEAT_CALCULATION_CONSTANTS,
  STEAM_TYPES
} from '../config/steamConstants';
import SteamEnthalpyTable from './SteamEnthalpyTable';

// 从饱和蒸汽表中提取压力选项
const saturatedPressureOptions = [...new Set(saturatedSteamTable.map(item => item.pressure))].sort((a, b) => a - b);

// 从过热蒸汽表中提取压力选项
const superheatedPressureOptions = [...new Set(superheatedSteamTable.map(item => item.pressure))].sort((a, b) => a - b);

// 从过热蒸汽表中提取温度选项（去重并排序）
const temperatureOptions = [...new Set(superheatedSteamTable.map(item => item.temperature))].sort((a, b) => a - b);

// 线性插值函数
const linearInterpolation = (x, x1, y1, x2, y2) => {
  if (x1 === x2) return y1;
  return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
};

// 获取饱和蒸汽热焓
const getSaturatedSteamEnthalpy = (pressure, temperature) => {
  // 优先按压力查找
  const sortedTable = [...saturatedSteamTable].sort((a, b) => a.pressure - b.pressure);
  
  // 找到压力范围内的两个点
  let lowerPoint = null;
  let upperPoint = null;
  
  for (let i = 0; i < sortedTable.length - 1; i++) {
    if (pressure >= sortedTable[i].pressure && pressure <= sortedTable[i + 1].pressure) {
      lowerPoint = sortedTable[i];
      upperPoint = sortedTable[i + 1];
      break;
    }
  }
  
  // 如果超出范围，使用最近的值
  if (!lowerPoint) {
    if (pressure <= sortedTable[0].pressure) {
      return sortedTable[0].enthalpy;
    } else {
      return sortedTable[sortedTable.length - 1].enthalpy;
    }
  }
  
  // 线性插值计算焓值
  return linearInterpolation(pressure, lowerPoint.pressure, lowerPoint.enthalpy, upperPoint.pressure, upperPoint.enthalpy);
};

// 获取饱和蒸汽对应的温度
const getSaturatedSteamTemperature = (pressure) => {
  const sortedTable = [...saturatedSteamTable].sort((a, b) => a.pressure - b.pressure);
  
  // 找到压力范围内的两个点
  let lowerPoint = null;
  let upperPoint = null;
  
  for (let i = 0; i < sortedTable.length - 1; i++) {
    if (pressure >= sortedTable[i].pressure && pressure <= sortedTable[i + 1].pressure) {
      lowerPoint = sortedTable[i];
      upperPoint = sortedTable[i + 1];
      break;
    }
  }
  
  // 如果超出范围，使用最近的值
  if (!lowerPoint) {
    if (pressure <= sortedTable[0].pressure) {
      return sortedTable[0].temperature;
    } else {
      return sortedTable[sortedTable.length - 1].temperature;
    }
  }
  
  // 线性插值计算温度
  return linearInterpolation(pressure, lowerPoint.pressure, lowerPoint.temperature, upperPoint.pressure, upperPoint.temperature);
};

// 获取过热蒸汽热焓
const getSuperheatedSteamEnthalpy = (pressure, temperature) => {
  // 先按压力筛选
  const pressureData = superheatedSteamTable.filter(item => Math.abs(item.pressure - pressure) < 0.01);
  
  if (pressureData.length > 0) {
    // 按温度排序
    const sortedData = pressureData.sort((a, b) => a.temperature - b.temperature);
    
    // 找到温度范围内的两个点
    let lowerPoint = null;
    let upperPoint = null;
    
    for (let i = 0; i < sortedData.length - 1; i++) {
      if (temperature >= sortedData[i].temperature && temperature <= sortedData[i + 1].temperature) {
        lowerPoint = sortedData[i];
        upperPoint = sortedData[i + 1];
        break;
      }
    }
    
    if (lowerPoint) {
      // 线性插值计算焓值
      return linearInterpolation(temperature, lowerPoint.temperature, lowerPoint.enthalpy, upperPoint.temperature, upperPoint.enthalpy);
    }
    
    // 如果超出范围，使用最近的值
    if (temperature <= sortedData[0].temperature) {
      return sortedData[0].enthalpy;
    } else {
      return sortedData[sortedData.length - 1].enthalpy;
    }
  }
  
  // 如果找不到对应压力的数据，使用最接近的压力数据
  const closestPressure = superheatedSteamTable.reduce((prev, curr) => 
    Math.abs(curr.pressure - pressure) < Math.abs(prev.pressure - pressure) ? curr : prev
  );
  
  // 找到最接近压力下的温度数据
  const closestPressureData = superheatedSteamTable.filter(item => item.pressure === closestPressure.pressure)
    .sort((a, b) => Math.abs(a.temperature - temperature) - Math.abs(b.temperature - temperature));
  
  return closestPressureData[0]?.enthalpy || 2700; // 默认值
};

const ElectricityHeatEmission = ({ onEmissionChange, initialData = {} }) => {
  // 电力排放数据
  const [electricityData, setElectricityData] = useState({
    purchasedAmount: initialData.electricityPurchased || '',
    soldAmount: initialData.electricitySold || '',
    netAmount: initialData.electricityNet || '',
    province: initialData.province || '山东',
    year: initialData.year || '2022',
    emissionFactor: initialData.electricityEmissionFactor || '',
    emission: initialData.electricityEmission || 0
  });

  // 热力排放数据
  const [heatData, setHeatData] = useState({
    purchasedAmount: initialData.heatPurchased || '',
    soldAmount: initialData.heatSold || '',
    netAmount: initialData.heatNet || '',
    emissionFactor: initialData.heatEmissionFactor || DEFAULT_HEAT_EMISSION_FACTOR,
    emission: initialData.heatEmission || 0
  });

  // 热水排放数据
  const [hotWaterRecords, setHotWaterRecords] = useState(initialData.hotWaterRecords || [
    {
      id: 1,
      name: '热水1',
      mass: '',
      temperature: '',
      calculatedHeat: 0,
      heatAmount: ''
    }
  ]);

  // 蒸汽排放数据
  const [steamRecords, setSteamRecords] = useState(initialData.steamRecords || [
    {
      id: 1,
      name: '蒸汽1',
      mass: '',
      pressure: saturatedPressureOptions[0]?.toString() || '',
      temperature: '',
      isSaturated: true,
      calculatedHeat: 0,
      heatAmount: ''
    }
  ]);

  // 显示热焓表的状态
  const [showEnthalpyTable, setShowEnthalpyTable] = useState(false);

  // 初始化饱和蒸汽温度
  useEffect(() => {
    const updatedRecords = steamRecords.map(record => {
      if (record.isSaturated && record.pressure) {
        const pressure = parseFloat(record.pressure);
        if (!isNaN(pressure)) {
          const temperature = getSaturatedSteamTemperature(pressure);
          return { ...record, temperature: temperature.toFixed(2) };
        }
      }
      return record;
    });
    
    // 只有当有变化时才更新状态
    const hasChanges = updatedRecords.some((record, index) => 
      record.temperature !== steamRecords[index].temperature
    );
    
    if (hasChanges) {
      setSteamRecords(updatedRecords);
    }
  }, [steamRecords]);

  // 计算电力排放量
  const calculateElectricityEmission = () => {
    const netAmount = parseFloat(electricityData.netAmount) || 0;
    const emissionFactor = parseFloat(electricityData.emissionFactor) || 0;
    const emission = netAmount * emissionFactor;
    
    setElectricityData(prev => ({
      ...prev,
      emission: Math.round(emission * 10000) / 10000
    }));
  };

  // 计算热力排放量
  const calculateHeatEmission = () => {
    const netAmount = parseFloat(heatData.netAmount) || 0;
    const emissionFactor = parseFloat(heatData.emissionFactor) || 0;
    const emission = netAmount * emissionFactor;
    
    setHeatData(prev => ({
      ...prev,
      emission: Math.round(emission * 10000) / 10000
    }));
  };

  // 计算热水热量
  const calculateHotWaterHeat = (index) => {
    const records = [...hotWaterRecords];
    const record = records[index];
    
    if (record.mass && record.temperature) {
      const mass = parseFloat(record.mass);
      const temperature = parseFloat(record.temperature);
      const heat = mass * (temperature - AMBIENT_TEMPERATURE) * WATER_SPECIFIC_HEAT * HEAT_CALCULATION_CONSTANTS.GJ_CONVERSION_FACTOR;
      record.calculatedHeat = Math.round(heat * 10000) / 10000;
      record.heatAmount = record.calculatedHeat.toString();
    } else {
      record.calculatedHeat = 0;
      record.heatAmount = '';
    }
    
    setHotWaterRecords(records);
  };

  // 计算蒸汽热量
  const calculateSteamHeat = (index) => {
    const records = [...steamRecords];
    const record = records[index];
    
    if (record.mass && record.pressure) {
      const mass = parseFloat(record.mass);
      const pressure = parseFloat(record.pressure);
      const temperature = record.temperature ? parseFloat(record.temperature) : null;
      
      let enthalpy;
      if (record.isSaturated) {
        // 饱和蒸汽
        enthalpy = getSaturatedSteamEnthalpy(pressure, temperature);
      } else {
        // 过热蒸汽
        enthalpy = getSuperheatedSteamEnthalpy(pressure, temperature);
      }
      
      // 使用精确公式计算热量
      const heat = mass * (enthalpy - BASE_ENTHALPY) * HEAT_CALCULATION_CONSTANTS.GJ_CONVERSION_FACTOR;
      record.calculatedHeat = Math.round(heat * 10000) / 10000;
      record.heatAmount = record.calculatedHeat.toString();
    } else {
      record.calculatedHeat = 0;
      record.heatAmount = '';
    }
    
    setSteamRecords(records);
  };

  // 计算总排放量
  const calculateTotalEmission = () => {
    const hotWaterTotalHeat = hotWaterRecords.reduce((sum, record) => sum + (parseFloat(record.heatAmount) || 0), 0);
    const steamTotalHeat = steamRecords.reduce((sum, record) => sum + (parseFloat(record.heatAmount) || 0), 0);
    
    const hotWaterEmission = hotWaterTotalHeat * parseFloat(heatData.emissionFactor);
    const steamEmission = steamTotalHeat * parseFloat(heatData.emissionFactor);
    
    const totalEmission = electricityData.emission + heatData.emission + hotWaterEmission + steamEmission;
    
    return {
      electricityEmission: electricityData.emission,
      heatEmission: heatData.emission,
      hotWaterEmission: Math.round(hotWaterEmission * 10000) / 10000,
      steamEmission: Math.round(steamEmission * 10000) / 10000,
      totalEmission: Math.round(totalEmission * 10000) / 10000
    };
  };

  // 当数据变化时，通知父组件
  useEffect(() => {
    const emissions = calculateTotalEmission();
    // 直接传递totalEmission值给父组件，而不是整个对象
    onEmissionChange && onEmissionChange(emissions.totalEmission);
  }, [electricityData, heatData, hotWaterRecords, steamRecords]);

  // 处理电力数据变化
  const handleElectricityChange = (field, value) => {
    setElectricityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理热力数据变化
  const handleHeatChange = (field, value) => {
    setHeatData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理热水记录变化
  const handleHotWaterChange = (index, field, value) => {
    const records = [...hotWaterRecords];
    records[index][field] = value;
    setHotWaterRecords(records);
    
    // 如果修改了质量或温度，重新计算热量
    if (field === 'mass' || field === 'temperature') {
      calculateHotWaterHeat(index);
    }
  };

  // 处理蒸汽记录变化
  const handleSteamChange = (index, field, value) => {
    // 创建新记录数组的副本
    const records = [...steamRecords];
    let shouldRecalculateTemperature = false;
    let shouldResetPressure = false;
    
    // 特别处理：当切换蒸汽类型时，需要重置压力和温度
    if (field === 'isSaturated') {
      const newIsSaturated = value === true;
      
      // 根据新的蒸汽类型设置默认压力
      if (newIsSaturated) {
        // 切换到饱和蒸汽，使用饱和蒸汽的默认压力
        records[index].pressure = saturatedPressureOptions[0]?.toString() || '';
      } else {
        // 切换到过热蒸汽，使用过热蒸汽的默认压力
        records[index].pressure = superheatedPressureOptions[0]?.toString() || '';
      }
      
      // 更新蒸汽类型
      records[index].isSaturated = newIsSaturated;
      shouldRecalculateTemperature = true;
    } else {
      // 更新当前字段
      records[index][field] = value;
      
      // 特别处理：当蒸汽类型为饱和蒸汽且压力改变时，立即更新温度
      if (records[index].isSaturated && field === 'pressure') {
        shouldRecalculateTemperature = true;
      }
    }
    
    // 如果需要，重新计算温度
    if (shouldRecalculateTemperature && records[index].pressure) {
      const pressure = parseFloat(records[index].pressure);
      if (!isNaN(pressure)) {
        const temperature = getSaturatedSteamTemperature(pressure);
        records[index].temperature = temperature.toFixed(2);
      }
    }
    
    // 更新状态
    setSteamRecords(records);
    
    // 如果修改了质量、压力、温度或饱和状态，重新计算热量
    if (field === 'mass' || field === 'pressure' || field === 'temperature' || field === 'isSaturated') {
      // 使用setTimeout确保状态已经更新
      setTimeout(() => calculateSteamHeat(index), 0);
    }
  };

  // 添加新的热水记录
  const addHotWaterRecord = () => {
    const newId = Math.max(...hotWaterRecords.map(r => r.id), 0) + 1;
    setHotWaterRecords([...hotWaterRecords, {
      id: newId,
      name: `热水${newId}`,
      mass: '',
      temperature: '',
      calculatedHeat: 0,
      heatAmount: ''
    }]);
  };

  // 删除热水记录
  const deleteHotWaterRecord = (id) => {
    setHotWaterRecords(hotWaterRecords.filter(record => record.id !== id));
  };

  // 添加新的蒸汽记录
  const addSteamRecord = () => {
    const newId = Math.max(...steamRecords.map(r => r.id), 0) + 1;
    const pressure = saturatedPressureOptions[0]?.toString() || '';
    let temperature = '';
    
    // 如果有默认压力，计算对应的温度
    if (pressure) {
      const temp = getSaturatedSteamTemperature(parseFloat(pressure));
      temperature = temp.toFixed(2);
    }
    
    setSteamRecords([...steamRecords, {
      id: newId,
      name: `蒸汽${newId}`,
      mass: '',
      pressure: pressure,
      temperature: temperature,
      isSaturated: true,
      calculatedHeat: 0,
      heatAmount: ''
    }]);
  };

  // 删除蒸汽记录
  const deleteSteamRecord = (id) => {
    setSteamRecords(steamRecords.filter(record => record.id !== id));
  };

  // 当省份或年份变化时，更新排放因子
  useEffect(() => {
    const factorData = electricityEmissionFactors.find(item => item.province === electricityData.province);
    if (factorData) {
      setElectricityData(prev => ({
        ...prev,
        emissionFactor: factorData[`factor${electricityData.year}`]
      }));
    }
  }, [electricityData.province, electricityData.year]);

  // 当净购电量变化时，重新计算排放量
  useEffect(() => {
    calculateElectricityEmission();
  }, [electricityData.netAmount, electricityData.emissionFactor]);

  // 当净购热量变化时，重新计算排放量
  useEffect(() => {
    calculateHeatEmission();
  }, [heatData.netAmount, heatData.emissionFactor]);

  // 计算净购电量
  useEffect(() => {
    const purchasedAmount = parseFloat(electricityData.purchasedAmount) || 0;
    const soldAmount = parseFloat(electricityData.soldAmount) || 0;
    const netAmount = purchasedAmount - soldAmount;
    
    setElectricityData(prev => ({
      ...prev,
      netAmount: netAmount.toString()
    }));
  }, [electricityData.purchasedAmount, electricityData.soldAmount]);

  // 计算净购热量
  useEffect(() => {
    const purchasedAmount = parseFloat(heatData.purchasedAmount) || 0;
    const soldAmount = parseFloat(heatData.soldAmount) || 0;
    const netAmount = purchasedAmount - soldAmount;
    
    setHeatData(prev => ({
      ...prev,
      netAmount: netAmount.toString()
    }));
  }, [heatData.purchasedAmount, heatData.soldAmount]);

  const emissions = calculateTotalEmission();

  return (
    <div className="electricity-heat-emission">
      <h2>净购入电力和热力隐含的CO2排放</h2>
      
      {/* 电力部分 */}
      <div className="section">
        <h3>电力</h3>
        <div className="form-group">
          <label>省份：</label>
          <select 
            value={electricityData.province} 
            onChange={(e) => handleElectricityChange('province', e.target.value)}
          >
            {electricityEmissionFactors.map(item => (
              <option key={item.province} value={item.province}>{item.province}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>年份：</label>
          <select 
            value={electricityData.year} 
            onChange={(e) => handleElectricityChange('year', e.target.value)}
          >
            <option value="2021">2021</option>
            <option value="2022">2022</option>
          </select>
        </div>
        <div className="form-group">
          <label>排放因子：</label>
          <input 
            type="text" 
            value={electricityData.emissionFactor} 
            readOnly 
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>购入量 (MWh：兆瓦时)</th>
              <th>外供量 (MWh：兆瓦时)</th>
              <th>净购入量 (MWh：兆瓦时)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input 
                  type="number" 
                  value={electricityData.purchasedAmount} 
                  onChange={(e) => handleElectricityChange('purchasedAmount', e.target.value)}
                  placeholder="0"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={electricityData.soldAmount} 
                  onChange={(e) => handleElectricityChange('soldAmount', e.target.value)}
                  placeholder="0"
                />
              </td>
              <td>
                <input 
                  type="text" 
                  value={electricityData.netAmount} 
                  readOnly 
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="emission-result">
          CO2排放量：{emissions.electricityEmission} 吨
        </div>
      </div>

      {/* 热力部分 */}
      <div className="section">
        <h3>热力</h3>
        <div className="form-group">
          <label>排放因子 (吨 CO2/GJ)：</label>
          <input 
            type="number" 
            value={heatData.emissionFactor} 
            onChange={(e) => handleHeatChange('emissionFactor', e.target.value)}
            step="0.01"
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>购入量 (GJ：百万千焦)</th>
              <th>外供量 (GJ：百万千焦)</th>
              <th>净购入量 (GJ：百万千焦)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input 
                  type="number" 
                  value={heatData.purchasedAmount} 
                  onChange={(e) => handleHeatChange('purchasedAmount', e.target.value)}
                  placeholder="0"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={heatData.soldAmount} 
                  onChange={(e) => handleHeatChange('soldAmount', e.target.value)}
                  placeholder="0"
                />
              </td>
              <td>
                <input 
                  type="text" 
                  value={heatData.netAmount} 
                  readOnly 
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="emission-result">
          CO2排放量：{emissions.heatEmission} 吨
        </div>
      </div>

      {/* 热水部分 */}
      <div className="section">
        <h3>热水</h3>
        <div className="calculation-method">
          <label>计算方式：</label>
          <div className="radio-group">
            <label>
              <input type="radio" name="hotWaterMethod" checked readOnly />
              公式计算：热量(GJ) = 热水质量(吨) × (温度-20) × 4.1868 × 0.001
            </label>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>热水质量 (吨)</th>
              <th>热水温度 (℃)</th>
              <th>热量 (GJ)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {hotWaterRecords.map((record, index) => (
              <tr key={record.id}>
                <td>
                  <input 
                    type="text" 
                    value={record.name} 
                    onChange={(e) => handleHotWaterChange(index, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={record.mass} 
                    onChange={(e) => handleHotWaterChange(index, 'mass', e.target.value)}
                    placeholder="0"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={record.temperature} 
                    onChange={(e) => handleHotWaterChange(index, 'temperature', e.target.value)}
                    placeholder="0"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    value={record.heatAmount} 
                    onChange={(e) => handleHotWaterChange(index, 'heatAmount', e.target.value)}
                    placeholder="计算值"
                  />
                  {record.calculatedHeat > 0 && <span className="calculated-mark">*</span>}
                </td>
                <td>
                  {hotWaterRecords.length > 1 && (
                    <button onClick={() => deleteHotWaterRecord(record.id)}>删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addHotWaterRecord} className="add-button">添加记录</button>
        <div className="emission-result">
          CO2排放量：{emissions.hotWaterEmission} 吨
        </div>
      </div>

      {/* 蒸汽部分 */}
      <div className="section">
        <h3>蒸汽</h3>
        <div className="form-group">
          <button 
            onClick={() => setShowEnthalpyTable(!showEnthalpyTable)}
            className="toggle-table-button"
          >
            {showEnthalpyTable ? '隐藏' : '显示'}蒸汽热焓数据表
          </button>
        </div>
        
        {showEnthalpyTable && <SteamEnthalpyTable />}
        
        <div className="calculation-method">
          <label>计算方式：</label>
          <div className="radio-group">
            <label>
              <input type="radio" name="steamMethod" checked readOnly />
              公式计算：热量(GJ) = 蒸汽质量(吨) × (热焓(kJ/kg)-83.74) × 0.001
            </label>
          </div>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>蒸汽质量 (吨)</th>
              <th>蒸汽类型</th>
              <th>压力 (MPa)</th>
              <th>温度 (℃)</th>
              <th>热量 (GJ)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {steamRecords.map((record, index) => (
              <tr key={record.id}>
                <td>
                  <input 
                    type="text" 
                    value={record.name} 
                    onChange={(e) => handleSteamChange(index, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={record.mass} 
                    onChange={(e) => handleSteamChange(index, 'mass', e.target.value)}
                    placeholder="0"
                  />
                </td>
                <td>
                  <select 
                    value={record.isSaturated ? STEAM_TYPES.SATURATED : STEAM_TYPES.SUPERHEATED}
                    onChange={(e) => handleSteamChange(index, 'isSaturated', e.target.value === STEAM_TYPES.SATURATED)}
                  >
                    <option value={STEAM_TYPES.SATURATED}>饱和蒸汽</option>
                    <option value={STEAM_TYPES.SUPERHEATED}>过热蒸汽</option>
                  </select>
                </td>
                <td>
                  <select
                    value={record.pressure}
                    onChange={(e) => handleSteamChange(index, 'pressure', e.target.value)}
                  >
                    {record.isSaturated ? (
                      saturatedPressureOptions.map(pressure => (
                        <option key={pressure} value={pressure}>{pressure}</option>
                      ))
                    ) : (
                      superheatedPressureOptions.map(pressure => (
                        <option key={pressure} value={pressure}>{pressure}</option>
                      ))
                    )}
                  </select>
                </td>
                <td>
                  {record.isSaturated ? (
                    <input 
                      type="text" 
                      value={record.temperature} 
                      readOnly
                      className="readonly-field"
                    />
                  ) : (
                    <select
                      value={record.temperature || ''}
                      onChange={(e) => handleSteamChange(index, 'temperature', e.target.value)}
                    >
                      <option value="">请选择温度</option>
                      {temperatureOptions.map(temp => (
                        <option key={temp} value={temp}>{temp}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  <input 
                    type="text" 
                    value={record.heatAmount} 
                    onChange={(e) => handleSteamChange(index, 'heatAmount', e.target.value)}
                    placeholder="计算值"
                  />
                  {record.calculatedHeat > 0 && <span className="calculated-mark">*</span>}
                </td>
                <td>
                  {steamRecords.length > 1 && (
                    <button onClick={() => deleteSteamRecord(record.id)}>删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addSteamRecord} className="add-button">添加记录</button>
        <div className="emission-result">
          CO2排放量：{emissions.steamEmission} 吨
        </div>
      </div>

      {/* 总计 */}
      <div className="section total">
        <h3>总计</h3>
        <div className="total-emission">
          CO2排放总量：{emissions.totalEmission} 吨
        </div>
      </div>

      {/* 说明 */}
      <div className="description">
        <h4>计算说明：</h4>
        <ul>
          <li>电力排放量 = 净购入电量 × 电力排放因子</li>
          <li>热力排放量 = 净购入热量 × 热力排放因子</li>
          <li>热水热量计算公式：热量(GJ) = 热水质量(吨) × (热水温度℃ - 20) × 4.1868 × 0.001</li>
          <li>蒸汽热量计算公式：热量(GJ) = 蒸汽质量(吨) × (热焓(kJ/kg) - 83.74) × 0.001</li>
          <li>饱和蒸汽热焓值通过压力查表获取，过热蒸汽热焓值通过压力和温度查表获取</li>
          <li>对于饱和蒸汽，温度根据压力自动计算并显示，当压力改变时温度会自动更新</li>
          <li>当切换蒸汽类型时，压力选项会自动更新为对应类型可用的压力范围</li>
          <li>单位说明：MWh（兆瓦时）是电力的能量单位，GJ（百万千焦）是热力的能量单位</li>
          <li>* 表示系统计算值</li>
        </ul>
        <div className="note">
          <strong>注：</strong>请确保提供准确的购入量和外供量数据，并保留相关的证明材料。
        </div>
      </div>

      <style jsx>{`
        .electricity-heat-emission {
          font-family: Arial, sans-serif;
          margin: 20px 0;
        }
        
        h2, h3, h4 {
          margin-top: 0;
          color: #333;
        }
        
        .section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          background-color: #fafafa;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: inline-block;
          margin-right: 10px;
          font-weight: 500;
        }
        
        .form-group select,
        .form-group input[type="text"],
        .form-group input[type="number"] {
          padding: 5px 10px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          margin-right: 10px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .data-table th,
        .data-table td {
          padding: 10px;
          border: 1px solid #d9d9d9;
          text-align: center;
        }
        
        .data-table th {
          background-color: #f5f5f5;
          font-weight: 500;
        }
        
        .data-table input,
        .data-table select {
          width: 100%;
          padding: 5px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          text-align: center;
        }
        
        .data-table input[readonly],
        .readonly-field {
          background-color: #f5f5f5;
          border: 1px solid #e8e8e8;
          color: #666;
        }
        
        .emission-result {
          margin-top: 15px;
          padding: 10px;
          background-color: #e6f7ff;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .total-emission {
          padding: 15px;
          background-color: #f0f5ff;
          border-radius: 4px;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
        }
        
        .add-button {
          padding: 8px 16px;
          background-color: #1890ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
        
        .add-button:hover {
          background-color: #40a9ff;
        }
        
        button {
          padding: 5px 10px;
          background-color: #f5f5f5;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background-color: #e6f7ff;
          border-color: #91d5ff;
        }
        
        .description {
          margin-top: 30px;
          padding: 20px;
          background-color: #f6ffed;
          border: 1px solid #b7eb8f;
          border-radius: 4px;
        }
        
        .description ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .description li {
          margin-bottom: 5px;
        }
        
        .note {
          margin-top: 15px;
          padding: 10px;
          background-color: #fffbe6;
          border: 1px solid #ffe58f;
          border-radius: 4px;
        }
        
        .calculated-mark {
          color: #1890ff;
          font-weight: bold;
          margin-left: 5px;
        }
        
        .calculation-method {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f0f5ff;
          border-radius: 4px;
        }
        
        .radio-group {
          margin-top: 5px;
        }
        
        .toggle-table-button {
          background-color: #1890ff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .toggle-table-button:hover {
          background-color: #40a9ff;
        }
      `}</style>
    </div>
  );
};

export default ElectricityHeatEmission;