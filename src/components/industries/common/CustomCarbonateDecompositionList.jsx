import React from 'react';

const CustomCarbonateDecompositionList = ({ customCarbonMaterials = [], setCustomCarbonMaterials, name = '碳材料' }) => {
  const handleRemove = (materialId) => {
    if (setCustomCarbonMaterials && customCarbonMaterials) {
        setCustomCarbonMaterials(customCarbonMaterials.filter(m => m.id !== materialId));
    }
  };

  if (!customCarbonMaterials || customCarbonMaterials.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold' }}>{name}列表</h4>
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
        {customCarbonMaterials.map((material) => (
          <div 
            key={material.id} 
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
              <span style={{ fontWeight: 'bold', marginRight: '12px' }}>{material.name}</span>
              <span>排放因子: {material.emissionFactor} tC/t</span>
            </div>
            <button
              onClick={() => handleRemove(material.id)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="删除"
            >
              删除{name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomCarbonateDecompositionList;
