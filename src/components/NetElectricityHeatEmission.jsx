import React, { useState } from 'react';
import { Card, Table, InputNumber, Input, Upload, Button } from 'antd';

// 月份数组
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 电力排放因子默认值
const DEFAULT_ELECTRICITY_EMISSION_FACTOR = 0.5366;

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
  // 初始化月度电力排放因子，默认都使用DEFAULT_ELECTRICITY_EMISSION_FACTOR
  const initElectricityFactorData = () => {
    const data = {};
    MONTHS.forEach(month => {
      data[month] = initialData.electricityEmissionFactor || DEFAULT_ELECTRICITY_EMISSION_FACTOR;
    });
    return data;
  };
  const [electricityFactor, setElectricityFactor] = useState(initElectricityFactorData());
  
  const [heatPurchase, setHeatPurchase] = useState(initialData.heatNetPurchase || initMonthData());
  // 初始化月度热力排放因子
  const initHeatFactorData = () => {
    const data = {};
    MONTHS.forEach(month => {
      data[month] = initialData.heatEmissionFactor || '';
    });
    return data;
  };
  const [heatFactor, setHeatFactor] = useState(initHeatFactorData());
  
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

  const handleElectricityFactorChange = (month, value) => {
    const newData = { ...electricityFactor, [month]: value };
    setElectricityFactor(newData);
    updateParentComponent(electricityPurchase, newData, heatPurchase, heatFactor);
  };

  const handleHeatPurchaseChange = (month, value) => {
    const newData = { ...heatPurchase, [month]: value };
    setHeatPurchase(newData);
    updateParentComponent(electricityPurchase, electricityFactor, newData, heatFactor);
  };

  const handleHeatFactorChange = (month, value) => {
    const newData = { ...heatFactor, [month]: value };
    setHeatFactor(newData);
    updateParentComponent(electricityPurchase, electricityFactor, heatPurchase, newData);
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

    // 计算电力排放量（使用月度排放因子）
    const electricityEmission = MONTHS.reduce((sum, month) => {
      const purchase = parseFloat(electricityPurchase[month]) || 0;
      const factor = parseFloat(electricityFactor[month]) || 0;
      return sum + (purchase * factor / 1000);
    }, 0);

    // 计算热力排放量（使用月度排放因子）
    const heatEmission = MONTHS.reduce((sum, month) => {
      const purchase = parseFloat(heatPurchase[month]) || 0;
      const factor = parseFloat(heatFactor[month] || 0);
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
      
      // 计算电力排放量（使用月度排放因子）
      const electricityEmission = MONTHS.reduce((sum, month) => {
        const purchase = parseFloat(elecPurchase[month]) || 0;
        const factor = parseFloat(elecFactor[month]) || 0;
        return sum + (purchase * factor / 1000);
      }, 0);
      
      // 计算热力排放量（使用月度排放因子）
      const heatEmission = MONTHS.reduce((sum, month) => {
        const purchase = parseFloat(heatPur[month]) || 0;
        const factor = parseFloat(heatFac[month] || 0);
        return sum + (purchase * factor / 1000);
      }, 0);
      
      const totalEmission = electricityEmission + heatEmission;
      
      onEmissionChange({
        electricityNetPurchase: elecPurchase,
        electricityEmissionFactor: elecFactor,
        electricityTotalAmount: electricityTotal,
        electricityEmission: electricityEmission,
        heatNetPurchase: heatPur,
        heatEmissionFactor: heatFac,
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

  const getUploadPropsForElectricityFactor = () => ({
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ fileList }) {
      setElectricityFactorFiles(fileList);
    },
    fileList: electricityFactorFiles
  });

  const getUploadPropsForHeatPurchase = () => ({
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ fileList }) {
      setHeatPurchaseFiles(fileList);
    },
    fileList: heatPurchaseFiles
  });

  const getUploadPropsForHeatFactor = () => ({
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange({ fileList }) {
      setHeatFactorFiles(fileList);
    },
    fileList: heatFactorFiles
  });

  // 获取汇总数据
  const summary = calculateSummary();

  // 格式化排放量显示
  const formatEmission = (value) => value.toFixed(2);

  // 计算电力排放因子的平均值作为全年值
  const getAverageElectricityFactor = () => {
    const validFactors = MONTHS.map(month => parseFloat(electricityFactor[month]) || 0)
      .filter(factor => factor > 0);
    if (validFactors.length === 0) return 0;
    return validFactors.reduce((sum, factor) => sum + factor, 0) / validFactors.length;
  };
  
  // 计算热力排放因子的平均值作为全年值
  const getAverageHeatFactor = () => {
    const validFactors = MONTHS.map(month => parseFloat(heatFactor[month]) || 0)
      .filter(factor => factor > 0);
    if (validFactors.length === 0) return '';
    return validFactors.reduce((sum, factor) => sum + factor, 0) / validFactors.length;
  };

  // 简单的表格数据构建
  const tableData = [
    {
      key: 'electricity-purchase',
      信息项: '净电净购入量',
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
      key: 'electricity-factor',
      信息项: '电力排放因子',
      单位: 'kgCO2/KWH',
      ...electricityFactor,
      全年值: getAverageElectricityFactor(),
      获取方式: '计算值',
      数据来源: '默认值，可修改'
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
    {
      key: 'heat-factor',
      信息项: '热力排放因子',
      单位: 'kgCO2/GJ',
      ...heatFactor,
      全年值: getAverageHeatFactor(),
      获取方式: '计算值',
      数据来源: '用户输入'
    },
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
          const monthlyFactor = parseFloat(electricityFactor[month]) || 0;
          return ((monthlyValue * monthlyFactor) / 1000).toFixed(2);
        } else if (record.key === 'heat-emission') {
          const monthlyValue = parseFloat(heatPurchase[month]) || 0;
          const monthlyFactor = parseFloat(heatFactor[month]) || 0;
          return ((monthlyValue * monthlyFactor) / 1000).toFixed(2);
        } else if (record.key === 'total-emission') {
          const elecValue = parseFloat(electricityPurchase[month]) || 0;
          const heatValue = parseFloat(heatPurchase[month]) || 0;
          const elecFactor = parseFloat(electricityFactor[month]) || 0;
          const heatFac = parseFloat(heatFactor[month]) || 0;
          const elecEmission = elecValue * elecFactor / 1000;
          const heatEmission = heatValue * heatFac / 1000;
          return (elecEmission + heatEmission).toFixed(2);
        }
        
        // 处理排放因子行 - 为每个月显示输入框
        if (record.key === 'electricity-factor') {
          return (
            <InputNumber
              min={0}
              step={0.0001}
              value={text}
              onChange={(value) => handleElectricityFactorChange(month, value)}
              style={{ width: '100%' }}
            />
          );
        } else if (record.key === 'heat-factor') {
          return (
            <InputNumber
              min={0}
              step={0.01}
              value={text}
              onChange={(value) => handleHeatFactorChange(month, value)}
              style={{ width: '100%' }}
            />
          );
        }
        
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
        } else if (record.key === 'electricity-factor') {
          return <Upload {...getUploadPropsForElectricityFactor()}><Button>上传</Button></Upload>;
        } else if (record.key === 'heat-purchase') {
          return <Upload {...getUploadPropsForHeatPurchase()}><Button>上传</Button></Upload>;
        } else if (record.key === 'heat-factor') {
          return <Upload {...getUploadPropsForHeatFactor()}><Button>上传</Button></Upload>;
        }
        return null;
      }
    }
  );

  return (
    <div className="net-electricity-heat-emission">
      <Card title="购入净电和净热" style={{ marginBottom: 20 }}>
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
            <li>净电CO2排放量 = 净电净购入量 × 电力排放因子 / 1000</li>
            <li>净热CO2排放量 = 净热净购入量 × 热力排放因子 / 1000</li>
            <li>电力排放因子默认值为 0.5366 kgCO2/KWH，用户可修改</li>
            <li>热力排放因子需要用户手动输入</li>
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