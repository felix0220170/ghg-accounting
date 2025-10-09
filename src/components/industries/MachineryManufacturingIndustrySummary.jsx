import { Table, Typography } from 'antd';
import { useState } from 'react';
import OtherEmissionSection from '../OtherEmissionSection';

const { Title } = Typography;

function MachineryManufacturingIndustrySummary({ data, onOtherEmissionChange }) {
  // 其他显著存在的排放源状态
  const [otherEmissions, setOtherEmissions] = useState([]);
  
  // 计算其他排放源总量
  const calculateOtherEmissionTotal = () => {
    return otherEmissions.reduce((total, item) => total + (item.value || 0), 0);
  };

  // 计算基础排放量（不包括电力和热力排放）
  const calculateBaseTotal = () => {
    const baseTotal = (
      (data.fossilFuelEmission || 0) +
      (data.electricalRefrigerationEmission || 0) +
      (data.weldingCO2Emission || 0) + // 添加CO2保护气焊接排放
      calculateOtherEmissionTotal() // 添加其他显著存在的排放源
    );
    return baseTotal;
  };
  
  // 计算总排放量（包括电力和热力排放）
  const calculateTotalWithElectricity = () => {
    return calculateBaseTotal() + (data.electricityHeatEmission || 0);
  };

  // 格式化数字显示
  const formatNumber = (value) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value || 0);
  };

  // 根据排放类型计算温室气体排放量（CO2e）
  const calculateCO2e = (type, value) => {
    // 直接使用原始值
    return value || 0;
  };

  // 表格数据 - 修复：只保留一个tableData定义，并包含CO2保护气焊接排放
  const tableData = [
    { key: '1', type: '化石燃料燃烧 CO2 排放', value: data.fossilFuelEmission || 0 },
    { key: '2', type: '电气与制冷设备生产的过程排放', value: data.electricalRefrigerationEmission || 0 },
    { key: '3', type: 'CO2作为保护气的焊接过程排放', value: data.weldingCO2Emission || 0 }, // 新增排放项
    { key: '4', type: '净购入电力和热力隐含的 CO2 排放', value: data.electricityHeatEmission || 0 },
    // 添加其他显著存在的排放源
    ...otherEmissions.map((item, index) => ({
      key: `other-${item.id}`,
      type: item.name || `其他显著存在的排放源 ${index + 1}`,
      value: item.value || 0,
      isOther: true
    }))
  ];

  // 计算两种总计
  const baseTotalEmission = calculateBaseTotal();
  const totalEmissionWithElectricity = calculateTotalWithElectricity();

  // 添加总计行
  const summaryData = [
    ...tableData,
    // 不包括电力热力排放的总计
    { 
      key: 'total-without-electricity', 
      type: '企业温室气体排放总量（不包括净购入电力和热力隐含的 CO2 排放）', 
      value: baseTotalEmission,
      style: { fontWeight: 'bold', backgroundColor: '#f0f2f5' }
    },
    // 包括电力热力排放的总计
    { 
      key: 'total-with-electricity', 
      type: '企业温室气体排放总量（包括净购入电力和热力隐含的 CO2 排放）', 
      value: totalEmissionWithElectricity,
      style: { fontWeight: 'bold', backgroundColor: '#f0f2f5' }
    }
  ];

  // 定义表格列配置
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '排放量（吨）',
      dataIndex: 'value',
      key: 'value',
      render: () => '-'
    },
    {
      title: '温室气体排放量（单位：吨 CO2e）',
      dataIndex: 'value',
      key: 'co2e',
      render: (value, record) => {
        const co2eValue = calculateCO2e(record.type, value);
        
        // 对其他排放源使用绿色显示
        if (record.isOther) {
          return <span style={{ color: '#52c41a' }}>{formatNumber(co2eValue)}</span>;
        }
        
        return formatNumber(co2eValue);
      }
    }
  ];

  // 处理其他排放源变化的回调函数
  const handleOtherEmissionChange = (emissions) => {
    setOtherEmissions(emissions);
    // 计算总计并传递给父组件
    const total = emissions.reduce((sum, item) => sum + (item.value || 0), 0);
    if (onOtherEmissionChange) {
      onOtherEmissionChange(total);
    }
  };

  return (
    <>
      {/* 计算公式显示区域 */}
      <div className="formula-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Title level={5}>计算公式</Title>
        <p><strong>排放量总计（不包括电力和热力）</strong> = 化石燃料燃烧 CO2 排放 + 电气与制冷设备生产的过程排放 + CO2作为保护气的焊接过程排放 + 其他显著存在的排放源</p>
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
        rowStyle={(record) => record.style || {}}
        title={() => <Title level={4}>温室气体排放汇总表</Title>}
      />
    </>
  );
}

export default MachineryManufacturingIndustrySummary;