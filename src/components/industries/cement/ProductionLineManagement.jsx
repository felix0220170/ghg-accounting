import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, Upload, Form, Space, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { InboxOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Dragger } = Upload;

// 移除了基础非碳酸盐替代材料数组，替代燃料种类现在使用文本输入

// 基础熟料类别
const BASE_CLINKER_TYPES = [
  { value: '硅酸盐水泥熟料', label: '硅酸盐水泥熟料', emissionFactor: 0.500 },
  { value: '白色硅酸盐水泥熟料', label: '白色硅酸盐水泥熟料', emissionFactor: 0.500 },
  { value: '铝酸盐水泥熟料', label: '铝酸盐水泥熟料', emissionFactor: 0.500 },
  { value: '硫（铁）铝酸盐水泥熟料', label: '硫（铁）铝酸盐水泥熟料', emissionFactor: 0.500 }
];

// 基础熟料品种
const BASE_CLINKER_VARIETIES = {
  '硅酸盐水泥熟料': [
    '通用水泥熟料',
    '低碱通用水泥熟料',
    '中抗硫酸盐水泥熟料',
    '高抗硫酸盐水泥熟料',
    '中热水泥熟料',
    '低热水泥熟料',
    '道路硅酸盐水泥熟料',
    '油井水泥熟料',
    '核电工程用硅酸盐水泥熟料'
  ],
  '白色硅酸盐水泥熟料': ['白色硅酸盐水泥熟料'],
  '铝酸盐水泥熟料': ['铝酸盐水泥熟料'],
  '硫（铁）铝酸盐水泥熟料': ['硫铝酸盐水泥熟料', '铁铝酸盐水泥熟料']
};

// ProductionLine数据结构:
// {
//   id: string,
//   name: string, // 生产线名称
//   designCapacity: string, // 批复的设计能力（t/d）
//   kilnSpec: string, // 窑规格（Q*L）（m）
//   clinkerType: string, // 熟料类别
//   clinkerVariety: string, // 熟料品种
//   isCalciumCarbideSludgeMainMaterial: boolean, // 批复的以电石渣为主要原料的生产线
//   alternativeFuelCapacity: string, // 批复的替代燃料处理能力
//   alternativeFuelTypes: string, // 批复的替代燃料种类（文本）
//   coordinatedDisposalCapacity: string, // 批复的协调处置能力
//   coordinatedDisposalTypes: string, // 批复的协调处置废物种类
//   supportingMaterials: { [key: string]: string[] } // 支撑材料
// }

// CustomClinkerType数据结构:
// {
//   value: string,
//   label: string,
//   emissionFactor: number
// }

const ProductionLineManagement = ({ productionLines, onProductionLinesChange }) => {
  const [customClinkerTypes, setCustomClinkerTypes] = useState([]);
  const [customClinkerVarieties, setCustomClinkerVarieties] = useState({});
  const [editingLine, setEditingLine] = useState(null);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newCustomTypeName, setNewCustomTypeName] = useState('');
  const [newCustomTypeEmissionFactor, setNewCustomTypeEmissionFactor] = useState('');
  
  // 直接使用从父组件传入的生产线数据
  const [currentProductionLines, setCurrentProductionLines] = useState(productionLines || []);

  // 当父组件传入的productionLines属性变化时，更新组件内部状态
  useEffect(() => {
    if (productionLines) {
      setCurrentProductionLines(productionLines);
    }
  }, [productionLines]);

  // 获取所有熟料类别（包含自定义）
  const getAllClinkerTypes = () => {
    return [...BASE_CLINKER_TYPES, ...customClinkerTypes];
  };

  // 获取特定熟料类别的所有品种（包含自定义）
  const getClinkerVarietiesByType = (type) => {
    const baseVarieties = BASE_CLINKER_VARIETIES[type] || [];
    const customVarieties = customClinkerVarieties[type] || [];
    return [...baseVarieties, ...customVarieties];
  };

  // 添加新的生产线
      const handleAddProductionLine = () => {
        const newLine = {
          id: Date.now().toString(),
          name: '',
          designCapacity: '',
          kilnSpec: '',
          clinkerType: '',
          clinkerVariety: '',
          isCalciumCarbideSludgeMainMaterial: false,
          alternativeFuelCapacity: '',
          alternativeFuelTypes: '',
          coordinatedDisposalCapacity: '',
          coordinatedDisposalTypes: '',
          supportingMaterials: {}
        };
        setEditingLine(newLine);
      };

  // 编辑生产线
  const handleEditProductionLine = (line) => {
    setEditingLine({ ...line });
  };

  // 删除生产线
  const handleDeleteProductionLine = (id) => {
    if (window.confirm('确定要删除这条生产线吗？')) {
      const updatedLines = currentProductionLines.filter(line => line.id !== id);
      setCurrentProductionLines(updatedLines);
      onProductionLinesChange(updatedLines);
      message.success('生产线已删除');
    }
  };

  // 保存生产线
      const handleSaveProductionLine = () => {
        if (editingLine) {
          // 移除Ant Design表单的自动验证，直接使用editingLine状态
          // 手动验证所有必填字段
          if (!editingLine.name || editingLine.name.trim() === '') {
            alert('请输入生产线名称');
            return;
          }
          if (!editingLine.designCapacity || editingLine.designCapacity.trim() === '') {
            alert('请输入批复的设计能力');
            return;
          }
          if (!editingLine.kilnSpec || editingLine.kilnSpec.trim() === '') {
            alert('请输入窑规格');
            return;
          }
          if (!editingLine.clinkerType || editingLine.clinkerType.trim() === '') {
            alert('请选择熟料类别');
            return;
          }
          if (!editingLine.clinkerVariety || editingLine.clinkerVariety.trim() === '') {
            alert('请选择熟料品种');
            return;
          }
          
          // 使用editingLine状态直接保存，无需处理values
          const updatedLine = {
            ...editingLine
          };

      let updatedLines;
      if (currentProductionLines.some(line => line.id === editingLine.id)) {
        // 更新现有生产线
        updatedLines = currentProductionLines.map(line => 
          line.id === editingLine.id ? updatedLine : line
        );
      } else {
        // 添加新生产线
        updatedLines = [...currentProductionLines, updatedLine];
      }

      onProductionLinesChange(updatedLines);
      setEditingLine(null);
      alert(editingLine.id === Date.now().toString() ? '生产线添加成功' : '生产线更新成功');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingLine(null);
  };

  // 添加自定义熟料类别
  const handleAddCustomClinkerType = () => {
    if (!newCustomTypeName || !newCustomTypeEmissionFactor) {
      alert('请填写完整的熟料类别信息');
      return;
    }

    const emissionFactor = parseFloat(newCustomTypeEmissionFactor);
    if (isNaN(emissionFactor)) {
      alert('请输入有效的过程排放因子');
      return;
    }

    const newType = {
      value: newCustomTypeName,
      label: newCustomTypeName,
      emissionFactor
    };

    setCustomClinkerTypes([...customClinkerTypes, newType]);
    setCustomClinkerVarieties({ ...customClinkerVarieties, [newCustomTypeName]: [] });
    setNewCustomTypeName('');
    setNewCustomTypeEmissionFactor('');
    setIsAddingCustomType(false);
    alert('自定义熟料类别添加成功');
  };

  // 添加自定义熟料品种
  const handleAddCustomClinkerVariety = (type, variety) => {
    if (!variety) return;
    
    const currentVarieties = customClinkerVarieties[type] || [];
    if (currentVarieties.includes(variety)) {
      message.warning('该品种已存在');
      return;
    }

    setCustomClinkerVarieties({
      ...customClinkerVarieties,
      [type]: [...currentVarieties, variety]
    });
    alert('自定义熟料品种添加成功');
  };

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ fileList }) {
      // 实际项目中这里应该处理文件上传逻辑
      console.log('Files:', fileList);
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  const columns = [
    {
      title: '生产线名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '批复的设计能力（t/d）',
      dataIndex: 'designCapacity',
      key: 'designCapacity',
    },
    {
      title: '窑规格（Q*L）（m）',
      dataIndex: 'kilnSpec',
      key: 'kilnSpec',
    },
    {
      title: '熟料类别',
      dataIndex: 'clinkerType',
      key: 'clinkerType',
    },
    {
      title: '熟料品种',
      dataIndex: 'clinkerVariety',
      key: 'clinkerVariety',
    },
    {
      title: '是否以电石渣为主要原料',
      dataIndex: 'isCalciumCarbideSludgeMainMaterial',
      key: 'isCalciumCarbideSludgeMainMaterial',
      render: (text) => text ? '是' : '否',
    },
    {
      title: '替代燃料处理能力',
      dataIndex: 'alternativeFuelCapacity',
      key: 'alternativeFuelCapacity',
    },
    {title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditProductionLine(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProductionLine(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  // 生产线编辑表单
  const renderProductionLineForm = () => {
    if (!editingLine) return null;

    return (
      <Card title={editingLine.id === Date.now().toString() ? "添加生产线" : "编辑生产线"}>
        <Form
          layout="vertical"
          initialValues={editingLine}
          preserve={false}
        >
          <Form.Item
            name="name"
            label="生产线名称"
          >
            <Input 
              placeholder="请输入生产线的名称标识，例如：1#生产线" 
              value={editingLine.name}
              onChange={(e) => setEditingLine(prev => ({...prev, name: e.target.value}))}
            />
          </Form.Item>
          <Form.Item
            name="designCapacity"
            label="批复的设计能力（t/d）"
          >
            <Input 
              placeholder="填报主管部门的批复产能。若批复的是年产能，则按 310 天折算每日设计能力" 
              value={editingLine.designCapacity}
              onChange={(e) => setEditingLine(prev => ({...prev, designCapacity: e.target.value}))}
            />
          </Form.Item>

          <Form.Item
            name="kilnSpec"
            label="窑规格（Q*L）（m）"
          >
            <Input 
              placeholder="根据生产许可证上的窑规格信息填报，例如通径窑填报格式为 4.8×70" 
              value={editingLine.kilnSpec}
              onChange={(e) => setEditingLine(prev => ({...prev, kilnSpec: e.target.value}))}
            />
          </Form.Item>

          <Form.Item
            name="clinkerType"
            label="熟料类别"
          >
            <Space>
              <Select 
                style={{ width: 240 }} 
                placeholder="选择熟料类别"
                value={editingLine.clinkerType}
                onChange={(value) => {
                  // 更新选择的熟料类别，并明确清空熟料品种
                  setEditingLine(prev => ({
                    ...prev,
                    clinkerType: value,
                    clinkerVariety: '' // 确保熟料品种被清空
                  }));
                }}
                showSearch
                optionFilterProp="children"
                allowClear={false}
              >
                {getAllClinkerTypes().map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
              <Button type="dashed" onClick={() => setIsAddingCustomType(!isAddingCustomType)}>
                {isAddingCustomType ? '取消' : '添加自定义'}
              </Button>
            </Space>
            {isAddingCustomType && (
              <Space style={{ marginTop: 10 }}>
                <Input 
                  placeholder="自定义熟料类别名称" 
                  value={newCustomTypeName}
                  onChange={e => setNewCustomTypeName(e.target.value)}
                />
                <Input 
                  placeholder="过程排放因子（tCO2/t）" 
                  value={newCustomTypeEmissionFactor}
                  onChange={e => setNewCustomTypeEmissionFactor(e.target.value)}
                />
                <Button type="primary" onClick={handleAddCustomClinkerType}>确认添加</Button>
              </Space>
            )}
          </Form.Item>

          <Form.Item
            name="clinkerVariety"
            label="熟料品种"
          >
            <Space>
              <Select 
                style={{ width: 240 }} 
                placeholder="请先选择熟料类别"
                value={editingLine.clinkerVariety}
                onChange={(value) => {
                  setEditingLine(prev => ({
                    ...prev,
                    clinkerVariety: value
                  }));
                }}
                disabled={!editingLine.clinkerType}
                showSearch
                optionFilterProp="children"
                allowClear={false}
              >
                {editingLine.clinkerType ? (
                  getClinkerVarietiesByType(editingLine.clinkerType).length > 0 ? (
                    getClinkerVarietiesByType(editingLine.clinkerType).map(variety => (
                      <Option key={variety} value={variety}>{variety}</Option>
                    ))
                  ) : (
                    <Option value="">暂无品种数据</Option>
                  )
                ) : null}
              </Select>
              <Button 
                type="dashed" 
                onClick={() => {
                  const newVariety = prompt('请输入新的熟料品种名称：');
                  if (newVariety && editingLine.clinkerType) {
                    handleAddCustomClinkerVariety(editingLine.clinkerType, newVariety);
                  } else {
                    message.warning('请先选择熟料类别');
                  }
                }}
                disabled={!editingLine.clinkerType}
              >
                添加自定义
              </Button>
            </Space>
          </Form.Item>

          <Form.Item
            name="isCalciumCarbideSludgeMainMaterial"
            label="批复的以电石渣为主要原料的生产线"
          >
            <Select 
              placeholder="选择是否"
              value={editingLine.isCalciumCarbideSludgeMainMaterial}
              onChange={(value) => setEditingLine(prev => ({...prev, isCalciumCarbideSludgeMainMaterial: value}))}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="alternativeFuelCapacity"
            label="批复的替代燃料处理能力"
          >
            <Input 
              placeholder="根据主管部门批复填报，例如：10万t/a 或 300t/d" 
              value={editingLine.alternativeFuelCapacity}
              onChange={(e) => setEditingLine(prev => ({...prev, alternativeFuelCapacity: e.target.value}))}
            />
          </Form.Item>

          <Form.Item
            name="alternativeFuelTypes"
            label="批复的替代燃料种类"
          >
            <Input 
              placeholder="请输入批复的替代燃料种类，可输入多种以逗号分隔" 
              value={editingLine.alternativeFuelTypes}
              onChange={(e) => setEditingLine(prev => ({...prev, alternativeFuelTypes: e.target.value}))}
            />
          </Form.Item>

          <Form.Item
            name="coordinatedDisposalCapacity"
            label="批复的协调处置能力"
          >
            <Input 
              placeholder="根据主管部门批复填报，例如：50万t/a 或 800t/d" 
              value={editingLine.coordinatedDisposalCapacity}
              onChange={(e) => setEditingLine(prev => ({...prev, coordinatedDisposalCapacity: e.target.value}))}
            />
          </Form.Item>

          <Form.Item
            name="coordinatedDisposalTypes"
            label="批复的协调处置废物种类"
          >
            <Input 
              placeholder="列出批复的协同处置废物的类别" 
              value={editingLine.coordinatedDisposalTypes}
              onChange={(e) => setEditingLine(prev => ({...prev, coordinatedDisposalTypes: e.target.value}))}
            />
          </Form.Item>

          <Form.Item label="支撑材料上传(Demo)">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个或批量上传，请上传与生产线相关的支撑材料证明文件。
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSaveProductionLine}>保存</Button>
              <Button onClick={handleCancelEdit}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  return (
    <Card title="生产线管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddProductionLine}>添加生产线</Button>}>
      {renderProductionLineForm()}
      <Table columns={columns} dataSource={currentProductionLines} rowKey="id" style={{ marginTop: 20 }} />
    </Card>
  );
};

export default ProductionLineManagement;