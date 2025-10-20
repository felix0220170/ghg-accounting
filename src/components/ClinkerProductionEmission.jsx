import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, InputNumber, Input, Select, Button, Card, Typography, Divider, Upload, Modal, Form } from 'antd';
import { PlusOutlined, MinusOutlined, UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

function ClinkerProductionEmission({ onEmissionChange }) {
  // 基础熟料数据
  const BASE_LINKER_DATA = [
    { id: 1, name: '硅酸盐水泥熟料', emissionFactor: 0.535 },
    { id: 2, name: '白色硅酸盐水泥熟料', emissionFactor: 0.550 },
    { id: 3, name: '硫（铁）铝酸盐水泥熟料', emissionFactor: 0.413 },
    { id: 4, name: '铝酸盐水泥熟料（有过程排放）', emissionFactor: 0.292 }
  ];

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
      monthData[month] = '';
    });
    return monthData;
  };

  // 状态管理
  const [productionLines, setProductionLines] = useState([{
    id: 1,
    name: '生产线1',
    clinker: null,
    clinkerProductionData: initMonthData(),
    clinkerFactorData: {},
    alternativeMaterials: [],
    materialConsumptionData: {},
    materialFactorData: {}
  }]);
  
  // 全局自定义物料状态
  const [customClinkers, setCustomClinkers] = useState([]);
  const [customMaterials, setCustomMaterials] = useState([]);
  
  // 弹窗状态
  const [customClinkerModalVisible, setCustomClinkerModalVisible] = useState(false);
  const [customMaterialModalVisible, setCustomMaterialModalVisible] = useState(false);
  
  // 自定义物料表单数据
  const [customClinkerForm] = Form.useForm();
  const [customMaterialForm] = Form.useForm();
  
  // 组合所有熟料数据（基础 + 自定义）
  const CLINKER_DATA = useMemo(() => {
    return [...BASE_LINKER_DATA, ...customClinkers];
  }, [customClinkers]);
  
  // 组合所有替代原料数据（基础 + 自定义）
  const NON_CARBONATE_ALTERNATIVE_MATERIALS = useMemo(() => {
    return [...BASE_NON_CARBONATE_ALTERNATIVE_MATERIALS, ...customMaterials];
  }, [customMaterials]);

  // 使用一个ref来跟踪上一次发送给父组件的值，避免重复调用
  const lastEmissionRef = useRef(0);

  // 计算表格数据
  const calculateTableData = useMemo(() => {
    let tableData = [];
    let totalEmission = 0;

    productionLines.forEach(line => {
      // 处理熟料数据
      if (line.clinker) {
        // 初始化月度数据（如果尚未初始化）
        if (!line.clinkerFactorData || Object.keys(line.clinkerFactorData).length === 0) {
          const initialFactorData = {};
          MONTHS.forEach(month => {
            initialFactorData[month] = line.clinker.emissionFactor;
          });
          // 这里不直接修改状态，而是在selectClinker中处理
        }

        // 熟料产量行
        const clinkerProductionRow = {
          key: `clinker-production-${line.id}`,
          生产线: line.name,
          信息项: '熟料产量',
          原料名称: line.clinker?.name || '',
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
          原料名称: line.clinker?.name || '',
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
        line.alternativeMaterials.forEach((material, materialIndex) => {
          // 初始化月度数据（如果尚未初始化）
          const materialKey = `${line.id}-${materialIndex}`;
          if (!line.materialFactorData[materialKey]) {
            const initialFactorData = {};
            MONTHS.forEach(month => {
              initialFactorData[month] = material.deductionFactor;
            });
            // 这里不直接修改状态，而是在addAlternativeMaterial中处理
          }

          // 替代原料消耗量行
          const materialConsumptionRow = {
            key: `material-consumption-${line.id}-${materialIndex}`,
            生产线: '',
            信息项: '非碳酸盐替代原料消耗量',
            原料名称: material.name,
            单位: 't',
            ...(line.materialConsumptionData[materialKey] || initMonthData()),
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
            ...(line.materialFactorData[materialKey] || {}),
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
          const production = parseFloat(line.clinkerProductionData[month]) || 0;
          const factor = parseFloat(line.clinkerFactorData[month]) || 0;
          
          let totalDeduction = 0;
          line.alternativeMaterials.forEach((material, materialIndex) => {
            const materialKey = `${line.id}-${materialIndex}`;
            const consumption = parseFloat(line.materialConsumptionData[materialKey]?.[month]) || 0;
            const deductionFactor = parseFloat(line.materialFactorData[materialKey]?.[month]) || 0;
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

    // 更新父组件的总排放量
    if (onEmissionChange && totalEmission !== lastEmissionRef.current) {
      lastEmissionRef.current = totalEmission;
      onEmissionChange(totalEmission);
    }

    return { tableData, totalEmission };
  }, [productionLines, onEmissionChange]);

  // 添加生产线
  const addProductionLine = useCallback(() => {
    setProductionLines(prev => [...prev, {
      id: Date.now(),
      name: `生产线${prev.length + 1}`,
      clinker: null,
      clinkerProductionData: initMonthData(),
      clinkerFactorData: {},
      alternativeMaterials: [],
      materialConsumptionData: {},
      materialFactorData: {}
    }]);
  }, []);

  // 删除生产线
  const removeProductionLine = useCallback((lineId) => {
    setProductionLines(prev => prev.filter(line => line.id !== lineId));
  }, []);

  // 选择熟料
  const selectClinker = useCallback((lineId, clinkerId) => {
    setProductionLines(prev => prev.map(line => {
      if (line.id === lineId) {
        // 在组合的熟料列表中查找所选熟料
        const selectedClinker = CLINKER_DATA.find(c => c.id === clinkerId);
        
        // 检查熟料是否找到
        if (!selectedClinker) {
          console.error(`未找到ID为${clinkerId}的熟料`);
          return line;
        }
        
        // 初始化排放因子的月度数据（安全地获取emissionFactor）
        const initialFactorData = {};
        const emissionFactor = selectedClinker.emissionFactor || 0;
        MONTHS.forEach(month => {
          initialFactorData[month] = emissionFactor;
        });
        
        return { 
          ...line, 
          clinker: selectedClinker,
          clinkerFactorData: initialFactorData
        };
      }
      return line;
    }));
  }, [CLINKER_DATA]); // 添加依赖项，确保函数能获取到最新的熟料列表

  // 添加替代原料
  const addAlternativeMaterial = useCallback((lineId, materialId) => {
    setProductionLines(prev => prev.map(line => {
      if (line.id === lineId) {
        // 在组合的物料列表中查找所选物料
        const selectedMaterial = NON_CARBONATE_ALTERNATIVE_MATERIALS.find(m => m.id === materialId);
        
        // 检查物料是否找到
        if (!selectedMaterial) {
          console.error(`未找到ID为${materialId}的替代原料`);
          return line;
        }
        
        const newAlternativeMaterials = [...line.alternativeMaterials, selectedMaterial];
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
            ...line.materialConsumptionData,
            [materialKey]: initialConsumptionData
          },
          materialFactorData: {
            ...line.materialFactorData,
            [materialKey]: initialFactorData
          }
        };
      }
      return line;
    }));
  }, [NON_CARBONATE_ALTERNATIVE_MATERIALS]); // 添加依赖项，确保函数能获取到最新的物料列表

  // 删除替代原料
  const removeAlternativeMaterial = useCallback((lineId, materialIndex) => {
    setProductionLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const newAlternativeMaterials = line.alternativeMaterials.filter((_, index) => index !== materialIndex);
        
        // 更新其他原料的索引和数据
        const newMaterialConsumptionData = {};
        const newMaterialFactorData = {};
        
        newAlternativeMaterials.forEach((material, newIndex) => {
          const oldKey = `${lineId}-${newIndex >= materialIndex ? newIndex + 1 : newIndex}`;
          const newKey = `${lineId}-${newIndex}`;
          
          if (line.materialConsumptionData[oldKey]) {
            newMaterialConsumptionData[newKey] = line.materialConsumptionData[oldKey];
          }
          if (line.materialFactorData[oldKey]) {
            newMaterialFactorData[newKey] = line.materialFactorData[oldKey];
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
  }, []);

  // 更新表格数据
  const updateTableData = useCallback((key, field, value) => {
    // 提取行信息
    const parts = key.split('-');
    
    setProductionLines(prev => prev.map(line => {
      // 处理熟料产量
      if (parts[0] === 'clinker' && parts[1] === 'production' && parts[2] === line.id.toString()) {
        return {
          ...line,
          clinkerProductionData: {
            ...line.clinkerProductionData,
            [field]: value
          }
        };
      }
      
      // 处理熟料排放因子
      if (parts[0] === 'clinker' && parts[1] === 'factor' && parts[2] === line.id.toString()) {
        return {
          ...line,
          clinkerFactorData: {
            ...line.clinkerFactorData,
            [field]: value
          }
        };
      }
      
      // 处理替代原料数据
      if (parts[0] === 'material') {
        const lineId = parseInt(parts[2]);
        const materialIndex = parseInt(parts[3]);
        
        if (lineId === line.id && materialIndex >= 0 && materialIndex < line.alternativeMaterials.length) {
          const materialKey = `${lineId}-${materialIndex}`;
          
          // 处理替代原料消耗量
          if (parts[1] === 'consumption') {
            return {
              ...line,
              materialConsumptionData: {
                ...line.materialConsumptionData,
                [materialKey]: {
                  ...(line.materialConsumptionData[materialKey] || initMonthData()),
                  [field]: value
                }
              }
            };
          }
          
          // 处理替代原料扣减系数
          if (parts[1] === 'factor') {
            return {
              ...line,
              materialFactorData: {
                ...line.materialFactorData,
                [materialKey]: {
                  ...(line.materialFactorData[materialKey] || {}),
                  [field]: value
                }
              }
            };
          }
        }
      }
      
      return line;
    }));
  }, []);

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
      {/* 生产线管理区域 */}
      <div style={{ marginBottom: 20 }}>
        <Title level={5}>生产线配置</Title>
        {productionLines.map((line, index) => (
          <div key={line.id} style={{ marginBottom: 20, padding: 10, border: '1px solid #d9d9d9', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <Input
                value={line.name}
                onChange={(e) => setProductionLines(prev => prev.map(l => l.id === line.id ? { ...l, name: e.target.value } : l))}
                style={{ width: 150, marginRight: 10 }}
              />
              
              {/* 选择熟料 */}
              <span style={{ marginRight: 10 }}>选择熟料：</span>
              <Select
                style={{ width: 200, marginRight: 10 }}
                placeholder="请选择熟料类型"
                value={line.clinker?.id}
                onChange={(value) => selectClinker(line.id, value)}
              >
                {CLINKER_DATA.map(clinker => (
                  <Option key={clinker.id} value={clinker.id}>
                    {clinker.name} {clinker.emissionFactor && `(排放因子: ${clinker.emissionFactor})`}
                  </Option>
                ))}
              </Select>
              
              {/* 添加自定义熟料按钮 */}
              <Button 
                type="primary" 
                size="small" 
                style={{ marginRight: 10 }}
                onClick={() => setCustomClinkerModalVisible(true)}
              >
                添加自定义熟料
              </Button>
              
              {/* 只允许删除非最后一条生产线 */}
              {productionLines.length > 1 && (
                <Button danger size="small" onClick={() => removeProductionLine(line.id)}>
                  删除生产线
                </Button>
              )}
            </div>
            
            {/* 替代原料配置 */}
            {line.clinker && (
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
                {line.alternativeMaterials.length > 0 && (
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
        
        {/* 添加生产线按钮 */}
        <Button type="primary" onClick={addProductionLine}>
          <PlusOutlined /> 添加生产线
        </Button>
      </div>
      
      {/* 自定义熟料添加弹窗 */}
      <Modal
        title="添加自定义熟料"
        open={customClinkerModalVisible}
        onCancel={() => {
          setCustomClinkerModalVisible(false);
          customClinkerForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCustomClinkerModalVisible(false);
            customClinkerForm.resetFields();
          }}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => {
              customClinkerForm.validateFields()
                .then(values => {
                  const newClinker = {
                    id: Date.now(), // 使用时间戳作为唯一ID
                    name: values.name,
                    emissionFactor: parseFloat(values.emissionFactor)
                  };
                  setCustomClinkers(prev => [...prev, newClinker]);
                  setCustomClinkerModalVisible(false);
                  customClinkerForm.resetFields();
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
        <Form form={customClinkerForm} layout="vertical">
          <Form.Item 
            label="熟料名称" 
            name="name" 
            rules={[{ required: true, message: '请输入熟料名称' }]}
          >
            <Input placeholder="请输入熟料名称" />
          </Form.Item>
          <Form.Item 
            label="过程排放因子 (tCO2/t)" 
            name="emissionFactor" 
            rules={[
              { required: true, message: '请输入排放因子' },
              { type: 'number', min: 0, message: '排放因子必须大于等于0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入排放因子" 
              step={0.001} 
              min={0}
            />
          </Form.Item>
        </Form>
      </Modal>
      
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
        dataSource={calculateTableData.tableData}
        pagination={false}
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
      
      <Divider />
      
      {/* 总排放量显示 */}
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Text strong style={{ fontSize: 18 }}>
          熟料生产过程总CO2排放量: {calculateTableData.totalEmission.toFixed(3)} tCO2
        </Text>
      </div>
    </Card>
  );
}

export default ClinkerProductionEmission;