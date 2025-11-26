import React from 'react';

const CustomFuelList = ({ customFuels = [], setCustomFuels }) => {
  const handleRemoveFuel = (fuelId) => {
    if (setCustomFuels) {
      // 检查setCustomFuels是否接受fuelId作为直接参数（如removeCustomFuel函数）
      // 或者是否接受回调函数（如React setState函数）
      try {
        // 尝试直接调用，这适用于SteelFossilFuelEmission.jsx中的removeCustomFuel
        setCustomFuels(fuelId);
      } catch (e) {
        // 如果失败，则尝试使用回调函数方式，这适用于SteelProcessFossilFuelEmission.jsx
        if (customFuels) {
          setCustomFuels(customFuels.filter(f => f.id !== fuelId));
        }
      }
    }
  };

  if (!customFuels || customFuels.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold' }}>自定义燃料列表</h4>
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
        {customFuels.map((fuel) => (
          <div 
            key={fuel.id} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px',
              marginBottom: '4px',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px',
              border: '1px solid #eee'
            }}
          >
            <div>
              <span style={{ fontWeight: 'bold', marginRight: '12px' }}>{fuel.name}</span>
              <span style={{ marginRight: '8px' }}>类型: {fuel.type === 'solid' ? '固体' : fuel.type === 'liquid' ? '液体' : '气体'}</span>
              <span style={{ marginRight: '8px' }}>低位发热量: {fuel.calorificValue} {fuel.type === 'gas' ? 'GJ/10⁴Nm³' : 'GJ/t'}</span>
              <span>单位热值含碳量: {fuel.carbonContent} tC/GJ</span>
            </div>
            <button
              onClick={() => handleRemoveFuel(fuel.id)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="删除自定义燃料"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomFuelList;