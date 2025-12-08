import React, { useState } from 'react';

//自定义碳酸盐表单
const CustomCarbonateDecompositionForm = ({ onAddCustomMaterial, name }) => {
  const [formData, setFormData] = useState({
    name: '',
    emissionFactor: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddCustomMaterial(formData);
    // 重置表单
    setFormData({
      name: '',
      emissionFactor: ''
    });
  };

  return (
    <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
      <h4 style={{ marginBottom: '15px' }}>添加自定义{name}</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>名称:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>排放因子 (tCO₂/t):</label>
            <input
              type="number"
              step="0.001"
              value={formData.emissionFactor}
              onChange={(e) => setFormData({ ...formData, emissionFactor: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
        <button type="submit" style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>添加材料</button>
      </form>
    </div>
  );
};

export default CustomCarbonateDecompositionForm;