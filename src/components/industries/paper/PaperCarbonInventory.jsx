import React, { useState } from 'react';
import { Card, Typography, Table, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

function PaperCarbonInventory() {
  // 造纸和纸制品企业碳核查资料清单数据
  const inventoryItems = [
    { 
      key: '1', 
      name: '企业基本信息', 
      description: '营业执照、组织机构代码证、生产许可证、企业产权证明、厂区平面图、生产工艺流程图', 
      required: true,
      category: '基本信息'
    },
    { 
      key: '2', 
      name: '化石燃料燃烧相关资料', 
      description: '煤炭、柴油、天然气、汽油等燃料采购发票、消耗记录、计量表读数、锅炉运行记录、燃料热值检测报告', 
      required: true,
      category: '化石燃料燃烧排放'
    },
    { 
      key: '3', 
      name: '工业生产过程中排放相关资料', 
      description: '生产工艺参数记录、原材料消耗记录（特别是碳酸盐类原料）、产品产量记录、生产过程排放监测报告、外购工业生产的二氧化碳作为原料的采购记录和使用损耗记录', 
      required: true,
      category: '工业生产过程中排放'
    },
    { 
      key: '4', 
      name: '废水厌氧处理排放相关资料', 
      description: '废水量记录、进水和出水COD浓度检测报告、污泥处理记录、厌氧处理工艺参数记录', 
      required: true,
      category: '废水厌氧处理排放'
    },
    { 
      key: '5', 
      name: '电力和热力采购记录', 
      description: '电费发票、电力供应合同、购售电结算凭证、热力供应合同及发票、能源购入明细账', 
      required: true,
      category: '净购入电力和热力排放'
    },
    { 
      key: '6', 
      name: '生产运营记录', 
      description: '生产台账、产量统计、设备运行记录、班次记录、工艺参数记录、质量检验记录', 
      required: true,
      category: '运营数据'
    },
    { 
      key: '7', 
      name: '能源计量设备资料', 
      description: '计量器具检定证书、计量设备台账、能源计量系统记录、抄表记录、计量设备维护保养记录', 
      required: true,
      category: '计量管理'
    },
    { 
      key: '8', 
      name: '节能改造和技术资料', 
      description: '节能项目实施记录、技术改造方案、节能效果评估报告、新设备技术参数、节能监测数据', 
      required: false,
      category: '节能管理'
    },
    { 
      key: '9', 
      name: '环保合规资料', 
      description: '环境影响评价报告、环保设施运行记录、污染物排放监测报告、环境管理体系认证证书', 
      required: true,
      category: '环保合规'
    },
    { 
      key: '10', 
      name: '第三方检测和审计资料', 
      description: '能源审计报告、第三方检测报告、温室气体核查报告、碳排放核查报告、质量管理体系认证', 
      required: false,
      category: '第三方验证'
    }
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
      title: '资料类别', 
      dataIndex: 'category', 
      key: 'category',
      width: 120,
      render: (category) => (
        <span style={{ 
          fontSize: '11px', 
          backgroundColor: '#f0f0f0', 
          padding: '2px 6px', 
          borderRadius: '3px',
          color: '#666'
        }}>
          {category}
        </span>
      )
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
      width: 350
    },
    { 
      title: '是否必填', 
      dataIndex: 'required', 
      key: 'required',
      width: 80,
      render: (required) => (
        <span style={{ color: required ? '#ff4d4f' : '#52c41a' }}>
          {required ? '是' : '否'}
        </span>
      )
    },
    { 
      title: '上传文件', 
      key: 'upload',
      render: (_, record) => renderInventoryUploader(record)
    }
  ];

  return (
    <Card title="造纸和纸制品企业碳核查资料清单" style={{ marginBottom: '20px' }}>
      <Title level={5}>资料清单说明</Title>
      <Paragraph>
        本模块用于上传造纸和纸制品企业碳核查所需的资料清单文件。涵盖了纸浆制造、造纸和纸制品加工等生产活动。
      </Paragraph>
      <Paragraph>
        <strong>核算范围：</strong>
      </Paragraph>
      <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
        <li>化石燃料燃烧排放</li>
        <li>工业生产过程中排放（主要为石灰石分解产生的CO₂排放）</li>
        <li>废水厌氧处理排放</li>
        <li>净购入电力和热力隐含的CO₂排放</li>
      </ul>
      <Paragraph>
        请按照要求上传相关证明材料和记录文档。所有资料为碳核查工作的必要支持文件，用于数据质量控制和审核。重点关注化石燃料使用、工业生产过程（特别是石灰石消耗）、废水厌氧处理以及购入能源等相关记录，确保碳排放核算的准确性和完整性。
      </Paragraph>
      <Paragraph style={{ fontSize: '12px', color: '#666', marginTop: '10px', padding: '8px', backgroundColor: '#f5f5f5', borderLeft: '3px solid #1890ff' }}>
        <strong>重要说明：</strong>根据造纸和纸制品企业核算指南，请确保所有排放源数据的完整性和准确性，特别是工业生产过程中石灰石分解产生的CO₂排放和废水厌氧处理排放的计算。所有计量设备应定期检定，数据记录应规范完整。
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

export default PaperCarbonInventory;
