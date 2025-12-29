import React, { useState } from 'react';
import { Card, Typography, Table, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

function ElectronicCarbonInventory() {
  // 电子设备制造行业碳核查资料清单数据
  const inventoryItems = [
    { key: '1', name: '电子设备制造企业基本信息', description: '企业营业执照、生产许可证、工艺流程图等基础资料', required: true },
    { key: '2', name: '能源消耗台账', description: '各类化石燃料（如天然气、液化气等）的采购、储存和消耗记录', required: true },
    { key: '3', name: '电子原料采购与消耗记录', description: '电子原料（如硅片、化学品、气体等）的采购数量、成分分析报告', required: true },
    { key: '4', name: '工艺气体使用记录', description: '半导体制造过程中的特种气体（如SF6、NF3、CF4等）的采购、使用和处理记录', required: true },
    { key: '5', name: '电力和热力采购记录', description: '电网公司开具的电费发票、热力供应合同及发票', required: true },
    { key: '6', name: '生产报表', description: '电子产品产量报表、生产日志、设备运行记录等', required: true },
    { key: '7', name: '排放监测报告', description: '如果有在线监测设备，需提供连续监测数据报告', required: false }
  ];
  
  // 文件上传状态 - 改为存储文件数组
  const [inventoryFileList, setInventoryFileList] = useState({});
  
  // 处理碳排查材料文件上传
  const handleInventoryFileUpload = (itemKey, file) => {
    // 在实际应用中，这里应该有上传到服务器的逻辑
    // 现在只是简单地保存文件到状态中
    setInventoryFileList(prev => ({
      ...prev,
      [itemKey]: [...(prev[itemKey] || []), file]
    }));
    message.success(`${file.name} 上传成功`);
    return false; // 阻止默认上传行为
  };
  
  // 渲染文件上传组件
  const renderInventoryUploader = (item) => {
    const uploadProps = {
      name: 'file',
      multiple: true,
      beforeUpload: (file) => handleInventoryFileUpload(item.key, file),
      showUploadList: true,
      fileList: inventoryFileList[item.key] || [],
      // 移除maxCount限制，允许上传多个文件
      onRemove: (file) => {
        // 处理文件移除
        setInventoryFileList(prev => ({
          ...prev,
          [item.key]: prev[item.key]?.filter(f => f.uid !== file.uid) || []
        }));
        return true;
      }
    };

    return (
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持多个文件同时上传
        </p>
      </Dragger>
    );
  };
  
  // 表格列配置
  const inventoryColumns = [
    { 
      title: '序号', 
      dataIndex: 'key', 
      key: 'key',
      width: 60
    },
    { 
      title: '材料名称', 
      dataIndex: 'name', 
      key: 'name',
      width: 200
    },
    { 
      title: '材料说明', 
      dataIndex: 'description', 
      key: 'description',
      width: 300
    },
    { 
      title: '是否必填', 
      dataIndex: 'required', 
      key: 'required',
      width: 80,
      render: (required) => required ? '是' : '否'
    },
    { 
      title: '上传文件', 
      key: 'upload',
      render: (_, record) => renderInventoryUploader(record)
    }
  ];

  return (
    <Card title="电子设备制造行业碳核查资料清单" style={{ marginBottom: '20px' }}>
      <Title level={5}>资料清单说明</Title>
      <Paragraph>
        本模块用于上传电子设备制造企业碳核查所需的资料清单文件。请按照要求上传相关证明材料和记录文档。
        所有资料为碳核查工作的必要支持文件，用于数据质量控制和审核。重点关注能源消耗、工艺气体使用和生产工艺等环节的相关记录。
      </Paragraph>
      
      <Table 
        dataSource={inventoryItems} 
        columns={inventoryColumns} 
        pagination={false}
        rowKey="key"
        size="middle"
        style={{ marginTop: 20 }}
        rowClassName={(record) => inventoryFileList[record.key] && inventoryFileList[record.key].length > 0 ? 'inventory-row-uploaded' : ''}
        bordered
      />
      
      <style jsx>{`
        .inventory-row-uploaded {
          background-color: #f6ffed;
        }
        .ant-upload-drag {
          width: 400px;
        }
      `}</style>
    </Card>
  );
}

export default ElectronicCarbonInventory;