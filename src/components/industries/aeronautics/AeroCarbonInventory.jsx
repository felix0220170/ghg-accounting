import React, { useState } from 'react';
import { Card, Typography, Table, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

function AeroCarbonInventory() {
  // 民航企业碳排查材料清单数据
  const inventoryItems = [
    { key: '1', name: '营业执照' },
    { key: '2', name: '航空运输经营许可证' },
    { key: '3', name: '组织机构图' },
    { key: '4', name: '备案的数据质量控制计划' },
    { key: '5', name: '年度航班运行计划表' },
    { key: '6', name: '月度航班运行数据统计报表' },
    { key: '7', name: '飞机燃油消耗原始记录' },
    { key: '8', name: '航空煤油采购合同和发票' },
    { key: '9', name: '航空煤油接收、存储和发放记录' },
    { key: '10', name: '飞机加油单（包含航班号、日期、加油量等）' },
    { key: '11', name: '《能源购进、消费与库存表》' },
    { key: '12', name: '电力消耗原始记录和结算发票' },
    { key: '13', name: '热力消耗原始记录和结算发票' },
    { key: '14', name: '机场地面服务协议和费用结算单' },
    { key: '15', name: '飞机发动机性能参数表' },
    { key: '16', name: '飞机维修记录（影响燃油效率的维修）' },
    { key: '17', name: '飞行计划和实际飞行路线记录' },
    { key: '18', name: '飞机载重记录' },
    { key: '19', name: '航空煤油品质检验报告' },
    { key: '20', name: '废气排放监测报告（如适用）' },
    { key: '21', name: '碳排放监测计划和报告' },
    { key: '22', name: '碳排放权交易相关文件（如适用）' },
    { key: '23', name: '能源管理体系相关文件' },
    { key: '24', name: '节能减排措施实施记录' },
    { key: '25', name: '外购电力排放因子证明文件' },
    { key: '26', name: '计量设备（如燃油流量计、电表）检定证书' },
    { key: '27', name: '主要设备台账（飞机、发动机等）' },
    { key: '28', name: '飞行员培训记录（燃油效率相关）' },
    { key: '29', name: '航油供应商提供的燃料特性报告' },
    { key: '30', name: '碳排放核算报告' },
    { key: '31', name: '第三方核查报告（如适用）' },
    { key: '32', name: '其他与碳排放相关的证明文件' }
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
      width: 400
    },
    {
      title: '上传文件',
      key: 'upload',
      render: (_, record) => renderInventoryUploader(record)
    }
  ];

  return (
    <Card title="碳排查材料清单" style={{ marginBottom: '20px' }}>
      <Title level={5}>材料清单说明</Title>
      <Paragraph>
        本模块用于上传民航企业碳排查所需的材料清单文件。请按照要求上传相关证明材料和记录文档。
        所有材料为碳排查工作的必要支持文件，用于数据质量控制和审核。重点关注航空煤油消耗、航班运行数据、
        电力热力消耗等与碳排放相关的记录。
      </Paragraph>
      
      <Table 
        dataSource={inventoryItems} 
        columns={inventoryColumns} 
        pagination={false}
        rowKey="key"
        size="middle"
        style={{ marginTop: 20 }}
        rowClassName={(record) => inventoryFileList[record.key] && inventoryFileList[record.key].length > 0 ? 'inventory-row-uploaded' : ''}
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

export default AeroCarbonInventory;