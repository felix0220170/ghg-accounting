import React, { useState } from 'react';
import { Card, Typography, Table, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

function AluminumCarbonInventory() {
  // 铝冶炼行业碳排查材料清单数据
  const inventoryItems = [
    { key: '1', name: '营业执照' },
    { key: '2', name: '排污许可证' },
    { key: '3', name: '组织机构图' },
    { key: '4', name: '厂区平面图' },
    { key: '5', name: '工艺流程图' },
    { key: '6', name: '备案的数据质量控制计划' },
    { key: '7', name: '氧化铝消耗量原始记录' },
    { key: '8', name: '预焙阳极消耗量原始记录' },
    { key: '9', name: '氟化盐消耗量原始记录' },
    { key: '10', name: '碳酸盐（石灰石、纯碱等）消耗量记录' },
    { key: '11', name: '化石燃料（煤、油、气等）消耗记录' },
    { key: '12', name: '柴油/汽油消耗原始记录' },
    { key: '13', name: '《能源购进、消费与库存表》' },
    { key: '14', name: '电解槽运行记录' },
    { key: '15', name: '阳极效应记录' },
    { key: '16', name: '电解槽电流强度记录' },
    { key: '17', name: '电解槽电压记录' },
    { key: '18', name: '预焙阳极工业分析报告' },
    { key: '19', name: '预焙阳极元素碳含量检测报告' },
    { key: '20', name: '碳酸盐组分分析报告' },
    { key: '21', name: '化石燃料工业分析报告' },
    { key: '22', name: '化石燃料元素分析报告' },
    { key: '23', name: '皮带秤校验记录' },
    { key: '24', name: '电子汽车衡检定证书' },
    { key: '25', name: '电子天平检定证书' },
    { key: '26', name: '碳氢分析仪维护记录' },
    { key: '27', name: '下网电量抄表记录' },
    { key: '28', name: '下网电量结算单' },
    { key: '29', name: '下网电力结算发票' },
    { key: '30', name: '下网电量电能表检定证书' },
    { key: '31', name: '余热发电量记录' },
    { key: '32', name: '自备电厂发电记录' },
    { key: '33', name: '铝产品产量台账' },
    { key: '34', name: '外购电力排放因子证明文件' }
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
        本模块用于上传铝冶炼行业碳排查所需的材料清单文件。请按照要求上传相关证明材料和记录文档。
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

export default AluminumCarbonInventory;