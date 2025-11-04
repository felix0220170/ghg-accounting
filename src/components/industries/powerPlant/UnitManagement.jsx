import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Table, Modal, message, Select, Collapse, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

// 引入燃料数据
const SOLID_FUELS = [
  { id: 'anthracite', name: '无烟煤', calorificValue: 22.867, carbonContent: 0.02749, type: 'solid' },
  { id: 'bituminous', name: '烟煤', calorificValue: 23.076, carbonContent: 0.02308, type: 'solid' },
  { id: 'lignite', name: '褐煤', calorificValue: 14.759, carbonContent: 0.02797, type: 'solid' },
  { id: 'gangue', name: '煤矸石', calorificValue: 8.374, carbonContent: 0.02541, type: 'solid' },
  { id: 'sludge', name: '煤泥', calorificValue: 12.545, carbonContent: 0.02541, type: 'solid' },
  { id: 'coke', name: '焦炭', calorificValue: 28.435, carbonContent: 0.02942, type: 'solid' },
  { id: 'petroleumCoke', name: '石油焦', calorificValue: 32.500, carbonContent: 0.02750, type: 'solid' }
];

const LIQUID_FUELS = [
  { id: 'crudeOil', name: '原油', calorificValue: 41.816, carbonContent: 0.02008, type: 'liquid', oxidationRate: 98 },
  { id: 'fuelOil', name: '燃料油', calorificValue: 41.816, carbonContent: 0.02110, type: 'liquid', oxidationRate: 98 },
  { id: 'gasoline', name: '汽油', calorificValue: 43.070, carbonContent: 0.01890, type: 'liquid', oxidationRate: 98 },
  { id: 'diesel', name: '柴油', calorificValue: 42.652, carbonContent: 0.02020, type: 'liquid', oxidationRate: 98 },
  { id: 'kerosene', name: '煤油', calorificValue: 43.070, carbonContent: 0.01960, type: 'liquid', oxidationRate: 98 },
  { id: 'lng', name: '液化天然气', calorificValue: 51.498, carbonContent: 0.01720, type: 'liquid', oxidationRate: 98 },
  { id: 'lpg', name: '液化石油气', calorificValue: 50.179, carbonContent: 0.01720, type: 'liquid', oxidationRate: 98 },
  { id: 'coalTar', name: '煤焦油', calorificValue: 33.453, carbonContent: 0.02200, type: 'liquid', oxidationRate: 98 },
  { id: 'refineryGas', name: '炼厂干气', calorificValue: 45.998, carbonContent: 0.01820, type: 'liquid', oxidationRate: 98 }
];

const GAS_FUELS = [
  { id: 'naturalGas', name: '天然气', calorificValue: 389.310, carbonContent: 0.01532, type: 'gas', oxidationRate: 99 },
  { id: 'bfGas', name: '高炉煤气', calorificValue: 33.000, carbonContent: 0.07080, type: 'gas', oxidationRate: 99 },
  { id: 'converterGas', name: '转炉煤气', calorificValue: 84.000, carbonContent: 0.04960, type: 'gas', oxidationRate: 99 },
  { id: 'cokeOvenGas', name: '焦炉煤气', calorificValue: 173.854, carbonContent: 0.01210, type: 'gas', oxidationRate: 99 }
];

// 自定义燃料表单组件
const CustomFuelForm = ({ onAdd }) => {
  const [customForm] = Form.useForm();
  
  // 处理字段变化，实现自动计算
  const handleFieldChange = (changedValues, allValues) => {
    // 如果同时有低位发热量和单位热值含碳量，自动计算收到基元素碳含量
    if (changedValues.calorificValue !== undefined || changedValues.carbonContent !== undefined) {
      if (allValues.calorificValue && allValues.carbonContent) {
        const calculatedCarbonContent = parseFloat(allValues.calorificValue) * parseFloat(allValues.carbonContent);
        customForm.setFieldValue('receivedBaseCarbonContent', calculatedCarbonContent);
      }
    }
    // 如果直接输入收到基元素碳含量，可以选择清空其他两个字段
    if (changedValues.receivedBaseCarbonContent !== undefined) {
      // 这里可以根据需要决定是否清空其他字段
      // customForm.setFieldValue('calorificValue', undefined);
      // customForm.setFieldValue('carbonContent', undefined);
    }
  };
  
  const handleSubmit = () => {
    customForm.validateFields().then(values => {
      // 如果用户输入了收到基元素碳含量但没有输入其他两个值，则只使用收到基元素碳含量
      // 否则使用低位发热量和单位热值含碳量
      const fuelData = {
        id: `custom_${Date.now()}`,
        name: values.name,
        type: values.type,
        receivedBaseCarbonContent: values.receivedBaseCarbonContent ? parseFloat(values.receivedBaseCarbonContent) : undefined,
        oxidationRate: values.oxidationRate ? parseInt(values.oxidationRate) : 98
      };
      
      // 如果用户输入了低位发热量和单位热值含碳量，也保存这些值
      if (values.calorificValue) {
        fuelData.calorificValue = parseFloat(values.calorificValue);
      }
      if (values.carbonContent) {
        fuelData.carbonContent = parseFloat(values.carbonContent);
      }
      
      onAdd(fuelData);
      customForm.resetFields();
    });
  };
  
  return (
    <Form 
      form={customForm} 
      layout="vertical" 
      onFinish={handleSubmit}
      onValuesChange={handleFieldChange}
    >
      <Form.Item label="燃料名称" name="name" rules={[{ required: true, message: '请输入燃料名称' }]}>
        <Input placeholder="请输入燃料名称" />
      </Form.Item>
      <Form.Item label="燃料类型" name="type" rules={[{ required: true, message: '请选择燃料类型' }]}>
        <Select options={[
          { value: 'solid', label: '固体' },
          { value: 'liquid', label: '液体' },
          { value: 'gas', label: '气体' }
        ]} />
      </Form.Item>
      
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ marginBottom: '8px', color: '#666', fontSize: '14px' }}>请选择以下方式之一输入数据：</p>
        
        <Form.Item
          label="低位发热量"
          name="calorificValue"
        >
          <Input type="number" placeholder="请输入低位发热量" />
        </Form.Item>
        
        <Form.Item
          label="单位热值含碳量"
          name="carbonContent"
        >
          <Input type="number" step="0.00001" placeholder="请输入单位热值含碳量" />
        </Form.Item>
        
        <Form.Item
          label="收到基元素碳含量"
          name="receivedBaseCarbonContent"
          tooltip="可自动计算：收到基元素碳含量 = 低位发热量 × 单位热值含碳量"
        >
          <Input type="number" step="0.00001" placeholder="请输入收到基元素碳含量，或输入上方两个值自动计算" />
        </Form.Item>
      </div>
      
      <Form.Item label="氧化率(%)" name="oxidationRate">
        <Input type="number" placeholder="请输入氧化率，默认为98%" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">添加燃料</Button>
      </Form.Item>
    </Form>
  );
};

const UnitManagement = ({ initialUnits = [], onChange }) => {
  const [units, setUnits] = useState(initialUnits);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [form] = Form.useForm();
  const [fuels, setFuels] = useState([
    // 使用文件顶部定义的燃料常量数据
    ...SOLID_FUELS.map(fuel => ({ ...fuel, unit: '吨' })),
    ...LIQUID_FUELS.map(fuel => ({ ...fuel, unit: '吨' })),
    ...GAS_FUELS.map(fuel => ({ ...fuel, unit: '万立方米' })),
  ]); // 存储所有燃料数据，包括自定义燃料
  const [selectedFuelType, setSelectedFuelType] = useState('');
  
  // 机组类型选项
  const unitTypeOptions = [
    { value: 'coal', label: '燃煤机组' },
    { value: 'gas', label: '燃气机组' },
    { value: 'ccpp', label: '燃气蒸汽联合循环发电机组（CCPP）' },
    { value: 'oil', label: '燃油机组' },
    { value: 'igcc', label: '整体煤气化联合循环发电机组（IGCC）' },
    { value: 'other', label: '其他特殊发电机组' }
  ];
  
  // 燃煤机组类别选项
  const coalUnitCategoryOptions = [
    { value: 'conventional', label: '常规燃煤机组' },
    { value: 'unconventional', label: '非常规燃煤机组' }
  ];
  
  // 燃气机组类别选项 - 修改为包含"其他"选项
  const gasUnitCategoryOptions = [
    { value: 'b', label: 'B级' },
    { value: 'e', label: 'E级' },
    { value: 'f', label: 'F级' },
    { value: 'h', label: 'H级' },
    { value: 'distributed', label: '分布式' },
    { value: 'other', label: '其他' }
  ];

  
  // 汽轮机排汽冷却方式选项
  const coolingMethodOptions = [
    { value: 'waterOpen', label: '水冷-开式循环' },
    { value: 'waterClosed', label: '水冷-闭式循环' },
    { value: 'air', label: '空冷' },
    { value: 'hybrid', label: '混合冷却' }
  ];
  
  // 压力参数选项
  const pressureOptions = [
    { value: 'medium', label: '中压' },
    { value: 'high', label: '高压' },
    { value: 'ultraHigh', label: '超高压' },
    { value: 'subcritical', label: '亚临界' },
    { value: 'supercritical', label: '超临界' },
    { value: 'ultraSupercritical', label: '超超临界' }
  ];
  
  // 添加自定义燃料
  const addCustomFuel = (customFuel) => {
    const newFuel = {
      ...customFuel,
      id: `custom_${Date.now()}`
    };
    const newFuels = [...fuels, newFuel];
    setFuels(newFuels);
    
    // 通知父组件燃料数据已更新
    if (onUnitsChange) {
      onUnitsChange(units, newFuels);
    }
  };
  
  // 删除自定义燃料
  const removeCustomFuel = (fuelId) => {
    // 仅允许删除自定义燃料（ID以custom_开头的燃料）
    if (fuelId.startsWith('custom_')) {
      const newFuels = fuels.filter(fuel => fuel.id !== fuelId);
      setFuels(newFuels);
      
      // 通知父组件燃料数据已更新
      if (onUnitsChange) {
        onUnitsChange(units, newFuels);
      }
    }
  };

  // 获取所有燃料列表
  const getAllFuels = () => {
    return fuels;
  };
  
  // 显示添加/编辑机组模态框
  const showModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setSelectedFuelType(unit.fuelType || '');
      
      // 基本字段设置
      const fieldValues = {
        unitName: unit.name,
        fuelType: unit.fuelType,
        fuelNames: unit.fuelNames || [],
        unitCategory: unit.unitCategory,
        capacity: unit.capacity
      };
      
      // 根据机组类型设置不同的字段
      if (unit.fuelType === 'coal') {
        // 燃煤机组特殊属性和设备信息
        fieldValues.isCFB = unit.isCFB;
        fieldValues.equipmentType = unit.equipmentType;
        fieldValues.boilerInfo = unit.boilerInfo;
        fieldValues.turbineInfo = unit.turbineInfo;
        fieldValues.generatorInfo = unit.generatorInfo;
      } else {
        // 非燃煤机组基本信息
        fieldValues.generalInfo = unit.generalInfo;
      }
      
      form.setFieldsValue(fieldValues);
    } else {
      setEditingUnit(null);
      setSelectedFuelType('');
      form.resetFields();
    }
    setIsModalVisible(true);
  };
  
  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUnit(null);
    form.resetFields();
  };
  
  // 提交表单
  const handleSubmit = () => {
    form.validateFields().then(values => {
      let newUnits;
      const unitData = {
        id: editingUnit ? editingUnit.id : Date.now().toString(),
        name: values.unitName,
        fuelType: values.fuelType,
        fuelNames: values.fuelNames || [],
        // 根据机组类型设置不同的类别
        unitCategory: values.unitCategory,
        // 燃煤机组特殊属性
        isCFB: values.isCFB,
        capacity: values.capacity
      };
      
      // 根据机组类型添加对应的信息
      if (values.fuelType === 'coal') {
        // 燃煤机组的设备信息
        unitData.equipmentType = values.equipmentType;
        unitData.boilerInfo = values.boilerInfo;
        unitData.turbineInfo = values.turbineInfo;
        unitData.generatorInfo = values.generatorInfo;
      } else {
        // 非燃煤机组的基本信息
        unitData.generalInfo = values.generalInfo;
      }
      
      if (editingUnit) {
        // 编辑现有机组
        newUnits = units.map(unit =>
          unit.id === editingUnit.id ? unitData : unit
        );
      } else {
        // 添加新机组
        newUnits = [...units, unitData];
      }
      setUnits(newUnits);
      if (onChange) {
        console.log(newUnits, fuels);
        onChange(newUnits, fuels);
      }
      message.success(editingUnit ? '机组信息更新成功' : '机组添加成功');
      handleCancel();
    });
  };
  
  // 删除机组
  const handleDelete = (id) => {
    Modal.confirm({
      title: '确定要删除该机组吗？',
      onOk: () => {
        const newUnits = units.filter(unit => unit.id !== id);
        setUnits(newUnits);
        if (onChange) {
          onChange(newUnits, fuels);
        }
        message.success('机组删除成功');
      }
    });
  };
  

  
  // 处理机组类型变化
  const handleUnitTypeChange = (value) => {
    setSelectedFuelType(value);
    // 根据不同机组类型重置相关字段
    form.setFieldValue('unitCategory', undefined);
    form.setFieldValue('isCFB', false);
    form.setFieldValue('equipmentType', undefined);
  };
  
  // 表格列配置
  const columns = [
    {
      title: '机组名称',
      dataIndex: 'name',
      key: 'name'
    },
    {title: '机组类型',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (type) => {
        const option = unitTypeOptions.find(opt => opt.value === type);
        return option ? option.label : type;
      }
    },
    {title: '机组属性',
      dataIndex: ['unitCategory', 'isCFB'],
      key: 'attributes',
      render: (_, record) => {
        let attributes = [];
        
        // 添加类别信息
        if (record.unitCategory) {
          if (record.fuelType === 'coal') {
            const category = coalUnitCategoryOptions.find(opt => opt.value === record.unitCategory);
            if (category) attributes.push(category.label);
          } else if (record.fuelType === 'gas') {
            const category = gasUnitCategoryOptions.find(opt => opt.value === record.unitCategory);
            if (category) attributes.push(category.label);
          }
        }
        
        // 添加特殊属性
        if (record.isCFB) attributes.push('循环流化床');
        
        return attributes.join(', ') || '无';
      }
    },
    {title: '燃料名称',
      dataIndex: 'fuelNames',
      key: 'fuelNames',
      render: (fuelIds) => {
        if (!fuelIds || !Array.isArray(fuelIds) || fuelIds.length === 0) {
          return '未选择';
        }
        
        // 获取所有燃料数据
        const allFuels = getAllFuels();
        
        // 根据ID查找燃料名称
        const fuelNames = fuelIds.map(id => {
          const fuel = allFuels.find(f => f.id === id);
          return fuel ? fuel.name : id;
        });
        
        return fuelNames.join(', ');
      }
    },
    {
      title: '装机容量 (MW)',
      dataIndex: 'capacity',
      key: 'capacity'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <span>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </span>
      )
    }
  ];
  
  // 移除不再需要的currentFuelOptions变量
  
  // 获取机组类别选项
  const getUnitCategoryOptions = () => {
    if (selectedFuelType === 'coal') {
      return coalUnitCategoryOptions;
    } else if (selectedFuelType === 'gas') {
      return gasUnitCategoryOptions;
    }
    return [];
  };

  return (
    <Card
      title="机组管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          添加机组
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={units}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editingUnit ? '编辑机组' : '添加机组'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="机组名称"
            name="unitName"
            rules={[{ required: true, message: '请输入机组名称' }]}
          >
            <Input placeholder="请输入机组名称" />
          </Form.Item>
          
          <Form.Item
            label="机组类型"
            name="fuelType"
            rules={[{ required: true, message: '请选择机组类型' }]}
          >
            <Select 
              options={unitTypeOptions} 
              placeholder="请选择机组类型" 
              onChange={handleUnitTypeChange}
            />
          </Form.Item>
          
          <Form.Item
            label="燃料名称"
            name="fuelNames"
            rules={[{ required: true, message: '请选择燃料名称' }]}
          >
            <Select 
              mode="multiple" 
              options={getAllFuels().map(fuel => ({
                value: fuel.id,
                label: fuel.name
              }))} 
              placeholder="请选择燃料名称（可多选）" 
            />
          </Form.Item>
          
          {/* 燃煤机组和燃气机组的类别选择 */}
          {(selectedFuelType === 'coal' || selectedFuelType === 'gas') && (
            <Form.Item
              label="机组类别"
              name="unitCategory"
              rules={[{ required: true, message: '请选择机组类别' }]}
            >
              <Select 
                options={getUnitCategoryOptions()} 
                placeholder="请选择机组类别" 
              />
            </Form.Item>
          )}
          
          {/* 燃煤机组特殊属性 - 循环流化床checkbox */}
          {selectedFuelType === 'coal' && (
            <Form.Item
              label="特殊属性"
              tooltip="请选择该机组的特殊属性"
            >
              <Form.Item name="isCFB" valuePropName="checked" noStyle>
                <Checkbox>是否循环流化床机组</Checkbox>
              </Form.Item>
            </Form.Item>
          )}
          
          <Form.Item
            label="装机容量 (MW)"
            name="capacity"
            rules={[{ required: true, message: '请输入装机容量' }]}
          >
            <Input type="number" placeholder="请输入装机容量" />
          </Form.Item>
          
          {/* 只有燃煤机组需要设备类型选择 */}
          {/* 只有燃煤机组需要设备类型选择 */}
          {/* 只有燃煤机组需要设备类型选择 */}
          {selectedFuelType === 'coal' && (
            <Form.Item
              label="设备类型"
              name="equipmentType"
              rules={[{ required: true, message: '请选择设备类型' }]}
            >
              <Select 
                options={[
                  { value: 'boiler', label: '锅炉' },
                  { value: 'turbine', label: '汽轮机' },
                  { value: 'generator', label: '发电机' }
                ]} 
                placeholder="请选择设备类型" 
              />
            </Form.Item>
          )}
          
          {/* 锅炉信息 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.equipmentType === 'boiler' || currentValues.equipmentType === 'boiler'}
          >
            {({ getFieldValue }) => selectedFuelType === 'coal' && (getFieldValue('equipmentType') === 'boiler' || (editingUnit && editingUnit.equipmentType === 'boiler')) && (
              <Collapse defaultActiveKey={['boiler']}>
                <Collapse.Panel header="锅炉信息" key="boiler">
                  <Form.Item
                    label="锅炉名称"
                    name={['boilerInfo', 'name']}
                    rules={[{ required: true, message: '请输入锅炉名称' }]}
                  >
                    <Input placeholder="请输入锅炉名称，如：1#锅炉" />
                  </Form.Item>
                  
                  <Form.Item
                    label="锅炉类型"
                    name={['boilerInfo', 'type']}
                    rules={[{ required: true, message: '请输入锅炉类型' }]}
                  >
                    <Input placeholder="请输入锅炉类型，如：煤粉炉" />
                  </Form.Item>
                  
                  <Form.Item
                    label="锅炉编号"
                    name={['boilerInfo', 'code']}
                    rules={[{ required: true, message: '请输入锅炉编号' }]}
                  >
                    <Input placeholder="请输入锅炉编号，如：MF001" />
                  </Form.Item>
                  
                  <Form.Item
                    label="锅炉型号"
                    name={['boilerInfo', 'model']}
                    rules={[{ required: true, message: '请输入锅炉型号' }]}
                  >
                    <Input placeholder="请输入锅炉型号，如：HG-2030/17.5-YM" />
                  </Form.Item>
                  
                  <Form.Item
                    label="生产能力 (t/h)"
                    name={['boilerInfo', 'capacity']}
                    rules={[{ required: true, message: '请输入生产能力' }]}
                  >
                    <Input type="number" placeholder="请输入生产能力，如：2030" />
                  </Form.Item>
                </Collapse.Panel>
              </Collapse>
            )}
          </Form.Item>
          
          {/* 汽轮机信息 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.equipmentType === 'turbine' || currentValues.equipmentType === 'turbine'}
          >
            {({ getFieldValue }) => selectedFuelType === 'coal' && (getFieldValue('equipmentType') === 'turbine' || (editingUnit && editingUnit.equipmentType === 'turbine')) && (
              <Collapse defaultActiveKey={['turbine']}>
                <Collapse.Panel header="汽轮机信息" key="turbine">
                  <Form.Item
                    label="汽轮机名称"
                    name={['turbineInfo', 'name']}
                    rules={[{ required: true, message: '请输入汽轮机名称' }]}
                  >
                    <Input placeholder="请输入汽轮机名称，如：1#" />
                  </Form.Item>
                  
                  <Form.Item
                    label="汽轮机类型"
                    name={['turbineInfo', 'type']}
                    rules={[{ required: true, message: '请输入汽轮机类型' }]}
                  >
                    <Input placeholder="请输入汽轮机类型，如：抽凝式" />
                  </Form.Item>
                  
                  <Form.Item
                    label="汽轮机编号"
                    name={['turbineInfo', 'code']}
                    rules={[{ required: true, message: '请输入汽轮机编号' }]}
                  >
                    <Input placeholder="请输入汽轮机编号，如：MF002" />
                  </Form.Item>
                  
                  <Form.Item
                    label="汽轮机型号"
                    name={['turbineInfo', 'model']}
                    rules={[{ required: true, message: '请输入汽轮机型号' }]}
                  >
                    <Input placeholder="请输入汽轮机型号，如：N630-16.7/538/538" />
                  </Form.Item>
                  
                  <Form.Item
                    label="压力参数"
                    name={['turbineInfo', 'pressure']}
                    rules={[{ required: true, message: '请选择压力参数' }]}
                  >
                    <Select options={pressureOptions} placeholder="请选择压力参数" />
                  </Form.Item>
                  
                  <Form.Item
                    label="额定功率 (MW)"
                    name={['turbineInfo', 'power']}
                    rules={[{ required: true, message: '请输入额定功率' }]}
                  >
                    <Input type="number" placeholder="请输入额定功率，如：630" />
                  </Form.Item>
                  
                  <Form.Item
                    label="排汽冷却方式"
                    name={['turbineInfo', 'coolingMethod']}
                    rules={[{ required: true, message: '请选择排汽冷却方式' }]}
                  >
                    <Select options={coolingMethodOptions} placeholder="请选择排汽冷却方式" />
                  </Form.Item>
                </Collapse.Panel>
              </Collapse>
            )}
          </Form.Item>
          
          {/* 发电机信息 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.equipmentType === 'generator' || currentValues.equipmentType === 'generator'}
          >
            {({ getFieldValue }) => selectedFuelType === 'coal' && (getFieldValue('equipmentType') === 'generator' || (editingUnit && editingUnit.equipmentType === 'generator')) && (
              <Collapse defaultActiveKey={['generator']}>
                <Collapse.Panel header="发电机信息" key="generator">
                  <Form.Item
                    label="发电机名称"
                    name={['generatorInfo', 'name']}
                    rules={[{ required: true, message: '请输入发电机名称' }]}
                  >
                    <Input placeholder="请输入发电机名称" />
                  </Form.Item>
                  
                  <Form.Item
                    label="发电机编号"
                    name={['generatorInfo', 'code']}
                    rules={[{ required: true, message: '请输入发电机编号' }]}
                  >
                    <Input placeholder="请输入发电机编号" />
                  </Form.Item>
                  
                  <Form.Item
                    label="发电机型号"
                    name={['generatorInfo', 'model']}
                    rules={[{ required: true, message: '请输入发电机型号' }]}
                  >
                    <Input placeholder="请输入发电机型号" />
                  </Form.Item>
                  
                  <Form.Item
                    label="额定功率 (MW)"
                    name={['generatorInfo', 'power']}
                    rules={[{ required: true, message: '请输入额定功率' }]}
                  >
                    <Input type="number" placeholder="请输入额定功率" />
                  </Form.Item>
                </Collapse.Panel>
              </Collapse>
            )}
          </Form.Item>
          
          {/* 非燃煤机组的基本信息 */}
          {selectedFuelType && selectedFuelType !== 'coal' && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '16px', color: '#1890ff' }}>机组基本信息</h3>
              <Form.Item
                label="名称"
                name={['generalInfo', 'name']}
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入名称" />
              </Form.Item>
              
              <Form.Item
                label="编号"
                name={['generalInfo', 'code']}
                rules={[{ required: true, message: '请输入编号' }]}
                tooltip="主要设施的编号统一采用排污许可证中对应编码"
              >
                <Input placeholder="请输入编号" />
              </Form.Item>
              
              <Form.Item
                label="型号"
                name={['generalInfo', 'model']}
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input placeholder="请输入型号" />
              </Form.Item>
              
              <Form.Item
                label="额定功率 (MW)"
                name={['generalInfo', 'power']}
                rules={[{ required: true, message: '请输入额定功率' }]}
              >
                <Input type="number" placeholder="请输入额定功率" />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
      
      {/* 自定义燃料添加区域 */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '15px', color: '#1890ff' }}>添加自定义燃料</h3>
        <CustomFuelForm onAdd={addCustomFuel} />
        
        {fuels.filter(fuel => fuel.id.startsWith('custom_')).length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ marginBottom: '10px', color: '#595959' }}>已添加的自定义燃料：</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {fuels.filter(fuel => fuel.id.startsWith('custom_')).map(fuel => (
                <div 
                  key={fuel.id} 
                  style={{
                    padding: '8px 12px', 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{fuel.name} ({fuel.type === 'solid' ? '固体' : fuel.type === 'liquid' ? '液体' : '气体'})</span>
                  <Button
                    onClick={() => removeCustomFuel(fuel.id)}
                    danger
                    size="small"
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UnitManagement;