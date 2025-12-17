import React, { useState } from 'react';
import { Card, Typography, Table, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

function GlassCarbonInventory() {
  // 平板玻璃生产企业碳排查材料清单数据
  const inventoryItems = [
    { key: '1', name: '营业执照' },
    { key: '2', name: '排污许可证' },
    { key: '3', name: '组织机构图' },
    { key: '4', name: '厂区平面图' },
    { key: '5', name: '平板玻璃主要生产工艺流程图' },
    { key: '6', name: '备案的数据质量控制计划' },
    { key: '7', name: '化石燃料（煤、油、气等）消耗量原始记录' },
    { key: '8', name: '玻璃原料（硅砂、纯碱、石灰石、白云石、碳粉等）消耗记录和台账' },
    { key: '9', name: '月度原材料盘点表' },
    { key: '10', name: '化石燃料、原材料等结算发票' },
    { key: '11', name: '燃料油/汽油/柴油消耗原始记录' },
    { key: '12', name: '《能源购进、消费与库存表》' },
    { key: '13', name: '平板玻璃主要生产装置运行记录' },
    { key: '14', name: '原料配料工序记录' },
    { key: '15', name: '玻璃熔窑运行记录' },
    { key: '16', name: '锡槽运行记录' },
    { key: '17', name: '退火窑运行记录' },
    { key: '18', name: '入厂原材料成分分析报告（硅砂、纯碱、石灰石、白云石、碳粉等）' },
    { key: '19', name: '产品质量检验报告（平板玻璃等）' },
    { key: '20', name: '化石燃料元素分析报告' },
    { key: '21', name: '碳酸盐原料成分分析报告（特别是CaCO3、MgCO3含量）' },
    { key: '22', name: '碳粉含碳量分析报告' },
    { key: '23', name: '熔窑废气排放监测记录' },
    { key: '24', name: '原料配料中碳粉消耗量记录' },
    { key: '25', name: '外购原材料采购合同和发票' },
    { key: '26', name: '流量计校验记录' },
    { key: '27', name: '电子地磅检定证书' },
    { key: '28', name: '分析仪器校准记录' },
    { key: '29', name: '电力消耗抄表记录' },
    { key: '30', name: '热力消耗结算单' },
    { key: '31', name: '电力热力结算发票' },
    { key: '32', name: '电表/热量表检定证书' },
    { key: '33', name: '废气排放连续监测系统(CEMS)运行记录' },
    { key: '34', name: '产品产量台账（平板玻璃等）' },
    { key: '35', name: '外购电力排放因子证明文件' },
    { key: '36', name: '主要生产设备台账' }
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
        本模块用于上传平板玻璃生产企业碳排查所需的材料清单文件。请按照要求上传相关证明材料和记录文档。
        所有材料为碳排查工作的必要支持文件，用于数据质量控制和审核。重点关注玻璃熔窑运行、原料配料、
        碳粉消耗和化石燃料燃烧等环节的相关记录。
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

export default GlassCarbonInventory;