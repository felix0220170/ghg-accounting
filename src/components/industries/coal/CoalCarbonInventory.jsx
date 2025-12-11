import React, { useState } from 'react';
import { Card, Typography, Table, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

function CoalCarbonInventory() {
  // 煤炭生产企业碳排查材料清单数据
  const inventoryItems = [
    { key: '1', name: '营业执照' },
    { key: '2', name: '采矿许可证' },
    { key: '3', name: '安全生产许可证' },
    { key: '4', name: '排污许可证' },
    { key: '5', name: '煤矿地质资料' },
    { key: '6', name: '开采方案设计' },
    { key: '7', name: '煤矿通风系统图' },
    { key: '8', name: '煤矿采掘工程平面图' },
    { key: '9', name: '组织机构图' },
    { key: '10', name: '备案的数据质量控制计划' },
    { key: '11', name: '年度生产计划和统计报表' },
    { key: '12', name: '原煤产量台账' },
    { key: '13', name: '商品煤销量台账' },
    { key: '14', name: '自用煤消耗量记录' },
    { key: '15', name: '煤矸石产生及处置记录' },
    { key: '16', name: '煤泥产生及处置记录' },
    { key: '17', name: '瓦斯抽采记录' },
    { key: '18', name: '瓦斯利用记录' },
    { key: '19', name: '通风报表' },
    { key: '20', name: '主要通风机运行记录' },
    { key: '21', name: '局部通风机运行记录' },
    { key: '22', name: '瓦斯监测日报表' },
    { key: '23', name: '电力消耗抄表记录' },
    { key: '24', name: '柴油消耗原始记录（用于运输设备）' },
    { key: '25', name: '燃料油消耗原始记录' },
    { key: '26', name: '《能源购进、消费与库存表》' },
    { key: '27', name: '电力结算发票' },
    { key: '28', name: '柴油、燃料油等结算发票' },
    { key: '29', name: '瓦斯抽采系统检测报告' },
    { key: '30', name: '通风阻力测定报告' },
    { key: '31', name: '煤质分析报告（灰分、挥发分、固定碳等）' },
    { key: '32', name: '煤层瓦斯含量测定报告' },
    { key: '33', name: '流量计校验记录' },
    { key: '34', name: '电子地磅检定证书' },
    { key: '35', name: '瓦斯传感器校准记录' },
    { key: '36', name: '电表检定证书' },
    { key: '37', name: '废气排放监测报告' },
    { key: '38', name: '主要生产设备台账' },
    { key: '39', name: '外购电力排放因子证明文件' },
    { key: '40', name: '矿后活动（如土地复垦）相关记录' }
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
        本模块用于上传煤炭生产企业碳排查所需的材料清单文件。请按照要求上传相关证明材料和记录文档。
        所有材料为碳排查工作的必要支持文件，用于数据质量控制和审核。
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

export default CoalCarbonInventory;