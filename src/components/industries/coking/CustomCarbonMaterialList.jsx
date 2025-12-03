import React from 'react';

const CustomCarbonMaterialList = ({ customCarbonMaterials = [], setCustomCarbonMaterials }) => {
  const handleRemoveMaterial = (materialId) => {
    if (setCustomCarbonMaterials) {
      // 检查setCustomCarbonMaterials是否接受materialId作为直接参数（如removeCustomCarbonMaterial函数）
      // 或者是否接受回调函数（如React setState函数）
      try {
        // 尝试直接调用，这适用于SteelFossilFuelEmission.jsx中的removeCustomCarbonMaterial
        setCustomCarbonMaterials(materialId);
      } catch (e) {
        // 如果失败，则尝试使用回调函数方式，这适用于SteelProcessFossilFuelEmission.jsx
        if (customCarbonMaterials) {
          setCustomCarbonMaterials(customCarbonMaterials.filter(m => m.id !== materialId));
        }
      }
    }
  };

  if (!customCarbonMaterials || customCarbonMaterials.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold' }}>自定义碳材料列表</h4>
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
              <span style={{ marginRight: '8px' }}>类型: {material.type === 'solid' ? '固体' : material.type === 'liquid' ? '液体' : '气体'}</span>
              <span>单位含碳量: {material.receivedBaseCarbonContent} tC/t</span>
            </div>
            <button
              onClick={() => handleRemoveMaterial(material.id)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="删除自定义碳材料"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomCarbonMaterialList;
