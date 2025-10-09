import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table } from 'antd';

function CarbonationAbsorptionEmission({ onEmissionChange, industry }) {
  // 从CarbonateEmission.jsx获取的碳酸盐数据（这里直接复制过来，实际项目中可以考虑抽离到单独的配置文件）
  const defaultCarbonates = [
    { id: 1, name: '碳酸钙 (CaCO₃) - 俗称：石灰石', formula: 'CaCO₃', emissionFactor: 0.4397 },
    { id: 2, name: '碳酸镁 (MgCO₃) - 俗称：菱镁矿', formula: 'MgCO₃', emissionFactor: 0.5220 },
    { id: 3, name: '碳酸钠 (Na₂CO₃) - 俗称：纯碱、苏打', formula: 'Na₂CO₃', emissionFactor: 0.4149 },
    { id: 4, name: '碳酸氢钠 (NaHCO₃) - 俗称：小苏打', formula: 'NaHCO₃', emissionFactor: 0.5237 },
    { id: 5, name: '碳酸亚铁 (FeCO₃) - 俗称：菱铁矿', formula: 'FeCO₃', emissionFactor: 0.3799 },
    { id: 6, name: '碳酸锰 (MnCO₃) - 俗称：菱锰矿', formula: 'MnCO₃', emissionFactor: 0.3829 },
    { id: 7, name: '碳酸钡 (BaCO₃) - 俗称：碳酸钡矿', formula: 'BaCO₃', emissionFactor: 0.2230 },
    { id: 8, name: '碳酸锂 (Li₂CO₃) - 俗称：锂矿产品', formula: 'Li₂CO₃', emissionFactor: 0.5955 },
    { id: 9, name: '碳酸钾 (K₂CO₃) - 俗称：钾碱', formula: 'K₂CO₃', emissionFactor: 0.3184 },
    { id: 10, name: '碳酸锶 (SrCO₃) - 俗称：碳酸锶矿', formula: 'SrCO₃', emissionFactor: 0.2980 },
    { id: 11, name: '碳酸镁钙 (CaMg(CO₃)₂) - 俗称：白云石', formula: 'CaMg(CO₃)₂', emissionFactor: 0.4773 },
  ];

  // 固定的三行初始碳化产物数据
  const [fixedCarbonationData, setFixedCarbonationData] = useState([
    {
      id: 1,
      productName: '轻质碳酸钙',
      productMass: '',
      carbonateName: '碳酸钙 (CaCO₃) - 俗称：石灰石',
      carbonateFormula: 'CaCO₃',
      carbonateMassFraction: '',
      emissionFactor: 0.4397,
      co2Emission: 0,
      isFixed: true
    },
    {
      id: 2,
      productName: '轻质碳酸镁',
      productMass: '',
      carbonateName: '碳酸镁 (MgCO₃) - 俗称：菱镁矿',
      carbonateFormula: 'MgCO₃',
      carbonateMassFraction: '',
      emissionFactor: 0.5220,
      co2Emission: 0,
      isFixed: true
    },
    {
      id: 3,
      productName: '碳酸钡',
      productMass: '',
      carbonateName: '碳酸钡 (BaCO₃) - 俗称：碳酸钡矿',
      carbonateFormula: 'BaCO₃',
      carbonateMassFraction: '',
      emissionFactor: 0.2230,
      co2Emission: 0,
      isFixed: true
    }
  ]);

  // 用户自定义的碳化产物数据
  const [customCarbonationData, setCustomCarbonationData] = useState([]);

  // 计算单个产品的CO2吸收量
  const calculateSingleEmission = useCallback((row) => {
    const productMass = parseFloat(row.productMass) || 0;
    const massFraction = parseFloat(row.carbonateMassFraction) || 0;
    const emissionFactor = row.emissionFactor || 0;
    
    // 确保质量分数在0-1范围内
    const normalizedMassFraction = Math.min(1, Math.max(0, massFraction));
    
    // CO2吸收量 = 碳化产物质量 × 碳酸盐质量分数 × 排放因子
    return productMass * normalizedMassFraction * emissionFactor;
  }, []);

  // 处理固定行输入变化
  const handleFixedInputChange = useCallback((id, field, value) => {
    setFixedCarbonationData(prevData => {
      return prevData.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          // 重新计算CO2吸收量
          updatedRow.co2Emission = calculateSingleEmission(updatedRow);
          return updatedRow;
        }
        return row;
      });
    });
  }, [calculateSingleEmission]);

  // 处理自定义行输入变化
  const handleCustomInputChange = useCallback((index, field, value) => {
    setCustomCarbonationData(prevData => {
      const updated = [...prevData];
      
      // 如果更改的是碳酸盐选择
      if (field === 'selectedCarbonate') {
        if (value === 'custom') {
          // 选择自定义碳酸盐时，排放因子清空让用户输入
          updated[index] = {
            ...updated[index],
            selectedCarbonate: value,
            carbonateName: '',
            carbonateFormula: '',
            emissionFactor: ''
          };
        } else {
          // 从预设列表中选择碳酸盐时，自动填充相关信息
          const selectedCarbonate = defaultCarbonates.find(c => c.id === parseInt(value));
          if (selectedCarbonate) {
            updated[index] = {
              ...updated[index],
              selectedCarbonate: value,
              carbonateName: selectedCarbonate.name,
              carbonateFormula: selectedCarbonate.formula,
              emissionFactor: selectedCarbonate.emissionFactor
            };
          }
        }
      } else if (field === 'emissionFactor' && updated[index].selectedCarbonate === 'custom') {
        // 自定义碳酸盐时，用户输入排放因子
        updated[index] = { ...updated[index], emissionFactor: parseFloat(value) || 0 };
      } else {
        // 其他字段更新
        updated[index] = { ...updated[index], [field]: value };
      }
      
      // 重新计算CO2吸收量
      updated[index].co2Emission = calculateSingleEmission(updated[index]);
      return updated;
    });
  }, [calculateSingleEmission]);

  // 添加新的自定义行
  const addCustomRow = useCallback(() => {
    setCustomCarbonationData(prev => [
      ...prev,
      {
        id: Date.now(), // 使用时间戳作为唯一ID
        productName: '',
        productMass: '',
        selectedCarbonate: '',
        carbonateName: '',
        carbonateFormula: '',
        carbonateMassFraction: '',
        emissionFactor: 0,
        co2Emission: 0,
        isFixed: false
      }
    ]);
  }, []);

  // 删除自定义行
  const removeCustomRow = useCallback((index) => {
    setCustomCarbonationData(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 计算总CO2吸收量
  const totalEmission = useMemo(() => {
    const fixedTotal = fixedCarbonationData.reduce((total, row) => total + row.co2Emission, 0);
    const customTotal = customCarbonationData.reduce((total, row) => total + row.co2Emission, 0);
    return fixedTotal + customTotal;
  }, [fixedCarbonationData, customCarbonationData]);

  // 当总排放量变化时，通知父组件
  useEffect(() => {
    if (onEmissionChange) {
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);

  // 合并固定行和自定义行数据用于显示
  const combinedData = useMemo(() => {
    return [...fixedCarbonationData, ...customCarbonationData];
  }, [fixedCarbonationData, customCarbonationData]);

  // 表格列配置
  const columns = [
    {
      title: '碳化产物',
      dataIndex: 'productName',
      key: 'productName',
      render: (text, record) => {
        if (record.isFixed) {
          return <span>{text}</span>;
        }
        return (
          <input
            type="text"
            value={text}
            onChange={(e) => handleCustomInputChange(record.index, 'productName', e.target.value)}
            style={{ width: '100%', padding: '4px' }}
            placeholder="请输入碳化产物名称"
          />
        );
      }
    },
    {
      title: '碳化产物的质量（吨）',
      dataIndex: 'productMass',
      key: 'productMass',
      render: (text, record) => {
        if (record.isFixed) {
          return (
            <input
              type="number"
              min="0"
              step="0.01"
              value={text}
              onChange={(e) => handleFixedInputChange(record.id, 'productMass', e.target.value)}
              style={{ width: '100%', padding: '4px' }}
              placeholder="请输入"
            />
          );
        }
        return (
          <input
            type="number"
            min="0"
            step="0.01"
            value={text}
            onChange={(e) => handleCustomInputChange(record.index, 'productMass', e.target.value)}
            style={{ width: '100%', padding: '4px' }}
            placeholder="请输入"
          />
        );
      }
    },
    {
      title: '碳酸盐种类',
      dataIndex: 'carbonateName',
      key: 'carbonateName',
      render: (text, record) => {
        if (record.isFixed) {
          return <span>{text}</span>;
        }
        return (
          <select
            value={record.selectedCarbonate}
            onChange={(e) => handleCustomInputChange(record.index, 'selectedCarbonate', e.target.value)}
            style={{ width: '100%', padding: '4px' }}
          >
            <option value="">请选择碳酸盐</option>
            {defaultCarbonates.map(carbonate => (
              <option key={carbonate.id} value={carbonate.id}>{carbonate.name}</option>
            ))}
            <option value="custom">自定义碳酸盐</option>
          </select>
        );
      }
    },
    {
      title: '自定义碳酸盐名称（仅自定义时填写）',
      dataIndex: 'customCarbonateName',
      key: 'customCarbonateName',
      render: (_, record) => {
        if (record.isFixed || record.selectedCarbonate !== 'custom') {
          return null;
        }
        return (
          <input
            type="text"
            value={record.carbonateName}
            onChange={(e) => handleCustomInputChange(record.index, 'carbonateName', e.target.value)}
            style={{ width: '100%', padding: '4px' }}
            placeholder="请输入自定义碳酸盐名称"
          />
        );
      }
    },
    {
      title: '碳酸盐的质量分数',
      dataIndex: 'carbonateMassFraction',
      key: 'carbonateMassFraction',
      render: (text, record) => {
        if (record.isFixed) {
          return (
            <input
              type="number"
              min="0"
              max="1"
              step="0.001"
              value={text}
              onChange={(e) => handleFixedInputChange(record.id, 'carbonateMassFraction', e.target.value)}
              style={{ width: '100%', padding: '4px' }}
              placeholder="0-1之间"
            />
          );
        }
        return (
          <input
            type="number"
            min="0"
            max="1"
            step="0.001"
            value={text}
            onChange={(e) => handleCustomInputChange(record.index, 'carbonateMassFraction', e.target.value)}
            style={{ width: '100%', padding: '4px' }}
            placeholder="0-1之间"
          />
        );
      }
    },
    {
      title: '碳酸盐的排放因子（吨 CO2/吨碳酸盐）',
      dataIndex: 'emissionFactor',
      key: 'emissionFactor',
      render: (value, record) => {
        if (record.isFixed) {
          return <span>{value.toFixed(4)}</span>;
        }
        if (record.selectedCarbonate === 'custom') {
          return (
            <input
              type="number"
              min="0"
              step="0.0001"
              value={value}
              onChange={(e) => handleCustomInputChange(record.index, 'emissionFactor', e.target.value)}
              style={{ width: '100%', padding: '4px' }}
              placeholder="请输入排放因子"
            />
          );
        }
        return <span>{value ? parseFloat(value).toFixed(4) : ''}</span>;
      }
    },
    {
      title: 'CO2 排放量（吨）',
      dataIndex: 'co2Emission',
      key: 'co2Emission',
      render: (value) => <span>{value.toFixed(8)}</span>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        if (!record.isFixed) {
          return (
            <button
              onClick={() => removeCustomRow(record.index)}
              style={{
                padding: '2px 8px',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              删除
            </button>
          );
        }
        return null;
      }
    }
  ];

  // 为自定义行添加index属性，方便操作
  const dataSourceWithIndex = combinedData.map((item, index) => {
    if (!item.isFixed) {
      return { ...item, index: index - fixedCarbonationData.length };
    }
    return item;
  });

  return (
    <div className="carbonation-absorption-emission">
      <div className="calculation-description">
        <p><strong>计算公式：</strong></p>
        <p>CO2吸收量 = 碳化产物质量 × 碳酸盐质量分数 × 排放因子</p>
        <p><strong>单位说明：</strong>碳化产物质量单位为吨，碳酸盐质量分数为0-1之间的小数，排放因子单位为吨CO2/吨碳酸盐。</p>
        <p><strong>证明材料：</strong>请提供企业台帐或统计报表来证明碳化产物的质量以及碳酸盐的质量分数。</p>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={dataSourceWithIndex} 
        pagination={false}
        rowKey="id"
        footer={() => (
          <tr>
            <td colSpan={7} style={{ textAlign: 'right', fontWeight: 'bold' }}>总计：</td>
            <td style={{ fontWeight: 'bold' }}>{totalEmission.toFixed(8)} 吨</td>
          </tr>
        )}
      />
      
      <button
        onClick={addCustomRow}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        添加自定义行
      </button>
    </div>
  );
}

export default CarbonationAbsorptionEmission;