import React, { useState } from 'react';
import { Card, Table, InputNumber, Input, Upload, Button } from 'antd';

// 月份数组
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 排放因子默认值
const DEFAULT_ELECTRICITY_EMISSION_FACTOR = 0.5366;
const DEFAULT_HEAT_EMISSION_FACTOR = 0.11;

// 初始化月度数据的简单函数
const initMonthData = () => {
  const data = {};
  MONTHS.forEach(month => {
    data[month] = '';
  });
  return data;
};

// 简化版组件 - 完全避免复杂的hooks依赖和无限更新循环
const NetElectricityHeatEmission = ({ onEmissionChange, initialData = {} }) => {
  // 简单状态管理 - 为排放因子也使用月度数据结构
  const [electricityPurchase, setElectricityPurchase] = useState(initialData.electricityNetPurchase || initMonthData());
  // 系统级排放因子设置
  const [systemElectricityFactor, setSystemElectricityFactor] = useState(
    initialData.systemElectricityFactor || DEFAULT_ELECTRICITY_EMISSION_FACTOR
  );
  
  const [systemHeatFactor, setSystemHeatFactor] = useState(
    initialData.systemHeatFactor || DEFAULT_HEAT_EMISSION_FACTOR
  );
  
  // 生成电力排放因子的月度数据（全部使用系统设置值）
  const getElectricityFactorData = () => {
    const data = {};
    MONTHS.forEach(month => {
      data[month] = systemElectricityFactor;
    });
    return data;
  };
  
  // 生成热力排放因子的月度数据（全部使用系统设置值）
  const getHeatFactorData = () => {
    const data = {};
    MONTHS.forEach(month => {
      data[month] = systemHeatFactor;
    });
    return data;
  };
  
  const [heatPurchase, setHeatPurchase] = useState(initialData.heatNetPurchase || initMonthData());
  // 热力排放因子直接使用系统设置值，不再需要月度状态管理
  
  const [electricitySource, setElectricitySource] = useState(initialData.electricityDataSource || '');
  const [heatSource, setHeatSource] = useState(initialData.heatDataSource || '');
  
  // 支持材料文件列表 - 简单状态
  const [electricityPurchaseFiles, setElectricityPurchaseFiles] = useState([]);
  const [electricityFactorFiles, setElectricityFactorFiles] = useState([]);
  const [heatPurchaseFiles, setHeatPurchaseFiles] = useState([]);
  const [heatFactorFiles, setHeatFactorFiles] = useState([]);

  // 简单的事件处理函数
  const handleElectricityPurchaseChange = (month, value) => {
    const newData = { ...electricityPurchase, [month]: value };
    setElectricityPurchase(newData);
    // 直接更新父组件
    updateParentComponent(newData, electricityFactor, heatPurchase, heatFactor);
  };

  // 处理系统电力排放因子变化
  const handleSystemElectricityFactorChange = (value) => {
    setSystemElectricityFactor(value);
    // 更新父组件
    updateParentComponent(electricityPurchase, getElectricityFactorData(), heatPurchase, heatFactor);
  };

  const handleHeatPurchaseChange = (month, value) => {
    const newData = { ...heatPurchase, [month]: value };
    setHeatPurchase(newData);
    updateParentComponent(electricityPurchase, electricityFactor, newData, heatFactor);
  };

  // 处理系统热力排放因子变化
  const handleSystemHeatFactorChange = (value) => {
    setSystemHeatFactor(value);
    // 更新父组件
    updateParentComponent(electricityPurchase, getElectricityFactorData(), getHeatFactorData(), heatFactor);
  };

  // 计算汇总数据的简单函数 - 每次调用时重新计算，避免缓存依赖问题
  const calculateSummary = () => {
    // 计算电力全年值
    const electricityTotal = MONTHS.reduce((sum, month) => {
      const value = parseFloat(electricityPurchase[month]) || 0;
      return sum + value;
    }, 0);

    // 计算热力全年值
    const heatTotal = MONTHS.reduce((sum, month) => {
      const value = parseFloat(heatPurchase[month]) || 0;
      return sum + value;
    }, 0);

    // 计算电力排放量（使用系统设置的排放因子）
    const electricityEmission = MONTHS.reduce((sum, month) => {
      const purchase = parseFloat(electricityPurchase[month]) || 0;
      const factor = parseFloat(systemElectricityFactor) || 0;
      return sum + (purchase * factor / 1000);
    }, 0);

    // 计算热力排放量（使用系统设置的排放因子）
    const heatEmission = MONTHS.reduce((sum, month) => {
      const purchase = parseFloat(heatPurchase[month]) || 0;
      const factor = parseFloat(systemHeatFactor) || 0;
      return sum + (purchase * factor / 1000);
    }, 0);

    // 计算总排放量
    const totalEmission = electricityEmission + heatEmission;

    return {
      electricityTotal,
      heatTotal,
      electricityEmission,
      heatEmission,
      totalEmission
    };
  };

  // 直接更新父组件的函数，避免useEffect依赖问题
  const updateParentComponent = (elecPurchase, elecFactor, heatPur, heatFac) => {
    if (onEmissionChange) {
      // 计算汇总数据
      const electricityTotal = MONTHS.reduce((sum, month) => sum + (parseFloat(elecPurchase[month]) || 0), 0);
      const heatTotal = MONTHS.reduce((sum, month) => sum + (parseFloat(heatPur[month]) || 0), 0);
      
      // 计算电力排放量（使用系统设置的排放因子）
      const electricityEmission = MONTHS.reduce((sum, month) => {
        const purchase = parseFloat(elecPurchase[month]) || 0;
        const factor = parseFloat(systemElectricityFactor) || 0;
        return sum + (purchase * factor / 1000);
      }, 0);
      
      // 计算热力排放量（使用系统设置的排放因子）
      const heatEmission = MONTHS.reduce((sum, month) => {
        const purchase = parseFloat(heatPur[month]) || 0;
        const factor = parseFloat(systemHeatFactor) || 0;
        return sum + (purchase * factor / 1000);
      }, 0);
      
      const totalEmission = electricityEmission + heatEmission;
      
      onEmissionChange({
        electricityNetPurchase: elecPurchase,
        systemElectricityFactor: systemElectricityFactor,
        electricityTotalAmount: electricityTotal,
        electricityEmission: electricityEmission,
        heatNetPurchase: heatPur,
        systemHeatFactor: systemHeatFactor,
        heatTotalAmount: heatTotal,
        heatEmission: heatEmission,
        electricityDataSource: electricitySource,
        heatDataSource: heatSource,
        totalEmission: totalEmission
      });
    }
  };

  // 简单的上传配置函数 - 避免复杂的闭包和依赖
  const getUploadPropsForElectricityPurchase = () => ({
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ fileList }) {
      setElectricityPurchaseFiles(fileList);
    },
    fileList: electricityPurchaseFiles
  });

  // 移除电力排放因子上传功能，因为现在是系统设置

  const getUploadPropsForHeatPurchase = () => ({
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ fileList }) {
      setHeatPurchaseFiles(fileList);
    },
    fileList: heatPurchaseFiles
  });

  // 移除热力排放因子上传功能，因为现在是系统设置

  // 获取汇总数据
  const summary = calculateSummary();

  // 格式化排放量显示
  const formatEmission = (value) => value.toFixed(2);

  // 系统设置的电力排放因子全年值就是系统设置值
  const getSystemElectricityFactor = () => systemElectricityFactor;
  
  // 系统设置的热力排放因子全年值就是系统设置值
  const getSystemHeatFactor = () => systemHeatFactor;

  // 简单的表格数据构建
  const tableData = [
    {
      key: 'electricity-purchase',
      信息项: '净电（化石）净购入量',
      单位: 'KWH',
      ...electricityPurchase,
      全年值: summary.electricityTotal,
      获取方式: '计算值',
      数据来源: (
        <Input 
          value={electricitySource} 
          onChange={(e) => setElectricitySource(e.target.value)} 
          placeholder="请输入数据来源"
        />
      )
    },
    {
      key: 'heat-purchase',
      信息项: '净热净购入量',
      单位: 'GJ',
      ...heatPurchase,
      全年值: summary.heatTotal,
      获取方式: '计算值',
      数据来源: (
        <Input 
          value={heatSource} 
          onChange={(e) => setHeatSource(e.target.value)} 
          placeholder="请输入数据来源"
        />
      )
    },
    // 热力排放因子已移至系统设置区域，不再需要表格行
    {
      key: 'electricity-emission',
      信息项: '电力CO2排放量',
      单位: 'tCO2',
      全年值: formatEmission(summary.electricityEmission),
      获取方式: '计算值',
      数据来源: '-'
    },
    {
      key: 'heat-emission',
      信息项: '热力CO2排放量',
      单位: 'tCO2',
      全年值: formatEmission(summary.heatEmission),
      获取方式: '计算值',
      数据来源: '-'
    },
    {
      key: 'total-emission',
      信息项: 'CO2排放总量',
      单位: 'tCO2',
      全年值: formatEmission(summary.totalEmission),
      获取方式: '计算值',
      数据来源: '-'
    }
  ];

  // 手动构建月份列，避免复杂的map和闭包
  const columns = [
    { title: '信息项', dataIndex: '信息项', key: '信息项', width: 180 },
    { title: '单位', dataIndex: '单位', key: '单位', width: 100 }
  ];

  // 添加月份列，使用简单函数渲染
  MONTHS.forEach(month => {
    columns.push({
      title: month,
      dataIndex: month,
      key: month,
      width: 80,
      render: (text, record) => {
        // 处理排放量行 - 直接计算并显示
        if (record.key === 'electricity-emission') {
          const monthlyValue = parseFloat(electricityPurchase[month]) || 0;
          const systemFactor = parseFloat(systemElectricityFactor) || 0;
          return ((monthlyValue * systemFactor) / 1000).toFixed(2);
        } else if (record.key === 'heat-emission') {
          const monthlyValue = parseFloat(heatPurchase[month]) || 0;
          const systemFactor = parseFloat(systemHeatFactor) || 0;
          return ((monthlyValue * systemFactor) / 1000).toFixed(2);
        } else if (record.key === 'total-emission') {
          const elecValue = parseFloat(electricityPurchase[month]) || 0;
          const heatValue = parseFloat(heatPurchase[month]) || 0;
          const systemElecFactor = parseFloat(systemElectricityFactor) || 0;
          const systemHeatFac = parseFloat(systemHeatFactor) || 0;
          const elecEmission = elecValue * systemElecFactor / 1000;
          const heatEmission = heatValue * systemHeatFac / 1000;
          return (elecEmission + heatEmission).toFixed(2);
        }
        
        // 热力排放因子已移至系统设置，不再需要月度输入框
        
        // 处理数据输入行
        if (record.key === 'electricity-purchase') {
          return (
            <InputNumber
              min={0}
              step={0.01}
              value={text}
              onChange={(value) => handleElectricityPurchaseChange(month, value)}
              style={{ width: '100%' }}
            />
          );
        } else if (record.key === 'heat-purchase') {
          return (
            <InputNumber
              min={0}
              step={0.01}
              value={text}
              onChange={(value) => handleHeatPurchaseChange(month, value)}
              style={{ width: '100%' }}
            />
          );
        }
        
        // 其他情况直接返回文本
        return text;
      }
    });
  });

  // 添加其他列
  columns.push(
    { 
      title: '全年值', 
      dataIndex: '全年值', 
      key: '全年值', 
      width: 100,
      render: (text) => typeof text === 'number' ? text.toFixed(2) : text
    },
    { title: '获取方式', dataIndex: '获取方式', key: '获取方式', width: 100 },
    { title: '数据来源', dataIndex: '数据来源', key: '数据来源', width: 150 },
    {
      title: '支持材料',
      key: 'supporting-material',
      width: 150,
      render: (_, record) => {
        // 为特定行显示上传组件
        if (record.key === 'electricity-purchase') {
          return <Upload {...getUploadPropsForElectricityPurchase()}><Button>上传</Button></Upload>;
        } else if (record.key === 'heat-purchase') {
          return <Upload {...getUploadPropsForHeatPurchase()}><Button>上传</Button></Upload>;
        }
        return null;
      }
    }
  );

  return (
    <div className="net-electricity-heat-emission">
      <Card title="购入净电（化石）和净热" style={{ marginBottom: 20 }}>
        {/* 系统级排放因子设置 */}
        <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f5ff', borderRadius: 4 }}>
          <h4 style={{ marginBottom: 10 }}>系统设置：排放因子</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
            <span>电力排放因子（kgCO2/KWH）：</span>
            <InputNumber
              min={0}
              step={0.0001}
              value={systemElectricityFactor}
              onChange={handleSystemElectricityFactorChange}
              style={{ width: 150 }}
              placeholder="请输入排放因子"
            />
            <span style={{ color: '#888', fontSize: '12px' }}>（系统级别设置，默认值：0.5366 kgCO2/KWH）</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>热力排放因子（kgCO2/GJ）：</span>
            <InputNumber
              min={0}
              step={0.0001}
              value={systemHeatFactor}
              onChange={handleSystemHeatFactorChange}
              style={{ width: 150 }}
              placeholder="请输入排放因子"
            />
            <span style={{ color: '#888', fontSize: '12px' }}>（系统级别设置，默认值：0.11 kgCO2/GJ）</span>
          </div>
        </div>
        <Table 
          columns={columns} 
          dataSource={tableData} 
          pagination={false} 
          rowKey="key" 
          scroll={{ x: 'max-content' }}
        />
        
        <div style={{ marginTop: 20, padding: 15, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          <h4>计算说明：</h4>
          <ul>
            <li>净电（化石）CO2排放量 = 净电（化石）净购入量 × 电力排放因子 / 1000</li>
          <li>净热CO2排放量 = 净热净购入量 × 热力排放因子 / 1000</li>
          <li>电力排放因子通过系统设置，默认值为 0.5366 kgCO2/KWH</li>
          <li>热力排放因子通过系统设置，默认值为 0.11 kgCO2/GJ</li>
          <li>全年值为各月份数据的合计</li>
          </ul>
        </div>
      </Card>
      
      <style jsx>{`
        .net-electricity-heat-emission {
          font-family: Arial, sans-serif;
        }
        
        .ant-table-thead > tr > th {
          background-color: #fafafa;
          font-weight: 500;
        }
        
        .ant-table-tbody > tr:last-child > td {
          font-weight: bold;
          background-color: #f0f5ff;
        }
      `}</style>
    </div>
  );
};

export default NetElectricityHeatEmission;