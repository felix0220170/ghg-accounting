import React, { useState } from 'react';
import { Card, Typography, Table, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

function BuildingCarbonInventory() {
  // 公共建筑运营单位碳核查资料清单数据
  const inventoryItems = [
    { key: '1', name: '建筑基本信息', description: '建筑产权证书、建设规划许可证、建筑使用性质证明、建筑面积和功能分区说明', required: true },
    { key: '2', name: '能源消耗台账', description: '年度电力、天然气、柴油、汽油等能源采购发票、消耗记录和计量表读数', required: true },
    { key: '3', name: '购入电力和热力发票', description: '电网公司开具的电费发票、热力供应合同及发票、能源供应协议', required: true },
    { key: '4', name: '建筑设备运行记录', description: '空调系统、照明系统、电梯、水泵等主要用能设备的运行记录和维护记录', required: true },
    { key: '5', name: '供暖供冷系统记录', description: '集中供暖系统、空调制冷系统、分体空调等设备的启停时间、温度设定记录', required: true },
    { key: '6', name: '建筑能耗统计报表', description: '月度、季度、年度能耗统计报表、建筑能耗审计报告、能效评估报告', required: true },
    { key: '7', name: '节能改造记录', description: '节能设备更换记录、建筑保温改造记录、照明系统节能改造等技术改造资料', required: false },
    { key: '8', name: '入住率和使用情况证明', description: '建筑使用单位证明、年度入住率统计、开放时间证明、客流统计等', required: true },
    { key: '9', name: '在线监测数据', description: '建筑能耗在线监测系统数据、分项计量装置记录、能源管理系统数据', required: false }
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
    <Card title="公共建筑运营单位碳核查资料清单" style={{ marginBottom: '20px' }}>
      <Title level={5}>资料清单说明</Title>
      <Paragraph>
        本模块用于上传公共建筑运营单位碳核查所需的资料清单文件。请按照要求上传相关证明材料和记录文档。
        所有资料为碳核查工作的必要支持文件，用于数据质量控制和审核。重点关注建筑能源消耗、购入电力和热力、
        建筑设备运行以及供暖供冷系统等相关记录，确保碳排放核算的准确性和完整性。
      </Paragraph>
      <Paragraph style={{ fontSize: '12px', color: '#666', marginTop: '10px', padding: '8px', backgroundColor: '#f5f5f5', borderLeft: '3px solid #1890ff' }}>
        <strong>重要说明：</strong>根据核算指南，以下排放源一般不纳入核算范围：
        ①逸散型排放源（如制冷剂逸散、灭火器使用等）；②建筑物周围新种植树木的温室气体抵消；
        ③委托第三方承担运输产生的排放。因此，空调等设备运行记录仅用于能耗计算，
        不涉及制冷剂逸散排放核算。
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

export default BuildingCarbonInventory;