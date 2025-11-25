import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, Upload, Form, Space, message, Typography, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { InboxOutlined } from '@ant-design/icons';
import './ProcessManagement.css';

const { Option } = Select;
const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

// 10个预设工序类型
const PROCESS_TYPES = [
  { value: 'coking', label: '焦化工序' },
  { value: 'sintering', label: '烧结工序' },
  { value: 'pelletizing', label: '球团工序' },
  { value: 'blastFurnace', label: '高炉炼铁工序' },
  { value: 'converter', label: '转炉炼钢工序' },
  { value: 'eaf', label: '电炉炼钢工序' },
  { value: 'refining', label: '精炼工序' },
  { value: 'continuousCasting', label: '连铸工序' },
  { value: 'rolling', label: '钢压延加工工序' },
  { value: 'lime', label: '石灰工序' }
];

// 工序产品缺省值映射
const DEFAULT_PRODUCT_INFO = {
  coking: { name: '焦炭', code: '250401' },
  sintering: { name: '烧结铁矿', code: '08010301' },
  pelletizing: { name: '球团铁矿', code: '08010302' },
  blastFurnace: { name: '生铁', code: '3201' },
  converter: { name: '转炉钢', code: '320641' },
  eaf: { name: '电弧炉钢', code: '320642' },
  lime: { name: '石灰', code: '31020101' }
};

// 焦炭生产方式选项
const COKING_METHODS = [
  { value: 'topCharging', label: '顶装焦炉' },
  { value: 'stamping', label: '捣固焦炉' }
];

const ProcessManagement = ({ processes = [], onProcessesChange = () => {} }) => {
  // 添加一些自定义样式
  const customStyles = {
    tableRow: {
      backgroundColor: '#f6ffed',
    },
  };
  // 组件状态
  const [currentProcesses, setCurrentProcesses] = useState([]);
  const [editingProcess, setEditingProcess] = useState(null);
  const [customProcessType, setCustomProcessType] = useState('');
  const [showAddCustomType, setShowAddCustomType] = useState(false);

  // 当父组件传入的processes属性变化时，更新组件内部状态
  useEffect(() => {
    if (Array.isArray(processes)) {
      setCurrentProcesses(processes);
    }
  }, [processes]);

  // 添加新的工序
  const handleAddProcess = () => {
    const newProcess = {
      id: Date.now().toString(),
      processType: '',
      processTypeName: '',
      productName: '',
      productCode: '',
      productionCapacity: '',
      facilities: [{
        id: Date.now().toString() + '-facility-1',
        facilityName: '',
        facilityUnit: '',
        facilitySpec: '',
        transportTime: ''
      }],
      description: '',
      supportingMaterials: {}
    };
    setEditingProcess(newProcess);
  };

  // 编辑工序
  const handleEditProcess = (process) => {
    // 深拷贝以避免直接修改原始数据
    const clonedProcess = JSON.parse(JSON.stringify(process));
    // 确保facilities是数组且至少有一个元素
    if (!Array.isArray(clonedProcess.facilities) || clonedProcess.facilities.length === 0) {
      clonedProcess.facilities = [{
        id: Date.now().toString() + '-facility-1',
        facilityName: '',
        facilityUnit: '',
        facilitySpec: '',
        transportTime: ''
      }];
    }
    setEditingProcess(clonedProcess);
  };

  // 删除工序
  const handleDeleteProcess = (id) => {
    const processToDelete = currentProcesses.find(p => p.id === id);
    // 检查是否为自定义工序
    const isCustomProcess = !processToDelete?.isDefault;
    
    if (isCustomProcess) {
      if (window.confirm('确定要删除这个工序吗？')) {
        const updatedProcesses = currentProcesses.filter(process => process.id !== id);
        setCurrentProcesses(updatedProcesses);
        if (typeof onProcessesChange === 'function') {
          onProcessesChange(updatedProcesses);
        }
        message.success('工序已删除');
      }
    } else {
      message.warning('默认工序不能删除');
    }
  };

  // 处理工序类型变化
  const handleProcessTypeChange = (value) => {
    if (!editingProcess) return;
    
    // 首先尝试通过输入的名称匹配PROCESS_TYPES中的选项
    const matchedType = PROCESS_TYPES.find(type => 
      type.label.toLowerCase() === value.toLowerCase() || 
      type.value === value
    );
    
    // 确定使用的processType值
    const processTypeValue = matchedType ? matchedType.value : `custom-${Date.now()}`;
    
    // 查找是否有默认的产品信息
    const defaultProduct = DEFAULT_PRODUCT_INFO[processTypeValue] || 
                         (matchedType ? DEFAULT_PRODUCT_INFO[matchedType.value] : null);
    
    setEditingProcess(prev => ({
      ...prev,
      processType: processTypeValue,
      processTypeName: value, // 使用用户输入的名称
      // 如果存在默认产品信息，则自动填充
      productName: defaultProduct ? defaultProduct.name : prev.productName,
      productCode: defaultProduct ? defaultProduct.code : prev.productCode
    }));
  };
  // 添加自定义工序类型
  const handleAddCustomProcessType = () => {
    if (!customProcessType.trim()) {
      message.warning('请输入工序类型名称');
      return;
    }
    
    // 为自定义工序创建唯一的processType值
    const customProcessTypeId = `custom-${Date.now()}`;
    
    const newProcess = {
      id: Date.now().toString(),
      processType: customProcessTypeId,
      processTypeName: customProcessType.trim(),
      productName: '',
      productCode: '',
      productionCapacity: '',
      facilities: [{
        id: Date.now().toString() + '-facility-1',
        facilityName: '',
        facilityUnit: '',
        facilitySpec: '',
        transportTime: ''
      }],
      description: '',
      supportingMaterials: {},
      isDefault: false // 明确标记为非默认工序
    };
    
    // 直接设置为编辑状态，而不是先保存再编辑
    setEditingProcess(newProcess);
    setCustomProcessType('');
    setShowAddCustomType(false);
    message.info('请填写自定义工序的其他信息');
  };

  // 添加生产设施
  const handleAddFacility = () => {
    if (!editingProcess) return;
    
    const newFacility = {
      id: Date.now().toString() + `-facility-${editingProcess.facilities.length + 1}`,
      facilityName: '',
      facilityUnit: facilityUnitDefaultValue[editingProcess.processType],
      facilitySpec: '',
      transportTime: ''
    };
    
    setEditingProcess(prev => ({
      ...prev,
      facilities: [...prev.facilities, newFacility]
    }));
  };

  // 删除生产设施
  const handleDeleteFacility = (facilityId) => {
    if (!editingProcess) return;
    
    // 确保至少保留一个生产设施
    if (editingProcess.facilities.length <= 1) {
      message.warning('至少需要保留一个生产设施');
      return;
    }
    
    setEditingProcess(prev => ({
      ...prev,
      facilities: prev.facilities.filter(facility => facility.id !== facilityId)
    }));
  };

  // 更新生产设施信息
  const handleUpdateFacility = (facilityId, field, value) => {
    if (!editingProcess) return;
    
    setEditingProcess(prev => ({
      ...prev,
      facilities: prev.facilities.map(facility =>
        facility.id === facilityId
          ? { ...facility, [field]: value }
          : facility
      )
    }));
  };

  // 保存工序
  const handleSaveProcess = () => {
    if (!editingProcess) return;
    
    try {
      // 手动验证所有必填字段
      if (!editingProcess.processType || !editingProcess.processTypeName) {
        message.warning('请选择工序类型');
        return;
      }
      
      if (!editingProcess.productName || editingProcess.productName.trim() === '') {
        message.warning('请输入产品名称');
        return;
      }
      
      if (!editingProcess.productCode || editingProcess.productCode.trim() === '') {
        message.warning('请输入产品代码');
        return;
      }
      
      if (!editingProcess.productionCapacity) {
        message.warning('请输入工序产品生产能力');
        return;
      }
      
      // 验证生产能力是否为有效数字且大于等于0
      const capacity = parseFloat(editingProcess.productionCapacity);
      if (isNaN(capacity) || capacity < 0) {
        message.warning('请输入有效的生产能力数值（非负数）');
        return;
      }
      
      // 验证生产设施信息
      if (!Array.isArray(editingProcess.facilities) || editingProcess.facilities.length === 0) {
        message.warning('请添加至少一个生产设施');
        return;
      }
      
      const hasEmptyFacilityInfo = editingProcess.facilities.some(facility => 
        !facility.facilityName || facility.facilityName.trim() === '' || 
        !facility.facilitySpec || facility.facilitySpec.trim() === ''
      );
      
      if (hasEmptyFacilityInfo) {
        message.warning('请填写完整的生产设施信息');
        return;
      }
      
      // 确保supportingMaterials是对象
      const processToSave = {
        ...editingProcess,
        supportingMaterials: editingProcess.supportingMaterials || {}
      };
      
      // 使用函数式更新确保基于最新状态进行操作
      setCurrentProcesses(prevProcesses => {
        let updatedProcesses;
        if (prevProcesses.some(process => process.id === processToSave.id)) {
          // 更新现有工序
          updatedProcesses = prevProcesses.map(process => 
            process.id === processToSave.id ? { ...processToSave } : process
          );
        } else {
          // 添加新工序 - 创建新的数组引用
          updatedProcesses = [...prevProcesses, { ...processToSave }];
        }
        
        // 然后调用父组件的回调函数，通知父组件工序已更新
        if (typeof onProcessesChange === 'function') {
          // 传递一个完全新的数组引用给父组件
          onProcessesChange([...updatedProcesses]);
        } else {
          console.warn('onProcessesChange is not a function');
        }
        
        return updatedProcesses;
      });
      
      // 重置编辑状态
      setEditingProcess(null);
      message.success(editingProcess.id === Date.now().toString() ? '工序添加成功' : '工序更新成功');
    } catch (error) {
      console.error('保存工序时发生错误:', error);
      message.error('保存失败，请重试');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingProcess(null);
    setShowAddCustomType(false);
  };

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ fileList }) {
      // 实际项目中这里应该处理文件上传逻辑，并更新工序的支撑材料
      if (editingProcess) {
        setEditingProcess(prev => ({
          ...prev,
          supportingMaterials: {
            ...prev.supportingMaterials,
            [Date.now()]: fileList.map(file => file.originFileObj ? file.originFileObj.name : file.name)
          }
        }));
      }
      console.log('Files:', fileList);
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
    // 自定义请求处理，实际项目中应替换为真实的上传接口
    customRequest: ({ onSuccess }) => {
      // 模拟上传成功
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '工序类型',
      dataIndex: 'processTypeName',
      key: 'processTypeName',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '产品代码',
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: '工序产品生产能力（万 t/a）',
      dataIndex: 'productionCapacity',
      key: 'productionCapacity',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditProcess(record)}>编辑</Button>
          { record.isDefault ? null :<Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProcess(record.id)}>删除</Button> }
        </Space>
      ),
    },
  ];

  const facilityNameToolTip = {
    coking: '顶装焦炉/捣固焦炉/热回收焦炉等',
    sintering: '带式烧结机/步进式烧结机等',
    pelletizing: '链篦机-回转窑/带式焙烧机/竖炉等',
    blastFurnace: '高炉/气基直接还原竖炉/熔融还原炉/回转窑和矿热炉等',
    converter: '转炉',
    eaf: '电炉'
  }

  const facilityUnitDefaultValue = {
    coking: '米',
    sintering: '平方米',
    pelletizing: '平方米',
    blastFurnace: '立方米',
    converter: '吨',
    eaf: '吨'
  }

  const facilityUnitToolTip = {
    coking: '炭化室高度',
    sintering: '传送带面积',
    pelletizing: '容量'
  }

  // 填报说明
  const renderInstructions = () => (
    <Card title="填报说明" type="inner" style={{ marginBottom: 16 }}>
      <ul>
        <li>高炉炼铁工序、精炼工序、连铸工序、钢压延加工工序应按照国家统计局发布的统计用产品分类目录填报各工序可生产的产品名称和代码，可填报至小类。</li>
        <li>工序产品生产能力信息来自主管部门批复产能，四舍五入保留到小数点后四位。</li>
        <li>焦炭生产方式填写顶装焦炉、捣固焦炉。</li>
        <li>若仅填写工序主要生产设施，如高炉炼铁工序的高炉，若工序包括不止一个主要生产设施，应加行分别填报。</li>
        <li>若存在特殊情况，在此处进行备注说明。</li>
        <li>若有其他钢铁产品生产工序，请自行添加。</li>
      </ul>
    </Card>
  );

  // 工序编辑表单
  const renderProcessForm = () => {
    if (!editingProcess) return null;

    return (
      <Card title={editingProcess.id === Date.now().toString() ? "添加工序" : "编辑工序"}>
        <Form layout="vertical" preserve={false}>
          {/* 工序类型 */}
          <Form.Item
            label="工序类型"
            required
          >
            <Space>
              {editingProcess.isDefault ? (
                // 默认工序：显示固定的工序类型名称，不允许修改
                <div style={{ width: 240, padding: '4px 11px', backgroundColor: '#f5f5f5', borderRadius: '2px', border: '1px solid #d9d9d9' }}>
                  {editingProcess.processTypeName}
                </div>
              ) : (
                // 非默认工序：直接输入工序类型名称
                <Input 
                  style={{ width: 240 }} 
                  placeholder="输入工序类型名称"
                  value={editingProcess.processTypeName || editingProcess.processType}
                  onChange={(e) => handleProcessTypeChange(e.target.value)}
                />
              )}
              {/* 只有在编辑新工序或非默认工序时才显示添加自定义按钮 */}
              {!editingProcess.id && (
                <Button 
                  type="dashed" 
                  onClick={() => setShowAddCustomType(!showAddCustomType)}
                >
                  {showAddCustomType ? '取消' : '添加自定义'}
                </Button>
              )}
            </Space>
            {showAddCustomType && (
              <Space style={{ marginTop: 10 }}>
                <Input 
                  placeholder="自定义工序类型名称" 
                  value={customProcessType}
                  onChange={e => setCustomProcessType(e.target.value)}
                />
                <Button type="primary" onClick={handleAddCustomProcessType}>确认添加</Button>
              </Space>
            )}
          </Form.Item>

          {/* 产品名称 */}
          <Form.Item
            label={
              <Space>
                产品名称
                <Tooltip title={"高炉炼铁工序、精炼工序、连铸工序、钢压延加工工序应按照国家统计局发布的统计用产品分类目录填报各工序可生产的产品名称"}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入产品名称" 
              value={editingProcess.productName}
              onChange={(e) => setEditingProcess(prev => ({...prev, productName: e.target.value}))}
            />
          </Form.Item>

          {/* 产品代码 */}
          <Form.Item
            label={
              <Space>
                产品代码
                <Tooltip title={"高炉炼铁工序、精炼工序、连铸工序、钢压延加工工序应按照国家统计局发布的统计用产品分类目录填报各工序可生产的产品代码，可填报至小类"}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入产品代码" 
              value={editingProcess.productCode}
              onChange={(e) => setEditingProcess(prev => ({...prev, productCode: e.target.value}))}
            />
          </Form.Item>

          {/* 工序产品生产能力 */}
          <Form.Item
            label={
              <Space>
                工序产品生产能力（万 t/a）
                <Tooltip title="信息来自主管部门批复产能，四舍五入保留到小数点后四位">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入工序产品生产能力" 
              value={editingProcess.productionCapacity}
              onChange={(e) => setEditingProcess(prev => ({...prev, productionCapacity: e.target.value}))}
              type="number"
              step="0.0001"
            />
          </Form.Item>

          {/* 生产设施 */}
          <Form.Item
            label={
              <Space>
                生产设施
                <Tooltip title="若工序包括不止一个主要生产设施，应加行分别填报">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            {editingProcess.facilities.map((facility, index) => (
              <div key={facility.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #d9d9d9' }}>
                <Text style={{ marginBottom: 12, display: 'block', fontWeight: 500 }}>设施 {index + 1}:</Text>
                <Space style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ width: 150, textAlign: 'right', marginRight: 8 }}>主要生产设施规格名称:</Text>
                  <Input 
                    style={{ width: 200 }} 
                    value={facility.facilityName}
                    onChange={(e) => handleUpdateFacility(facility.id, 'facilityName', e.target.value)}
                  />
                  <b>{facilityNameToolTip[editingProcess.processType]}</b>
                </Space>
                <Space style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ width: 150, textAlign: 'right', marginRight: 8 }}>主要生产设施规格:</Text>
                  <Input 
                    style={{ width: 150 }} 
                    value={facility.facilitySpec}
                    onChange={(e) => handleUpdateFacility(facility.id, 'facilitySpec', e.target.value)}
                  />
                </Space>
                <Space style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ width: 150, textAlign: 'right', marginRight: 8 }}>主要生产设施规格单位:</Text>
                  <Input 
                    style={{ width: 150 }} 
                    value={facility.facilityUnit}
                    onChange={(e) => handleUpdateFacility(facility.id, 'facilityUnit', e.target.value)}
                  />
                  <b>{facilityUnitToolTip[editingProcess.processType]}</b>
                </Space>
                <Space style={{ display: 'flex', alignItems: 'center' }}>
                  <Text style={{ width: 150, textAlign: 'right', marginRight: 8 }}>投运时间:</Text>
                  <Input 
                    style={{ width: 150 }} 
                    value={facility.transportTime}
                    onChange={(e) => handleUpdateFacility(facility.id, 'transportTime', e.target.value)}
                  />
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteFacility(facility.id)}
                    disabled={editingProcess.facilities.length <= 1}
                    style={{ marginLeft: 16 }}
                  />
                </Space>
              </div>
            ))}
            <Button 
              type="dashed" 
              onClick={handleAddFacility}
              style={{ marginTop: 8 }}
            >
              <PlusOutlined /> 添加生产设施
            </Button>
          </Form.Item>

          {/* 说明 */}
          <Form.Item
            label={
              <Space>
                说明
                <Tooltip title="若存在特殊情况，在此处进行备注说明">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <Input.TextArea 
              placeholder="若存在特殊情况，在此处进行备注说明" 
              value={editingProcess.description}
              onChange={(e) => setEditingProcess(prev => ({...prev, description: e.target.value}))}
              rows={4}
            />
          </Form.Item>

          {/* 支撑材料上传 */}
          <Form.Item label="支撑材料上传" required>
            <div>
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持单个或批量上传，请上传与工序相关的支撑材料证明文件（如产能批复文件、设施参数证明等）。
                </p>
              </Dragger>
              
              {/* 已上传文件列表 */}
              {editingProcess && Object.keys(editingProcess.supportingMaterials).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>已上传文件：</Text>
                  <ul>
                    {Object.values(editingProcess.supportingMaterials).flatMap(files => 
                      files.map((fileName, index) => (
                        <li key={index}>{fileName}</li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSaveProcess}>保存</Button>
              <Button onClick={handleCancelEdit}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  };



  return (
    <Card 
      title="工序管理" 
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProcess}>
          添加其他工序
        </Button>
      }
    >
      {renderInstructions()}
      {renderProcessForm()}
      <Table 
        columns={columns} 
        dataSource={currentProcesses} 
        rowKey="id" 
        style={{ marginTop: 20 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `显示第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50'],
          showQuickJumper: true
        }}
        rowClassName={(record) => record.isDefault ? 'default-process-row' : ''}
        rowStyle={(record) => record.isDefault ? customStyles.tableRow : {}}
      />
    </Card>
  );
};

export default ProcessManagement;