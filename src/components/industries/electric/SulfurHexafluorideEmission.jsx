import React, { useState, useCallback } from 'react';

// 六氟化硫的温室气体潜能
const SF6_GWP = 23900;

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const SulfurHexafluorideEmission = ({ onEmissionChange, industryType }) => {
  // 状态管理
  const [retiredDevices, setRetiredDevices] = useState([]);
  const [repairDevices, setRepairDevices] = useState([]);
  const [totalEmission, setTotalEmission] = useState(0);
  
  // 计算排放总量的函数
  const calculateTotalEmission = () => {
    // 计算退役设备排放
    const retiredEmission = retiredDevices.reduce((sum, device) => {
      const capacity = parseFloat(device.capacity) || 0;
      const recovered = parseFloat(device.recovered) || 0;
      return sum + (capacity - recovered);
    }, 0);
    
    // 计算修理设备排放
    const repairEmission = repairDevices.reduce((sum, device) => {
      const capacity = parseFloat(device.capacity) || 0;
      const recovered = parseFloat(device.recovered) || 0;
      return sum + (capacity - recovered);
    }, 0);
    
    // 计算总排放量（tCO2）
    return (retiredEmission + repairEmission) * SF6_GWP * 0.001;
  };
  
  // 添加退役设备
  const addRetiredDevice = useCallback(() => {
    setRetiredDevices(prevDevices => [...prevDevices, {
      id: generateId(),
      capacity: '',
      recovered: '',
      proof: ''
    }]);
  }, []);
  
  // 删除退役设备
  const removeRetiredDevice = useCallback((id) => {
    setRetiredDevices(prevDevices => prevDevices.filter(device => device.id !== id));
  }, []);
  
  // 更新退役设备信息
  const updateRetiredDevice = useCallback((id, field, value) => {
    setRetiredDevices(prevDevices => prevDevices.map(device => 
      device.id === id ? { ...device, [field]: value } : device
    ));
  }, []);
  
  // 添加修理设备
  const addRepairDevice = useCallback(() => {
    setRepairDevices(prevDevices => [...prevDevices, {
      id: generateId(),
      capacity: '',
      recovered: '',
      proof: ''
    }]);
  }, []);
  
  // 删除修理设备
  const removeRepairDevice = useCallback((id) => {
    setRepairDevices(prevDevices => prevDevices.filter(device => device.id !== id));
  }, []);
  
  // 更新修理设备信息
  const updateRepairDevice = useCallback((id, field, value) => {
    setRepairDevices(prevDevices => prevDevices.map(device => 
      device.id === id ? { ...device, [field]: value } : device
    ));
  }, []);
  
  // 保存上一次排放量的引用
  const previousEmissionRef = React.useRef(totalEmission);
  
  // 监听设备变化，自动计算排放量
  React.useEffect(() => {
    const emission = calculateTotalEmission();
    
    // 只有当排放量实际变化时才更新状态和父组件
    if (emission !== previousEmissionRef.current) {
      setTotalEmission(emission);
      previousEmissionRef.current = emission;
      
      // 回调更新父组件
      if (onEmissionChange) {
        onEmissionChange({
          totalEmission: emission,
          retiredDevices,
          repairDevices
        });
      }
    }
  }, [retiredDevices, repairDevices, onEmissionChange]);
  
  return (
    <div className="sulfur-hexafluoride-emission">
      <h3>使用六氟化硫设备修理与退役过程产生的排放</h3>

      <div className="calculation-description" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
            <h3 style={{ marginBottom: '16px' }}>六氟化硫排放计算说明</h3>
            <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', lineHeight: '1.6' }}>
            <p>六氟化硫排放计算方法：总排放量（tCO₂） = (所有设备(设备容量 - 实际回收量)之和) × GWP × 0.001</p>
            <p>- 设备容量和实际回收量单位为千克（kg）</p>
            <p>- 六氟化硫的全球变暖潜能值（GWP）为23900</p>
            <p>- 0.001为单位转换系数（将千克转换为吨）</p>
            <p>- 总排放量单位为吨二氧化碳当量（tCO₂），保留两位小数</p>
            <p>- 设备证明材料中请提供铭牌</p>
            </div>
        </div>

        {/* 排放量汇总 */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        border: '2px solid #4CAF50', 
        borderRadius: '8px', 
        textAlign: 'center' 
      }}>
        <h3 style={{ marginBottom: '15px', color: '#4CAF50' }}>排放量汇总</h3>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          使用六氟化硫设备修理与退役过程产生的排放总量：
          <span style={{ color: '#1890ff', marginLeft: '10px' }}>
            {totalEmission.toFixed(2)} tCO2
          </span>
        </div>
      </div>

      {/* 修理设备部分 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
        <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>修理设备</h4>
        
        <button 
          onClick={addRepairDevice}
          style={{
            padding: '6px 12px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          添加修理设备
        </button>
        
        {repairDevices.length > 0 ? (
          <div>
            {repairDevices.map((device, index) => (
              <div 
                key={device.id} 
                style={{
                  marginBottom: '15px',
                  padding: '15px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h5>设备 {index + 1}</h5>
                  <button
                    onClick={() => removeRepairDevice(device.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>设备容量（千克）</label>
                    <input
                      type="number"
                      value={device.capacity}
                      onChange={(e) => updateRepairDevice(device.id, 'capacity', e.target.value)}
                      placeholder="请输入设备容量"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>实际回收量（千克）</label>
                    <input
                      type="number"
                      value={device.recovered}
                      onChange={(e) => updateRepairDevice(device.id, 'recovered', e.target.value)}
                      placeholder="请输入实际回收量"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>设备排放量 (tCO₂)</label>
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#e6f7ff',
                      border: '1px solid #91d5ff',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {device.capacity && device.recovered 
                        ? ((parseFloat(device.capacity) - parseFloat(device.recovered)) * 0.001 * SF6_GWP).toFixed(2)
                        : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>证明材料</label>
                    <input
                      type="file"
                      onChange={(e) => updateRepairDevice(device.id, 'proof', e.target.files[0]?.name || '')}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    />
                    {device.proof && (
                      <div style={{ marginTop: '5px', color: '#1890ff', fontSize: '12px' }}>
                        已选择: {device.proof}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '20px' }}>
            暂无修理设备，请点击添加按钮
          </div>
        )}
      </div>
      
      {/* 退役设备部分 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
        <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>退役设备</h4>
        
        <button 
          onClick={addRetiredDevice}
          style={{
            padding: '6px 12px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          添加退役设备
        </button>
        
        {retiredDevices.length > 0 ? (
          <div>
            {retiredDevices.map((device, index) => (
              <div 
                key={device.id} 
                style={{
                  marginBottom: '15px',
                  padding: '15px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h5>设备 {index + 1}</h5>
                  <button
                    onClick={() => removeRetiredDevice(device.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>设备容量（千克）</label>
                    <input
                      type="number"
                      value={device.capacity}
                      onChange={(e) => updateRetiredDevice(device.id, 'capacity', e.target.value)}
                      placeholder="请输入设备容量"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>实际回收量（千克）</label>
                    <input
                      type="number"
                      value={device.recovered}
                      onChange={(e) => updateRetiredDevice(device.id, 'recovered', e.target.value)}
                      placeholder="请输入实际回收量"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>设备排放量 (tCO₂)</label>
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#e6f7ff',
                      border: '1px solid #91d5ff',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {device.capacity && device.recovered 
                        ? ((parseFloat(device.capacity) - parseFloat(device.recovered)) * 0.001 * SF6_GWP).toFixed(2)
                        : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>证明材料</label>
                    <input
                      type="file"
                      onChange={(e) => updateRetiredDevice(device.id, 'proof', e.target.files[0]?.name || '')}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    />
                    {device.proof && (
                      <div style={{ marginTop: '5px', color: '#1890ff', fontSize: '12px' }}>
                        已选择: {device.proof}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '20px' }}>
            暂无退役设备，请点击添加按钮
          </div>
        )}
      </div>
    
    </div>
  );
};

export default SulfurHexafluorideEmission;