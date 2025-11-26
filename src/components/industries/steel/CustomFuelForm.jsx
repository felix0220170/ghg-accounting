import React, { useState } from 'react';

const CustomFuelForm = ({ onAddCustomFuel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'solid',
    calorificValue: '',
    carbonContent: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddCustomFuel(formData);
    // 重置表单
    setFormData({
      name: '',
      type: 'solid',
      calorificValue: '',
      carbonContent: ''
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
        </div>
        <button type="submit" style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>添加燃料</button>
      </form>
    </div>
  );
};

export default CustomFuelForm;