import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, InputNumber, Input, Select, Button, Card, Typography, Divider, Upload, Modal, Form } from 'antd';
import { PlusOutlined, MinusOutlined, UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

function ClinkerProductionEmission({ onEmissionChange, productionLines, onProductionLinesChange }) {
   
  // 基础熟料类别数据
  const BASE_CLINKER_TYPES = [
    { value: '硅酸盐水泥熟料', label: '硅酸盐水泥熟料', emissionFactor: 0.535 },
    { value: '白色硅酸盐水泥熟料', label: '白色硅酸盐水泥熟料', emissionFactor: 0.550 },
    { value: '硫（铁）铝酸盐水泥熟料', label: '硫（铁）铝酸盐水泥熟料', emissionFactor: 0.413 },
    { value: '铝酸盐水泥熟料', label: '铝酸盐水泥熟料', emissionFactor: 0.292 }
  ];
  
  // 根据熟料类别获取排放因子
  const getEmissionFactorByType = (clinkerType) => {
    if (!clinkerType) return 0;
    const typeData = BASE_CLINKER_TYPES.find(type => type.value === clinkerType);
    return typeData ? typeData.emissionFactor : 0;
  };
    
  // 基础非碳酸盐替代原料数据
  const BASE_NON_CARBONATE_ALTERNATIVE_MATERIALS = [
    { id: 1, name: '脱硫粉剂（氢氧化钙）', deductionFactor: 0.600 },
    { id: 2, name: '熟石灰', deductionFactor: 0.600 },
    { id: 3, name: '电石渣', deductionFactor: 0.480 },
    { id: 4, name: '镁渣', deductionFactor: 0.480 },
    { id: 5, name: '造纸白泥', deductionFactor: 0.375 },
    { id: 6, name: '氟化钙污泥', deductionFactor: 0.375 },
    { id: 7, name: '磷渣', deductionFactor: 0.375 },
    { id: 8, name: '钒钛渣', deductionFactor: 0.305 },
    { id: 9, name: '氮渣', deductionFactor: 0.305 },
    { id: 10, name: '飞灰', deductionFactor: 0.305 },
    { id: 11, name: '铁合金炉渣', deductionFactor: 0.305 },
    { id: 12, name: '脱硫石膏', deductionFactor: 0.245 },
    { id: 13, name: '磷石膏', deductionFactor: 0.245 },
    { id: 14, name: '钛石膏', deductionFactor: 0.245 },
    { id: 15, name: '氟石膏', deductionFactor: 0.245 },
    { id: 16, name: '硼石膏', deductionFactor: 0.245 },
    { id: 17, name: '模型石膏', deductionFactor: 0.245 },
    { id: 18, name: '柠檬酸渣', deductionFactor: 0.245 },
    { id: 19, name: '钢渣', deductionFactor: 0.215 },
    { id: 20, name: '镍渣', deductionFactor: 0.215 },
    { id: 21, name: '锰渣', deductionFactor: 0.135 },
    { id: 22, name: '锌渣', deductionFactor: 0.135 },
    { id: 23, name: '锡渣', deductionFactor: 0.135 },
    { id: 24, name: '市政污泥', deductionFactor: 0.055 },
    { id: 25, name: '铝渣', deductionFactor: 0.055 },
    { id: 26, name: '硫酸渣', deductionFactor: 0.055 },
    { id: 27, name: '铜渣', deductionFactor: 0.055 },
    { id: 28, name: '铅锌渣', deductionFactor: 0.055 },
    { id: 29, name: '粉煤灰', deductionFactor: 0.055 },
    { id: 30, name: '赤泥', deductionFactor: 0.055 }
  ];

  // 获取方式常量
  const ACQUISITION_METHODS = [
    { value: 'DEFAULT', label: '缺省值' },
    { value: 'CALCULATED', label: '计算值' },
    { value: 'MEASURED', label: '实测值' },
    { value: 'ESTIMATED', label: '估算值' }
  ];

  // 月份数组
  const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 初始化月份数据
  const initMonthData = () => {
    const monthData = {};
    MONTHS.forEach(month => {
      monthData[month] = 0;
    });
    return monthData;
  };

  // 确保productionLines是数组
  const safeProductionLines = Array.isArray(productionLines) ? productionLines : [];
  
  // 确保所有关联熟料的生产线都有默认排放因子
  useEffect(() => {
    if (!onProductionLinesChange || !safeProductionLines.length) return;
    
    const updatedLines = safeProductionLines.map(line => {
      // 只处理有关联熟料但没有排放因子数据的生产线
      if (line.clinkerType && (!line.clinkerFactorData || Object.keys(line.clinkerFactorData).length === 0)) {
        const defaultFactor = getEmissionFactorByType(line.clinkerType);
        const initialFactorData = {};
        MONTHS.forEach(month => {
          initialFactorData[month] = defaultFactor;
        });
        return {
          ...line,
          clinkerFactorData: initialFactorData
        };
      }
      return line;
    });
    
    // 检查是否有生产线需要更新
    const hasChanges = updatedLines.some((line, index) => 
      line.clinkerFactorData !== safeProductionLines[index].clinkerFactorData
    );
    
    if (hasChanges) {
      onProductionLinesChange(updatedLines);
    }
  }, [safeProductionLines, onProductionLinesChange, getEmissionFactorByType, MONTHS]);
  
  // 全局自定义物料状态
  const [customMaterials, setCustomMaterials] = useState([]);
  
  // 弹窗状态
  const [customMaterialModalVisible, setCustomMaterialModalVisible] = useState(false);
  
  // 自定义物料表单数据
  const [customMaterialForm] = Form.useForm();
  
  // 移除自定义熟料相关的组合数据
  
  // 组合所有替代原料数据（基础 + 自定义）
  const NON_CARBONATE_ALTERNATIVE_MATERIALS = useMemo(() => {
    return [...BASE_NON_CARBONATE_ALTERNATIVE_MATERIALS, ...customMaterials];
  }, [customMaterials]);

  // 使用一个ref来跟踪上一次发送给父组件的值，避免重复调用
  const lastEmissionRef = useRef(0);

  // 计算表格数据
  const { tableData, totalEmission } = useMemo(() => {
    let tableData = [];
    let totalEmission = 0;

    safeProductionLines.forEach(line => {
      // 处理熟料数据
      if (line.clinkerType) {
        // 初始化月度数据（如果尚未初始化）
        if (!line.clinkerFactorData || Object.keys(line.clinkerFactorData).length === 0) {
          const initialFactorData = {};
          const emissionFactor = getEmissionFactorByType(line.clinkerType);
          MONTHS.forEach(month => {
            initialFactorData[month] = emissionFactor;
          });
          // 这里不直接修改状态，而是在selectClinker中处理
        }

        // 熟料产量行
        const clinkerProductionRow = {
          key: `clinker-production-${line.id}`,
          生产线: line.name,
          信息项: '熟料产量',
          原料名称: line.clinkerType || '',
          单位: 't',
          ...line.clinkerProductionData,
          全年值: 0,
          获取方式: '',
          数据来源: '',
          支撑材料: null
        };

        // 熟料排放因子行
        const clinkerFactorRow = {
          key: `clinker-factor-${line.id}`,
          生产线: '',
          信息项: '熟料的过程排放因子',
          原料名称: line.clinkerType || '',
          单位: 'tCO2/t',
          ...line.clinkerFactorData,
          全年值: 0,
          获取方式: 'DEFAULT',
          数据来源: '',
          支撑材料: null
        };

        // 计算全年值
        clinkerProductionRow.全年值 = MONTHS.reduce((sum, month) => sum + (parseFloat(clinkerProductionRow[month]) || 0), 0);
        // 排放因子不需要计算全年平均，保持原样

        // 添加到表格数据
        tableData.push(clinkerProductionRow, clinkerFactorRow);

        // 处理替代原料数据
        (line.alternativeMaterials || []).forEach((material, materialIndex) => {
          // 初始化月度数据（如果尚未初始化）
          const materialKey = `${line.id}-${materialIndex}`;
          if (!line.materialFactorData || !line.materialFactorData[materialKey]) {
            // 这里不直接修改状态，而是在addAlternativeMaterial中处理
          }

          // 替代原料消耗量行 - 确保所有月份数据都有数字类型的初始值
          const existingData = (line.materialConsumptionData || {})[materialKey] || {};
          const monthData = initMonthData();
          // 合并现有数据，确保所有月份都有值（数字类型）
          MONTHS.forEach(month => {
            if (existingData[month] !== undefined && existingData[month] !== null) {
              monthData[month] = parseFloat(existingData[month]) || 0;
            }
          });
          
          const materialConsumptionRow = {
            key: `material-consumption-${line.id}-${materialIndex}`,
            生产线: '',
            信息项: '非碳酸盐替代原料消耗量',
            原料名称: material.name,
            单位: 't',
            ...monthData,
            全年值: 0,
            获取方式: '',
            数据来源: '',
            支撑材料: null
          };

          // 替代原料扣减系数行
          const materialFactorRow = {
            key: `material-factor-${line.id}-${materialIndex}`,
            生产线: '',
            信息项: '非碳酸盐替代原料的扣减系数',
            原料名称: material.name,
            单位: 'tCO2/t',
            ...((line.materialFactorData || {})[materialKey] || {}),
            全年值: 0,
            获取方式: 'DEFAULT',
            数据来源: '',
            支撑材料: null
          };

          // 计算全年值
          materialConsumptionRow.全年值 = MONTHS.reduce((sum, month) => sum + (parseFloat(materialConsumptionRow[month]) || 0), 0);
          // 扣减系数不需要计算全年平均，保持原样

          // 添加到表格数据
          tableData.push(materialConsumptionRow, materialFactorRow);
        });

        // 计算该生产线的排放量
        let lineEmission = 0;
        const lineSummaryRow = {
          key: `line-summary-${line.id}`,
          生产线: '',
          信息项: '过程排放量',
          原料名称: '',
          单位: 'tCO2',
          ...initMonthData(),
          全年值: 0,
          获取方式: 'CALCULATED',
          数据来源: '',
          支撑材料: null
        };
        
        MONTHS.forEach(month => {
          const production = parseFloat((line.clinkerProductionData || {})[month]) || 0;
          const factor = parseFloat((line.clinkerFactorData || {})[month]) || 0;
          
          let totalDeduction = 0;
          (line.alternativeMaterials || []).forEach((material, materialIndex) => {
            const materialKey = `${line.id}-${materialIndex}`;
            const consumption = parseFloat((line.materialConsumptionData || {})[materialKey]?.[month]) || 0;
            const deductionFactor = parseFloat((line.materialFactorData || {})[materialKey]?.[month]) || 0;
            totalDeduction += consumption * deductionFactor;
          });
          
          // 月度排放量 = 产量 * 排放因子 - 总减排量
          const monthlyEmission = Math.max(0, production * factor - totalDeduction);
          lineSummaryRow[month] = monthlyEmission;
          lineEmission += monthlyEmission;
        });
        
        lineSummaryRow.全年值 = lineEmission;
        tableData.push(lineSummaryRow);
        totalEmission += lineEmission;
      }
    });

    return { tableData, totalEmission };
  }, [safeProductionLines]);
  
  // 使用useEffect更新父组件的总排放量，避免在渲染过程中触发状态更新
  useEffect(() => {
    if (onEmissionChange && totalEmission !== lastEmissionRef.current) {
      lastEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }
  }, [totalEmission, onEmissionChange]);

  // 移除本地的生产线管理函数，由父组件控制

  // 移除熟料选择函数，熟料由生产线本身控制

  // 添加替代原料，通过回调通知父组件
  const addAlternativeMaterial = useCallback((lineId, materialId) => {
    if (!onProductionLinesChange) return;
    
    onProductionLinesChange(safeProductionLines.map(line => {
      if (line.id === lineId) {
        // 在组合的物料列表中查找所选物料
        const selectedMaterial = NON_CARBONATE_ALTERNATIVE_MATERIALS.find(m => m.id === materialId);
        
        // 检查物料是否找到
        if (!selectedMaterial) {
          console.error(`未找到ID为${materialId}的替代原料`);
          return line;
        }
        
        const newAlternativeMaterials = [...(line.alternativeMaterials || []), selectedMaterial];
        const materialIndex = newAlternativeMaterials.length - 1;
        const materialKey = `${lineId}-${materialIndex}`;
        
        // 初始化扣减系数的月度数据（安全地获取deductionFactor）
        const initialFactorData = {};
        const deductionFactor = selectedMaterial.deductionFactor || 0;
        MONTHS.forEach(month => {
          initialFactorData[month] = deductionFactor;
        });
        
        // 初始化消耗量的月度数据
        const initialConsumptionData = initMonthData();
        
        return {
          ...line,
          alternativeMaterials: newAlternativeMaterials,
          materialConsumptionData: {
            ...(line.materialConsumptionData || {}),
            [materialKey]: initialConsumptionData
          },
          materialFactorData: {
            ...(line.materialFactorData || {}),
            [materialKey]: initialFactorData
          }
        };
      }
      return line;
    }));
  }, [NON_CARBONATE_ALTERNATIVE_MATERIALS, safeProductionLines, onProductionLinesChange]); // 更新依赖项

  // 删除替代原料，通过回调通知父组件
  const removeAlternativeMaterial = useCallback((lineId, materialIndex) => {
    if (!onProductionLinesChange) return;
    
    onProductionLinesChange(safeProductionLines.map(line => {
      if (line.id === lineId) {
        const currentMaterials = line.alternativeMaterials || [];
        const newAlternativeMaterials = currentMaterials.filter((_, index) => index !== materialIndex);
        
        // 更新其他原料的索引和数据
        const newMaterialConsumptionData = {};
        const newMaterialFactorData = {};
        
        newAlternativeMaterials.forEach((material, newIndex) => {
          const oldKey = `${lineId}-${newIndex >= materialIndex ? newIndex + 1 : newIndex}`;
          const newKey = `${lineId}-${newIndex}`;
          
          if ((line.materialConsumptionData || {})[oldKey]) {
            newMaterialConsumptionData[newKey] = (line.materialConsumptionData || {})[oldKey];
          }
          if ((line.materialFactorData || {})[oldKey]) {
            newMaterialFactorData[newKey] = (line.materialFactorData || {})[oldKey];
          }
        });
        
        return {
          ...line,
          alternativeMaterials: newAlternativeMaterials,
          materialConsumptionData: newMaterialConsumptionData,
          materialFactorData: newMaterialFactorData
        };
      }
      return line;
    }));
  }, [safeProductionLines, onProductionLinesChange, initMonthData]); // 更新依赖项，添加initMonthData

  // 更新表格数据，通过回调通知父组件
  const updateTableData = useCallback((key, field, value) => {
    if (!onProductionLinesChange) return;
    
    // 提取行信息
    const parts = key.split('-');
    
    onProductionLinesChange(safeProductionLines.map(line => {
      // 处理熟料产量
      if (parts[0] === 'clinker' && parts[1] === 'production' && parseInt(parts[2]) === parseInt(line.id)) {
        return {
          ...line,
          clinkerProductionData: {
            ...(line.clinkerProductionData || {}),
            [field]: value
          }
        };
      }
      
      // 处理熟料排放因子
      if (parts[0] === 'clinker' && parts[1] === 'factor' && parseInt(parts[2]) === parseInt(line.id)) {
        return {
          ...line,
          clinkerFactorData: {
            ...(line.clinkerFactorData || {}),
            [field]: value
          }
        };
      }
      
      // 处理替代原料数据
      if (parts[0] === 'material') {
        const lineId = parseInt(parts[2]);
        const materialIndex = parseInt(parts[3]);
        
        if (lineId === parseInt(line.id) && materialIndex >= 0 && materialIndex < ((line.alternativeMaterials || []).length || 0)) {
          const materialKey = `${lineId}-${materialIndex}`;
          
          // 处理替代原料消耗量
          if (parts[1] === 'consumption') {
            // 确保value是数字类型，避免非数字值导致问题
            const numericValue = value === undefined || value === null || value === '' ? 0 : parseFloat(value) || 0;
            return {
              ...line,
              materialConsumptionData: {
                ...(line.materialConsumptionData || {}),
                [materialKey]: {
                  ...((line.materialConsumptionData || {})[materialKey] || {}), // 不使用initMonthData避免覆盖已有数据
                  [field]: numericValue
                }
              }
            };
          }
          
          // 处理替代原料扣减系数
          if (parts[1] === 'factor') {
            return {
              ...line,
              materialFactorData: {
                ...(line.materialFactorData || {}),
                [materialKey]: {
                  ...((line.materialFactorData || {})[materialKey] || {}),
                  [field]: value
                }
              }
            };
          }
        }
      }
      
      return line;
    }));
  }, [safeProductionLines, onProductionLinesChange]); // 更新依赖项

  // 定义表格列
  const columns = [
    {
      title: '生产线',
      dataIndex: '生产线',
      key: '生产线',
      width: 100
    },
    {
      title: '信息项',
      dataIndex: '信息项',
      key: '信息项',
      width: 180
    },
    {
      title: '原料/熟料名称',
      dataIndex: '原料名称',
      key: '原料名称',
      width: 150
    },
    {
      title: '单位',
      dataIndex: '单位',
      key: '单位',
      width: 100
    },
    // 月份列
    ...MONTHS.map(month => ({
      title: month,
      dataIndex: month,
      key: month,
      width: 80,
      render: (text, record) => {
        // 对于汇总行，显示两位小数
        if (record.信息项 === '过程排放量') {
          return <Text>{typeof text === 'number' ? text.toFixed(2) : text || '0.00'}</Text>;
        }
        
        return (
          <InputNumber
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            value={text}
            onChange={(value) => updateTableData(record.key, month, value)}
          />
        );
      }
    })),
    {
      title: '全年值',
      dataIndex: '全年值',
      key: '全年值',
      width: 100,
      render: (text, record) => {
        // 熟料产量、非碳酸盐替代原料消耗量和过程排放量保留两位小数
        if (record.信息项 === '熟料产量' || 
            record.信息项 === '非碳酸盐替代原料消耗量' || 
            record.信息项 === '过程排放量') {
          return <Text>{typeof text === 'number' ? text.toFixed(2) : text || '0.00'}</Text>;
        }
        return <Text>{typeof text === 'number' ? text.toFixed(3) : text || '0.000'}</Text>;
      }
    },
    {
      title: '获取方式',
      dataIndex: '获取方式',
      key: '获取方式',
      width: 100,
      render: (text) => {
        if (!text) return null;
        const method = ACQUISITION_METHODS.find(m => m.value === text);
        return method ? method.label : text;
      }
    },
    {
      title: '数据来源',
      dataIndex: '数据来源',
      key: '数据来源',
      width: 150,
      render: (text, record) => {
        // 对于汇总行，不允许编辑
        if (record.信息项 === '过程排放量') {
          return null;
        }
        
        return (
          <Input
            value={text}
            onChange={(e) => updateTableData(record.key, '数据来源', e.target.value)}
          />
        );
      }
    },
    {
      title: '支撑材料',
      dataIndex: '支撑材料',
      key: '支撑材料',
      width: 120,
      render: (_, record) => {
        // 对于汇总行，不显示上传控件
        if (record.信息项 === '过程排放量') {
          return null;
        }
        
        return <input type="file" style={{ width: '100%' }} />;
      }
    }
  ];

  return (
    <Card title="熟料生产过程排放量">
      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
        <p><strong>计算公式：</strong></p>
        <p>CO2排放量 = 熟料产量 × 熟料基准排放因子 - Σ(替代原料消耗量 × 替代原料扣减系数)</p>
        <p><strong>单位说明：</strong></p>
        <p>- 熟料产量：t</p>
        <p>- 熟料基准排放因子：tCO2/t熟料</p>
        <p>- 替代原料消耗量：t</p>
        <p>- 替代原料扣减系数：tCO2/t</p>
      </div>
      
      {/* 生产线信息区域 */}
      <div style={{ marginBottom: 20 }}>
        <Title level={5}>生产线配置</Title>
        {safeProductionLines.map((line) => (
          <div key={line.id} style={{ marginBottom: 20, padding: 10, border: '1px solid #d9d9d9', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ marginRight: 10, fontWeight: 'bold' }}>
                {line.name}
              </div>
              
              {/* 显示生产线关联的熟料信息 */}
              {line.clinkerType && (
                <div style={{ marginRight: 20, color: '#1890ff' }}>
                  关联熟料: {line.clinkerType} {line.clinkerVariety && `(${line.clinkerVariety})`} (排放因子: {getEmissionFactorByType(line.clinkerType)})
                </div>
              )}
              {!line.clinkerType && (
                <div style={{ marginRight: 20, color: '#ff4d4f' }}>
                  未关联熟料
                </div>
              )}
            </div>
            
            {/* 替代原料配置 */}
            {line.clinkerType && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ marginRight: 10 }}>添加替代原料：</span>
                  <Select
                    style={{ width: 300, marginRight: 10 }}
                    placeholder="请选择替代原料"
                    onChange={(value) => addAlternativeMaterial(line.id, value)}
                  >
                    {NON_CARBONATE_ALTERNATIVE_MATERIALS.map(material => (
                      <Option key={material.id} value={material.id}>
                        {material.name} {material.deductionFactor && `(扣减系数: ${material.deductionFactor})`}
                      </Option>
                    ))}
                  </Select>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => setCustomMaterialModalVisible(true)}
                  >
                    添加自定义替代原料
                  </Button>
                </div>
                
                {/* 已添加的替代原料 */}
                {line.alternativeMaterials && line.alternativeMaterials.length > 0 && (
                  <div>
                    <span>已添加的替代原料：</span>
                    {line.alternativeMaterials.map((material, materialIndex) => (
                      <span key={materialIndex} style={{ marginRight: 10 }}>
                        {material.name}
                        <Button
                          type="text"
                          danger
                          size="small"
                          onClick={() => removeAlternativeMaterial(line.id, materialIndex)}
                        >
                          删除
                        </Button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* 移除添加生产线按钮，由父组件管理生产线添加和删除 */}
      </div>
      
      {/* 移除自定义熟料添加弹窗 */}
      
      {/* 自定义替代原料添加弹窗 */}
      <Modal
        title="添加自定义替代原料"
        open={customMaterialModalVisible}
        onCancel={() => {
          setCustomMaterialModalVisible(false);
          customMaterialForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCustomMaterialModalVisible(false);
            customMaterialForm.resetFields();
          }}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => {
              customMaterialForm.validateFields()
                .then(values => {
                  const newMaterial = {
                    id: Date.now(), // 使用时间戳作为唯一ID
                    name: values.name,
                    deductionFactor: parseFloat(values.deductionFactor)
                  };
                  setCustomMaterials(prev => [...prev, newMaterial]);
                  setCustomMaterialModalVisible(false);
                  customMaterialForm.resetFields();
                })
                .catch(info => {
                  console.log('表单验证失败:', info);
                });
            }}
          >
            确定
          </Button>
        ]}
      >
        <Form form={customMaterialForm} layout="vertical">
          <Form.Item 
            label="替代原料名称" 
            name="name" 
            rules={[{ required: true, message: '请输入替代原料名称' }]}
          >
            <Input placeholder="请输入替代原料名称" />
          </Form.Item>
          <Form.Item 
            label="扣减系数 (tCO2/t)" 
            name="deductionFactor" 
            rules={[
              { required: true, message: '请输入扣减系数' },
              { type: 'number', min: 0, message: '扣减系数必须大于等于0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入扣减系数" 
              step={0.001} 
              min={0}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <Divider />
      
      {/* 数据表格 */}
      <Title level={5}>数据表格</Title>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
      
      <Divider />
      
      {/* 总排放量显示 */}
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Text strong style={{ fontSize: 18 }}>
          熟料生产过程总CO2排放量: {totalEmission.toFixed(3)} tCO2
        </Text>
      </div>
    </Card>
  );
}

export default ClinkerProductionEmission;