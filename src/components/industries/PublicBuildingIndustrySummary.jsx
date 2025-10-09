import { Table, Typography } from 'antd';
import { useState } from 'react';
import OtherEmissionSection from '../OtherEmissionSection';

const { Title } = Typography;

function PublicBuildingIndustrySummary({ data, onOtherEmissionChange }) {
  // 其他显著存在的排放源状态
  const [otherEmissions, setOtherEmissions] = useState([]);
  
  // 计算其他排放源总量
  const calculateOtherEmissionTotal = () => {
    return otherEmissions.reduce((total, item) => total + (item.value || 0), 0);
  };

  // 处理其他排放源变化
  const handleOtherEmissionChange = (emissions) => {
    setOtherEmissions(emissions);
    const total = calculateOtherEmissionTotal();
    if (onOtherEmissionChange) {
      onOtherEmissionChange(total);
    }
  };

  // 计算基础排放量（不包括电力和热力排放）
  const calculateBaseTotal = () => {
    const baseTotal = (
      (data.fossilFuelEmission || 0) +
      calculateOtherEmissionTotal() // 添加其他显著存在的排放源
    );
    return baseTotal;
  };

  // 计算总排放量（包括电力和热力排放）
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + (data.electricityHeatEmission || 0);
  };

  // 温室气体排放量计算
  const calculateCO2e = (key, value) => {
    // 公共建筑行业主要是CO2排放，无需额外转换因子
    return value;
  };

  // 格式化数字显示
  const formatNumber = (value) => {
    return typeof value === 'number' ? value.toFixed(8) : '0.00000000';
  };

  // 表格数据
  const tableData = [
    {
      key: 'fossil-fuel',
      name: '化石燃料燃烧 CO2 排放',
      value: data.fossilFuelEmission || 0,
      co2e: calculateCO2e('fossilFuelEmission', data.fossilFuelEmission || 0)
    },
    {
      key: 'electricity-heat',
      name: '净购入电力和热力隐含的 CO2 排放',
      value: data.electricityHeatEmission || 0,
      co2e: calculateCO2e('electricityHeatEmission', data.electricityHeatEmission || 0)
    }
  ];

  // 如果有其他排放源，添加到表格数据中
  if (calculateOtherEmissionTotal() > 0) {
    tableData.push({
      key: 'other-emission',
      name: '其他显著存在的排放源',
      value: calculateOtherEmissionTotal(),
      co2e: calculateOtherEmissionTotal()
    });
  }

  // 添加总计行
  const summaryData = [
    ...tableData,
    {
      key: 'total-base',
      name: '企业温室气体排放总量（不包括净购入电力和热力隐含的 CO2 排放）',
      value: '-',
      co2e: calculateBaseTotal(),
      isTotal: true
    },
    {
      key: 'total-all',
      name: '企业温室气体排放总量（包括净购入电力和热力隐含的 CO2 排放）',
      value: '-',
      co2e: calculateTotalWithElectricity(),
      isTotal: true
    }
  ];

  // 表格列配置
  const columns = [
    {
      title: '排放类型',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={record.isTotal ? { fontWeight: 'bold' } : {}}>{text}</div>
      )
    },
    {
      title: '排放量',
      dataIndex: 'value',
      key: 'value',
      render: (value) => formatNumber(value)
    },
    {
      title: 'CO2当量（吨）',
      dataIndex: 'co2e',
      key: 'co2e',
      render: (co2e, record) => (
        <div style={{
          fontWeight: record.isTotal ? 'bold' : '',
          color: record.isTotal ? '#1890ff' : ''
        }}>
          {formatNumber(co2e)}
        </div>
      )
    }
  ];

  return (
    <>
      {/* 计算公式显示区域 */}
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>计算公式</Title>
        <p><strong>排放量总计（不包括电力和热力）</strong> = 化石燃料燃烧 CO2 排放 + 其他显著存在的排放源</p>
        <p><strong>排放量总计（包括电力和热力）</strong> = 排放量总计（不包括电力和热力） + 净购入电力和热力隐含的 CO2 排放</p>
      </div>
      
      {/* 使用公用的其他显著存在的排放源添加区域组件 */}
      <OtherEmissionSection 
        initialEmissions={otherEmissions}
        onChange={handleOtherEmissionChange}
      />
      
      {/* 排放汇总表格 */}
      <Table 
        columns={columns} 
        dataSource={summaryData}
        pagination={false}
        size="small"
        rowStyle={(record) => record.isTotal ? { backgroundColor: '#f0f2f5' } : {}}
        title={() => <Title level={4}>温室气体排放汇总表</Title>}
      />
    </>
  );
}

export default PublicBuildingIndustrySummary;