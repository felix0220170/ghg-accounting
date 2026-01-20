import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, InputNumber, Button, Card, Typography, Upload, message, Divider } from 'antd';
import { UploadOutlined, FileTextOutlined, InboxOutlined } from '@ant-design/icons';
const { Dragger } = Upload;

const { Title, Paragraph } = Typography;

// 月份列表
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 车辆类型列表
const VEHICLE_TYPES = [
  { key: 'car', name: '轿车' },
  { key: 'other_light', name: '其他轻型车' },
  { key: 'heavy', name: '重型车' }
];

// 燃料类型列表
const FUEL_TYPES = [
  { key: 'gasoline', name: '汽油' },
  { key: 'diesel', name: '柴油' },
  { key: 'lpg', name: 'LPG' },
  { key: 'natural_gas', name: '天然气' }
];

// 排放标准列表
const EMISSION_STANDARDS = [
  { key: '国I', name: '国I' },
  { key: '国II', name: '国II' },
  { key: '国III', name: '国III' },
  { key: '国III及以上', name: '国III及以上' },
  { key: '国IV及以上', name: '国IV及以上' },
  { key: '其他', name: '其他' },
  { key: '所有', name: '所有' }
];

// 默认排放因子数据
const DEFAULT_EMISSION_FACTORS = {
  car: {
    gasoline: {
      '国I': { n2o: 38, ch4: 45 },
      '国II': { n2o: 24, ch4: 94 },
      '国III': { n2o: 12, ch4: 83 },
      '国IV及以上': { n2o: 6, ch4: 57 }
    },
    diesel: {
      '国I': { n2o: 0, ch4: 18 },
      '国II': { n2o: 3, ch4: 6 },
      '国III': { n2o: 15, ch4: 7 },
      '国IV及以上': { n2o: 15, ch4: 0 }
    },
    lpg: {
      '国I': { n2o: 38, ch4: 80 },
      '国II': { n2o: 23, ch4: 80 },
      '国III及以上': { n2o: 9, ch4: 80 }
    }
  },
  other_light: {
    gasoline: {
      '国I': { n2o: 122, ch4: 45 },
      '国II': { n2o: 62, ch4: 94 },
      '国III': { n2o: 36, ch4: 83 },
      '国IV及以上': { n2o: 16, ch4: 57 }
    },
    diesel: {
      '国I': { n2o: 0, ch4: 18 },
      '国II': { n2o: 3, ch4: 6 },
      '国III': { n2o: 15, ch4: 7 },
      '国IV及以上': { n2o: 15, ch4: 0 }
    }
  },
  heavy: {
    gasoline: {
      '所有': { n2o: 6, ch4: 140 }
    },
    diesel: {
      '所有': { n2o: 30, ch4: 175 }
    },
    natural_gas: {
      '国IV及以上': { n2o: 0, ch4: 900 },
      '其他': { n2o: 0, ch4: 5400 }
    }
  }
};

// GWP值 (Global Warming Potential) - 根据IPCC第二次评估报告推荐
const GWP_VALUES = {
  n2o: 310, // N2O的GWP值
  ch4: 21   // CH4的GWP值
};

// 创建初始数据
const createInitialData = () => {
  const initialData = [];
  
  VEHICLE_TYPES.forEach(vehicle => {
    FUEL_TYPES.forEach(fuel => {
      EMISSION_STANDARDS.forEach(standard => {
        // 根据车辆类型和燃料类型过滤适用的排放标准
        const isApplicable = 
          (vehicle.key === 'car' && fuel.key === 'lpg' && (standard.key === '国I' || standard.key === '国II' || standard.key === '国III及以上') && standard.key !== '所有' && standard.key !== '其他') ||
          (vehicle.key === 'car' && fuel.key !== 'lpg' && fuel.key !== 'natural_gas' && standard.key !== '国III及以上' && standard.key !== '所有' && standard.key !== '其他') ||
          (vehicle.key === 'other_light' && fuel.key !== 'lpg' && fuel.key !== 'natural_gas' && standard.key !== '国III及以上' && standard.key !== '所有' && standard.key !== '其他') ||
          (vehicle.key === 'heavy' && fuel.key === 'gasoline' && standard.key === '所有') ||
          (vehicle.key === 'heavy' && fuel.key === 'diesel' && standard.key === '所有') ||
          (vehicle.key === 'heavy' && fuel.key === 'natural_gas' && (standard.key === '国IV及以上' || standard.key === '其他'));
        
        if (isApplicable) {
          initialData.push({
            id: `${vehicle.key}-${fuel.key}-${standard.key}`,
            vehicleType: vehicle.name,
            fuelType: fuel.name,
            emissionStandard: standard.name,
            vehicleCount: 0,
            drivingDistance: 0,
            n2oEmissionFactor: DEFAULT_EMISSION_FACTORS[vehicle.key]?.[fuel.key]?.[standard.key]?.n2o || 0,
            ch4EmissionFactor: DEFAULT_EMISSION_FACTORS[vehicle.key]?.[fuel.key]?.[standard.key]?.ch4 || 0
          });
        }
      });
    });
  });
  
  return initialData;
};

// 化石燃料燃烧甲烷和氧化亚氮排放量组件
const TransportFossilFuelGHGEmission = ({ onEmissionChange }) => {
  // 状态管理
  const [data, setData] = useState(createInitialData());
  
  // 使用ref存储上一次的totalCO2e值，用于比较是否发生变化
  const prevTotalCO2eRef = useRef(0);
  
  // 处理车辆数变化
  const handleVehicleCountChange = useCallback((id, value) => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, vehicleCount: value || 0 } : item
      )
    );
  }, []);
  
  // 处理平均行驶里程变化
  const handleDrivingDistanceChange = useCallback((id, value) => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, drivingDistance: value || 0 } : item
      )
    );
  }, []);
  
  // 计算排放量
  const calculateEmissions = useMemo(() => {
    return data.map(item => {
      // 计算氧化亚氮排放量 (mg)
      const n2oEmission = item.vehicleCount * item.drivingDistance * item.n2oEmissionFactor;
      
      // 计算甲烷排放量 (mg)
      const ch4Emission = item.vehicleCount * item.drivingDistance * item.ch4EmissionFactor;
      
      // 计算氧化亚氮的二氧化碳当量 (mgCO2e)
      const n2oCO2e = n2oEmission * GWP_VALUES.n2o;
      
      // 计算甲烷的二氧化碳当量 (mgCO2e)
      const ch4CO2e = ch4Emission * GWP_VALUES.ch4;
      
      // 计算总二氧化碳当量 (mgCO2e)
      const totalCO2e = n2oCO2e + ch4CO2e;
      
      return {
        ...item,
        n2oEmission,
        ch4Emission,
        n2oCO2e,
        ch4CO2e,
        totalCO2e
      };
    });
  }, [data]);
  
  // 计算总计
  const calculateTotals = useMemo(() => {
    const totals = calculateEmissions.reduce((acc, item) => {
      acc.n2oEmission += item.n2oEmission;
      acc.ch4Emission += item.ch4Emission;
      acc.n2oCO2e += item.n2oCO2e;
      acc.ch4CO2e += item.ch4CO2e;
      acc.totalCO2e += item.totalCO2e;
      return acc;
    }, {
      n2oEmission: 0,
      ch4Emission: 0,
      n2oCO2e: 0,
      ch4CO2e: 0,
      totalCO2e: 0
    });
    
    return totals;
  }, [calculateEmissions]);
  
  // 当总排放量变化时通知父组件
  useEffect(() => {
    // 只有当totalCO2e真正变化时才通知父组件
    if (onEmissionChange && calculateTotals.totalCO2e !== prevTotalCO2eRef.current) {
      // 更新ref中的值
      prevTotalCO2eRef.current = calculateTotals.totalCO2e;
      
      // 将mgCO2e转换为tCO2e (1 t = 1,000,000,000 mg)
      const totalCO2eTons = calculateTotals.totalCO2e / 1000000000;
      onEmissionChange({
        totalEmission: totalCO2eTons,
        detailedEmissions: calculateTotals
      });
    }
  }, [calculateTotals.totalCO2e, onEmissionChange]); // 只依赖totalCO2e而不是整个calculateTotals对象
  
  // 计算每种车辆类型的行数，用于rowspan
  const vehicleTypeRowSpans = useMemo(() => {
    const spans = {};
    data.forEach(item => {
      if (!spans[item.vehicleType]) {
        spans[item.vehicleType] = 0;
      }
      spans[item.vehicleType]++;
    });
    return spans;
  }, [data]);

  // 计算每行的车辆类型单元格信息
  const vehicleTypeCellInfo = useMemo(() => {
    const info = [];
    const displayedVehicles = new Set();
    
    data.forEach((item, index) => {
      const shouldDisplay = !displayedVehicles.has(item.vehicleType);
      const rowspan = vehicleTypeRowSpans[item.vehicleType];
      
      info[index] = {
        shouldDisplay,
        rowspan
      };
      
      if (shouldDisplay) {
        displayedVehicles.add(item.vehicleType);
      }
    });
    
    return info;
  }, [data, vehicleTypeRowSpans]);

  // 表格列配置
  const columns = [
    {
      title: '车辆类型',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      width: 100,
      align: 'center',
      // 使用render函数设置rowspan
      render: (text, record, index) => {
        const { shouldDisplay, rowspan } = vehicleTypeCellInfo[index];
        
        return {
          children: text,
          props: {
            rowSpan: shouldDisplay ? rowspan : 0,
            style: { padding: '8px 0', textAlign: 'center' }
          }
        };
      }
    },
    {
      title: '燃料类型',
      dataIndex: 'fuelType',
      key: 'fuelType',
      width: 100,
      align: 'center'
    },
    {
      title: '排放标准',
      dataIndex: 'emissionStandard',
      key: 'emissionStandard',
      width: 120,
      align: 'center'
    },
    {
      title: '车辆数',
      dataIndex: 'vehicleCount',
      key: 'vehicleCount',
      width: 80,
      align: 'center',
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleVehicleCountChange(record.id, value)}
          min={0}
          style={{ width: '80%' }}
        />
      )
    },
    {
      title: '平均行驶里程(km)',
      dataIndex: 'drivingDistance',
      key: 'drivingDistance',
      width: 120,
      align: 'center',
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleDrivingDistanceChange(record.id, value)}
          min={0}
          style={{ width: '80%' }}
        />
      )
    },
    {
      title: '氧化亚氮排放因子(mg/km)',
      dataIndex: 'n2oEmissionFactor',
      key: 'n2oEmissionFactor',
      width: 140,
      align: 'center',
      render: (text) => text || '-'
    },
    {
      title: '氧化亚氮排放量(mg)',
      dataIndex: 'n2oEmission',
      key: 'n2oEmission',
      width: 120,
      align: 'center',
      render: (text) => text.toFixed(0)
    },
    {
      title: '氧化亚氮CO₂当量(mgCO₂e)',
      dataIndex: 'n2oCO2e',
      key: 'n2oCO2e',
      width: 140,
      align: 'center',
      render: (text) => text.toFixed(0)
    },
    {
      title: '甲烷排放因子(mg/km)',
      dataIndex: 'ch4EmissionFactor',
      key: 'ch4EmissionFactor',
      width: 120,
      align: 'center',
      render: (text) => text || '-'
    },
    {
      title: '甲烷排放量(mg)',
      dataIndex: 'ch4Emission',
      key: 'ch4Emission',
      width: 100,
      align: 'center',
      render: (text) => text.toFixed(0)
    },
    {
      title: '甲烷CO₂当量(mgCO₂e)',
      dataIndex: 'ch4CO2e',
      key: 'ch4CO2e',
      width: 120,
      align: 'center',
      render: (text) => text.toFixed(0)
    },
    {
      title: '总CO₂当量(tCO₂e)',
      dataIndex: 'totalCO2e',
      key: 'totalCO2e',
      width: 120,
      align: 'center',
      render: (text) => (text / 1000000000).toFixed(2), // 转换为tCO2e
      className: 'total-co2e'
    }
  ];
  
  // 渲染总计行
  const renderTotalRow = () => {
    return (
      <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
        <td colSpan={5} style={{ textAlign: 'right', paddingRight: '20px' }}>总计：</td>
        <td style={{ textAlign: 'center' }}>-</td>
        <td style={{ textAlign: 'center' }}>{calculateTotals.n2oEmission.toFixed(0)}</td>
        <td style={{ textAlign: 'center' }}>{calculateTotals.n2oCO2e.toFixed(0)}</td>
        <td style={{ textAlign: 'center' }}>-</td>
        <td style={{ textAlign: 'center' }}>{calculateTotals.ch4Emission.toFixed(0)}</td>
        <td style={{ textAlign: 'center' }}>{calculateTotals.ch4CO2e.toFixed(0)}</td>
        <td style={{ textAlign: 'center' }}>{(calculateTotals.totalCO2e / 1000000000).toFixed(2)}</td> {/* 转换为tCO2e */}
      </tr>
    );
  };
  
  // 上传演示功能 - 用于上传运输车辆行驶里程的相关文件
  const [fileList, setFileList] = useState([]);
  
  // 处理文件上传（演示功能）
  const handleUpload = useCallback((file) => {
    // 模拟上传成功
    setFileList(prevList => [...prevList, file]);
    message.success(`${file.name} 文件上传成功`);
    // 返回 false 以阻止自动上传
    return false;
  }, []);
  
  // 处理文件删除（演示功能）
  const handleRemove = useCallback((file) => {
    setFileList(prevList => prevList.filter(f => f.uid !== file.uid));
    message.success(`${file.name} 文件已删除`);
    return true;
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>化石燃料燃烧甲烷和氧化亚氮排放量</Title>
      

      
      <Card style={{ marginBottom: '20px' }}>
        <Paragraph>根据化石燃料燃烧产生的甲烷和氧化亚氮排放量，计算其二氧化碳当量。</Paragraph>
        <Paragraph>计算公式：</Paragraph>
        <Paragraph>• 氧化亚氮排放量(mg) = 车辆数 × 平均行驶里程(km) × 氧化亚氮排放因子(mg/km)</Paragraph>
        <Paragraph>• 甲烷排放量(mg) = 车辆数 × 平均行驶里程(km) × 甲烷排放因子(mg/km)</Paragraph>
        <Paragraph>• 氧化亚氮CO₂当量(mgCO₂e) = 氧化亚氮排放量(mg) × GWP值(310)</Paragraph>
        <Paragraph>• 甲烷CO₂当量(mgCO₂e) = 甲烷排放量(mg) × GWP值(21)</Paragraph>
        <Paragraph>• 总CO₂当量(mgCO₂e) = 氧化亚氮CO₂当量 + 甲烷CO₂当量</Paragraph>
        <Paragraph>• 总CO₂当量(tCO₂e) = 总CO₂当量(mgCO₂e) × 10<sup>-9</sup></Paragraph>
      </Card>
      
      <Table
        columns={columns}
        dataSource={calculateEmissions}
        rowKey="id"
        pagination={false}
        bordered
        summary={() => renderTotalRow()}
      />
      
      <Card style={{ marginTop: '20px' }}>
        <Title level={5}>结果说明</Title>
        <Paragraph>
          化石燃料燃烧产生的CH₄和N₂O排放量(CO₂e)：{(calculateTotals.totalCO2e / 1000000000).toFixed(2)} tCO₂e
        </Paragraph>
        <Paragraph>
          注：CO₂当量计算基于IPCC第二次评估报告的GWP值（N₂O: 310, CH₄: 21）
        </Paragraph>
      </Card>
      
      {/* 数据上传演示组件 */}
      <Card style={{ marginBottom: '20px', marginTop: '20px' }}>
        <Title level={4}>数据上传</Title>
        <Paragraph>
          运输车辆的行驶里程应以企业统计数据为准，企业须提供相关的汽车里程表数据
          或 GPS 行车记录仪数据，以及维修记录、每班次出车原始记录
          或运输合同等辅助材料。
        </Paragraph>
        <Divider />
        <Dragger
          name="file"
          multiple={true}
          beforeUpload={handleUpload}
          showUploadList={true}
          fileList={fileList}
          onRemove={handleRemove}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          style={{ width: '400px' }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持多个文件同时上传
          </p>
        </Dragger>
      </Card>
    </div>
  );
};

export default TransportFossilFuelGHGEmission;
