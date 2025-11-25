import React from 'react';
import { Table, Typography, Divider } from 'antd';

const { Title, Text } = Typography;

const AluminumSummary = ({ emissionData = {} }) => {
  // 汇总表格数据
  const summaryData = [
    {
      key: 'fossil-fuel',
      排放来源: '化石燃料燃烧排放',
      排放量: emissionData.totalEmission || 0,
      单位: 'tCO₂',
      isAuxiliary: false
    },
    {
      key: 'carbon-anode',
      排放来源: '能源作为原材料用途排放',
      排放量: emissionData.carbonAnode || 0,
      单位: 'tCO₂',
      isAuxiliary: false
    },
    {
      key: 'anode-effect',
      排放来源: '电解铝工序阳极效应排放',
      排放量: emissionData.anodeEffect || 0,
      单位: 'tCO₂',
      isAuxiliary: false
    },
    {
      key: 'carbonate-decomposition',
      排放来源: '企业层级碳酸盐分解排放',
      排放量: emissionData.carbonateDecomposition || 0,
      单位: 'tCO₂',
      isAuxiliary: false
    },
    {
      key: 'other-emission',
      排放来源: '发电设施及其他非铝冶炼生产设施排放',
      排放量: emissionData.otherEmission || 0,
      单位: 'tCO₂',
      isAuxiliary: false
    }
  ];

  // 计算总排放量 - 排除净购入电力和热力产生的排放
  const totalEmission = summaryData.reduce((total, item) => {
    // 只累加非辅助报告项的排放量
    if (!item.isAuxiliary) {
      return total + (parseFloat(item.排放量) || 0);
    }
    return total;
  }, 0);

  // 为数据项添加占比信息
  const tableData = summaryData.map(item => ({
    ...item,
    占比: item.isAuxiliary ? '0.00' : (totalEmission > 0 ? ((item.排放量 / totalEmission) * 100).toFixed(2) : '0.00')
  }));

  // 增加合计行
  tableData.push({
    key: 'total',
    排放来源: '合计',
    排放量: totalEmission,
    单位: 'tCO₂',
    占比: '100.00',
    isAuxiliary: false
  });

  // 表格列配置
  const columns = [
    {
      title: '排放来源',
      dataIndex: '排放来源',
      key: '排放来源',
      render: (text, record) => (
        <span style={{ fontStyle: record.isAuxiliary ? 'italic' : 'normal' }}>
          {text}
          {record.isAuxiliary && <Text type="secondary">（辅助报告）</Text>}
        </span>
      ),
    },
    {
      title: '排放量',
      dataIndex: '排放量',
      key: '排放量',
      render: (text, record) => (
        <span style={{ 
          color: record.isAuxiliary ? '#8c8c8c' : 'inherit',
          fontStyle: record.isAuxiliary ? 'italic' : 'normal',
          fontWeight: record.key === 'total' ? 'bold' : 'normal'
        }}>
          {typeof text === 'number' ? text.toFixed(2) : text}
        </span>
      ),
    },
    {
      title: '单位',
      dataIndex: '单位',
      key: '单位',
    },
    {
      title: '占比(%)',
      dataIndex: '占比',
      key: '占比',
      render: (text, record) => (
        <span style={{ 
          color: record.isAuxiliary ? '#8c8c8c' : 'inherit',
          fontStyle: record.isAuxiliary ? 'italic' : 'normal',
          fontWeight: record.key === 'total' ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>温室气体排放汇总表</Title>
      <Text type="secondary">本汇总表展示铝冶炼企业各类温室气体排放情况</Text>
      
      <Table 
        columns={columns} 
        dataSource={tableData} 
        pagination={false} 
        rowKey="key"
        rowClassName={(record) => record.key === 'total' ? 'total-row' : ''}
        footer={() => (
          <div>
            {/* 移除净购入电力和热力产生的排放相关的辅助说明 */}
          </div>
        )}
      />
      
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <Title level={5}>说明</Title>
        <ul>
          <li>化石燃料燃烧排放：包括所有工序固定燃烧设备和移动燃烧设备的CO2排放</li>
          <li>工业生产过程排放-阳极效应排放：主要包括电解铝生产过程中阳极效应产生的CF4和C2F6等PFCs温室气体排放</li>
          <li>工业生产过程排放-碳酸盐分解：主要包括铝冶炼过程中碳酸盐（如石灰石、纯碱等）分解产生的CO2排放</li>
          <li>能源作为原材料用途排放：主要包括碳阳极消耗产生的CO2排放</li>
          <li>发电设施及其他非铝冶炼生产设施排放：主要包括企业内部发电设施及其他非铝冶炼生产设施产生的CO2排放</li>
          {/* 移除净购入电力和热力产生的排放说明 */}
        </ul>
      </div>
    </div>
  );
};

export default AluminumSummary;