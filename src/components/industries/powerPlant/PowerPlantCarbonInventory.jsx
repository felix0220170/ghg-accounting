import React, { useState } from 'react';
import { Card, Table, Upload, Button, Input } from 'antd';

const PowerPlantCarbonInventory = ({ units = [], emissionData = {} }) => {
  // 材料清单数据
  const [materials, setMaterials] = useState([
    {
      key: 'fuel-consumption',
      name: '燃料消耗量记录',
      description: '各机组、各燃料的月度和年度消耗量记录',
      fileList: []
    },
    {
      key: 'fuel-analysis',
      name: '燃料成分分析报告',
      description: '燃料低位热值、元素分析等数据',
      fileList: []
    },
    {
      key: 'electricity-purchase',
      name: '电力购入凭证',
      description: '各机组电力购入发票、结算单等',
      fileList: []
    },
    {
      key: 'production-statistics',
      name: '生产统计报表',
      description: '各机组发电量、负荷率等生产数据',
      fileList: []
    },
    {
      key: 'emission-factor',
      name: '排放因子数据来源',
      description: '电力排放因子等参数的来源文件',
      fileList: []
    },
    {
      key: 'monitoring-record',
      name: '在线监测记录',
      description: '烟气在线监测系统数据记录',
      fileList: []
    }
  ]);

  // 处理文件上传
  const handleUploadChange = (key, { fileList }) => {
    setMaterials(prev => 
      prev.map(item => 
        item.key === key ? { ...item, fileList } : item
      )
    );
  };

  // 获取上传配置
  const getUploadProps = (key) => ({
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange: (info) => handleUploadChange(key, info),
    fileList: materials.find(item => item.key === key)?.fileList || []
  });

  // 表格列配置
  const columns = [
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
      title: '支持文件',
      key: 'file',
      render: (_, record) => (
        <Upload {...getUploadProps(record.key)}>
          <Button>上传文件</Button>
        </Upload>
      )
    }
  ];

  return (
    <div className="power-plant-carbon-inventory">
      <Card title="发电设施碳排查材料清单">
        <Table
          columns={columns}
          dataSource={materials}
          pagination={false}
          rowKey="key"
        />
        
        <div style={{ marginTop: 30, padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <h4 style={{ marginBottom: 15 }}>材料清单说明：</h4>
          <p style={{ marginBottom: 10 }}>1. 发电设施碳排查需准备的基础材料包括但不限于上述清单</p>
          <p style={{ marginBottom: 10 }}>2. 所有材料应保证数据的准确性、完整性和可追溯性</p>
          <p style={{ marginBottom: 10 }}>3. 建议保存原始记录和凭证，以备核查</p>
          <p>4. 对于不同类型的机组，可根据实际情况调整材料清单</p>
        </div>
      </Card>
    </div>
  );
};

export default PowerPlantCarbonInventory;