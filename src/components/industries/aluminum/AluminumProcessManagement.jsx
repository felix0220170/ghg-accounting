import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Upload, Form, Space, message, Typography, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { InboxOutlined } from '@ant-design/icons';
import './ProcessManagement.css';

const { Dragger } = Upload;
const { Text } = Typography;

const AluminumProcessManagement = ({ processes = [], onProcessesChange = () => {} }) => {
  // 组件状态
  const [currentProcesses, setCurrentProcesses] = useState([]);
  const [editingProcess, setEditingProcess] = useState(null);

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
      processName: '',
      designCurrent: '',
      designVoltage: '',
      cellCount: '',
      productionCapacity: '',
      supportingMaterials: {}
    };
    setEditingProcess(newProcess);
  };

  // 编辑工序
  const handleEditProcess = (process) => {
    // 深拷贝以避免直接修改原始数据
    const clonedProcess = JSON.parse(JSON.stringify(process));
    setEditingProcess(clonedProcess);
  };

  // 删除工序
  const handleDeleteProcess = (id) => {
    if (window.confirm('确定要删除这个工序吗？')) {
      const updatedProcesses = currentProcesses.filter(process => process.id !== id);
      setCurrentProcesses(updatedProcesses);
      if (typeof onProcessesChange === 'function') {
        onProcessesChange(updatedProcesses);
      }
      message.success('工序已删除');
    }
  };

  // 更新工序名称
  const handleProcessNameChange = (value) => {
    if (!editingProcess) return;
    
    setEditingProcess(prev => ({
      ...prev,
      processName: value
    }));
  };

  // 更新工序字段
  const handleProcessFieldChange = (field, value) => {
    if (!editingProcess) return;
    
    setEditingProcess(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 保存工序
  const handleSaveProcess = () => {
    if (!editingProcess) return;
    
    try {
      // 手动验证所有必填字段
      if (!editingProcess.processName || editingProcess.processName.trim() === '') {
        message.warning('请输入工序名称');
        return;
      }
      
      if (!editingProcess.designCurrent) {
        message.warning('请输入设计电流');
        return;
      }
      
      // 验证设计电流是否为有效数字且大于0
      const current = parseFloat(editingProcess.designCurrent);
      if (isNaN(current) || current <= 0) {
        message.warning('请输入有效的设计电流数值（大于0）');
        return;
      }
      
      if (!editingProcess.designVoltage) {
        message.warning('请输入设计电压');
        return;
      }
      
      // 验证设计电压是否为有效数字且大于0
      const voltage = parseFloat(editingProcess.designVoltage);
      if (isNaN(voltage) || voltage <= 0) {
        message.warning('请输入有效的设计电压数值（大于0）');
        return;
      }
      
      if (!editingProcess.cellCount) {
        message.warning('请输入电解槽数量');
        return;
      }
      
      // 验证电解槽数量是否为有效整数且大于0
      const cellCount = parseInt(editingProcess.cellCount);
      if (isNaN(cellCount) || cellCount <= 0 || !Number.isInteger(cellCount)) {
        message.warning('请输入有效的电解槽数量（正整数）');
        return;
      }
      
      if (!editingProcess.productionCapacity) {
        message.warning('请输入产能');
        return;
      }
      
      // 验证产能是否为有效数字且大于等于0
      const capacity = parseFloat(editingProcess.productionCapacity);
      if (isNaN(capacity) || capacity < 0) {
        message.warning('请输入有效的产能数值（非负数）');
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
      title: '工序名称',
      dataIndex: 'processName',
      key: 'processName',
    },
    {
      title: '设计电流（kA）',
      dataIndex: 'designCurrent',
      key: 'designCurrent',
    },
    {
      title: '设计电压（V）',
      dataIndex: 'designVoltage',
      key: 'designVoltage',
    },
    {
      title: '电解槽数量（个）',
      dataIndex: 'cellCount',
      key: 'cellCount',
    },
    {
      title: '产能（万吨/年）',
      dataIndex: 'productionCapacity',
      key: 'productionCapacity',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditProcess(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProcess(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  // 填报说明
  const renderInstructions = () => (
    <Card title="填报说明" type="inner" style={{ marginBottom: 16 }}>
      <ul>
        <li>工序名称：填写铝冶炼相关的工序名称。</li>
        <li>设计电流：填写电解槽的设计电流，单位为kA。</li>
        <li>设计电压：填写电解槽的设计电压，单位为V。</li>
        <li>电解槽数量：填写电解槽的数量，单位为个。</li>
        <li>产能：填写工序的产能，单位为万吨/年。</li>
        <li>支撑材料：上传与工序相关的支撑材料证明文件（如产能批复文件、设施参数证明等）。</li>
      </ul>
    </Card>
  );

  // 工序编辑表单
  const renderProcessForm = () => {
    if (!editingProcess) return null;

    return (
      <Card title={editingProcess.id === Date.now().toString() ? "添加工序" : "编辑工序"}>
        <Form layout="vertical" preserve={false}>
          {/* 工序名称 */}
          <Form.Item
            label={
              <Space>
                工序名称
                <Tooltip title="填写铝冶炼相关的工序名称">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入工序名称" 
              value={editingProcess.processName}
              onChange={(e) => handleProcessFieldChange('processName', e.target.value)}
            />
          </Form.Item>

          {/* 设计电流 */}
          <Form.Item
            label={
              <Space>
                设计电流（kA）
                <Tooltip title="填写电解槽的设计电流，单位为kA">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入设计电流" 
              value={editingProcess.designCurrent}
              onChange={(e) => handleProcessFieldChange('designCurrent', e.target.value)}
              type="number"
              step="0.1"
            />
          </Form.Item>

          {/* 设计电压 */}
          <Form.Item
            label={
              <Space>
                设计电压（V）
                <Tooltip title="填写电解槽的设计电压，单位为V">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入设计电压" 
              value={editingProcess.designVoltage}
              onChange={(e) => handleProcessFieldChange('designVoltage', e.target.value)}
              type="number"
              step="0.1"
            />
          </Form.Item>

          {/* 电解槽数量 */}
          <Form.Item
            label={
              <Space>
                电解槽数量（个）
                <Tooltip title="填写电解槽的数量，单位为个">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入电解槽数量" 
              value={editingProcess.cellCount}
              onChange={(e) => handleProcessFieldChange('cellCount', e.target.value)}
              type="number"
              step="1"
            />
          </Form.Item>

          {/* 产能 */}
          <Form.Item
            label={
              <Space>
                产能（万吨/年）
                <Tooltip title="填写工序的产能，单位为万吨/年">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
            required
          >
            <Input 
              placeholder="请输入产能" 
              value={editingProcess.productionCapacity}
              onChange={(e) => handleProcessFieldChange('productionCapacity', e.target.value)}
              type="number"
              step="0.0001"
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
    />
    </Card>
  );
};

export default AluminumProcessManagement;