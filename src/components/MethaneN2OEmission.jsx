import React, { useState, useEffect } from 'react';
import { InputNumber, Table, Typography } from 'antd';
import { 
  EMISSION_FACTORS, 
  TYPE_LABEL_MAP, 
  GWP_VALUES, 
  UNIT_CONVERSION 
} from '../config/transportConstants';

const { Title, Text, Paragraph } = Typography;

// 从排放因子对象生成所有可能的组合行
const generateAllCombinationRows = () => {
  const rows = [];

  Object.keys(EMISSION_FACTORS).forEach(key => {
    // 解析车辆类型和燃料类型
    let vehicleType = '';
    let fuelType = '';
    
    if (key.startsWith('car-other-light')) {
      vehicleType = 'car-other-light';
      fuelType = key.split('-')[3];
    } else if (key.startsWith('heavy-gas-natural')) {
      vehicleType = 'heavy';
      fuelType = 'gas-natural';
    } else {
      const parts = key.split('-');
      vehicleType = parts[0];
      fuelType = parts.slice(1).join('-');
    }

    // 获取排放标准和排放因子
    Object.keys(EMISSION_FACTORS[key]).forEach(standard => {
      const factors = EMISSION_FACTORS[key][standard];
      rows.push({
        key: `${key}-${standard}`,
        vehicleType,
        fuelType,
        standard,
        vehicleTypeName: TYPE_LABEL_MAP[vehicleType] || vehicleType,
        fuelTypeName: TYPE_LABEL_MAP[fuelType] || fuelType,
        n2oFactor: factors.n2o || 0,
        ch4Factor: factors.ch4 || 0,
        vehicleCount: 0,
        distance: 0
      });
    });
  });

  // 按车辆类型和燃料类型排序，方便后续的rowspan处理
  return rows.sort((a, b) => {
    if (a.vehicleType !== b.vehicleType) {
      return a.vehicleType.localeCompare(b.vehicleType);
    }
    return a.fuelType.localeCompare(b.fuelType);
  });
};

// 计算单条记录的排放量
const calculateEmissions = (row) => {
  const vehicleCount = row.vehicleCount || 0;
  const distance = row.distance || 0;
  
  const n2oEmission = row.n2oFactor * distance * vehicleCount;
  const ch4Emission = row.ch4Factor * distance * vehicleCount;
  
  const n2oCO2e_mg = n2oEmission * GWP_VALUES.NITROUS_OXIDE; // GWP for N2O
  const ch4CO2e_mg = ch4Emission * GWP_VALUES.METHANE;      // GWP for CH4
  const totalCO2e_t = (n2oCO2e_mg + ch4CO2e_mg) * UNIT_CONVERSION.MG_TO_TON; // 转换为吨
  
  return {
    ...row,
    n2oEmission,
    ch4Emission,
    n2oCO2e_mg,
    ch4CO2e_mg,
    totalCO2e_t
  };
};

// 处理表格数据，为相同车辆类型和燃料类型添加rowspan信息
const processTableDataForRowspan = (data) => {
  const processedData = [...data];
  const vehicleTypeCounts = {};
  const fuelTypeCounts = {};
  
  // 统计每种车辆类型的出现次数
  data.forEach(row => {
    vehicleTypeCounts[row.vehicleType] = (vehicleTypeCounts[row.vehicleType] || 0) + 1;
    
    // 统计每种(车辆类型+燃料类型)组合的出现次数
    const combinedKey = `${row.vehicleType}-${row.fuelType}`;
    fuelTypeCounts[combinedKey] = (fuelTypeCounts[combinedKey] || 0) + 1;
  });
  
  // 为每行设置rowspan信息
  let currentVehicleCounts = { ...vehicleTypeCounts };
  let currentFuelCounts = { ...fuelTypeCounts };
  
  return processedData.map(row => {
    const shouldRenderVehicleType = currentVehicleCounts[row.vehicleType] === vehicleTypeCounts[row.vehicleType];
    const combinedKey = `${row.vehicleType}-${row.fuelType}`;
    const shouldRenderFuelType = currentFuelCounts[combinedKey] === fuelTypeCounts[combinedKey];
    
    // 更新计数
    currentVehicleCounts[row.vehicleType]--;
    currentFuelCounts[combinedKey]--;
    
    return {
      ...row,
      vehicleTypeRowspan: shouldRenderVehicleType ? vehicleTypeCounts[row.vehicleType] : 0,
      shouldRenderVehicleType,
      fuelTypeRowspan: shouldRenderFuelType ? fuelTypeCounts[combinedKey] : 0,
      shouldRenderFuelType
    };
  });
};

function MethaneN2OEmission({ onEmissionChange, industry }) {
  const [rows, setRows] = useState(generateAllCombinationRows());
  const [totalEmission, setTotalEmission] = useState(0);

  // 更新车辆数或行驶里程
  const updateRowValue = (key, field, value) => {
    setRows(rows.map(row => {
      if (row.key === key) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // 计算排放量和总排放量
  useEffect(() => {
    // 计算每条记录的排放量
    const rowsWithEmissions = rows.map(row => calculateEmissions(row));
    
    // 计算总排放量
    const total = rowsWithEmissions.reduce((sum, row) => sum + row.totalCO2e_t, 0);
    setTotalEmission(total);
    
    if (onEmissionChange) {
      onEmissionChange(total);
    }
  }, [rows, onEmissionChange]);

  // 处理表格数据，添加rowspan信息
  const processedTableData = processTableDataForRowspan(rows);

  // 表格列配置
  const columns = [
    {
      title: '车辆类型',
      dataIndex: 'vehicleTypeName',
      key: 'vehicleTypeName',
      width: 100,
      render: (_, record) => {
        if (record.shouldRenderVehicleType) {
          return {
            children: record.vehicleTypeName,
            props: {
              rowSpan: record.vehicleTypeRowspan,
              style: { verticalAlign: 'middle', textAlign: 'center' }
            }
          };
        }
        return {
          props: {
            rowSpan: 0
          }
        };
      }
    },
    {
      title: '燃料类型',
      dataIndex: 'fuelTypeName',
      key: 'fuelTypeName',
      width: 100,
      render: (_, record) => {
        if (record.shouldRenderFuelType) {
          return {
            children: record.fuelTypeName,
            props: {
              rowSpan: record.fuelTypeRowspan,
              style: { verticalAlign: 'middle', textAlign: 'center' }
            }
          };
        }
        return {
          props: {
            rowSpan: 0
          }
        };
      }
    },
    {
      title: '排放标准',
      dataIndex: 'standard',
      key: 'standard',
      width: 100,
      render: (text) => <span style={{ display: 'flex', justifyContent: 'center' }}>{text}</span>
    },
    {
      title: '车辆数',
      dataIndex: 'vehicleCount',
      key: 'vehicleCount',
      width: 80,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            value={record.vehicleCount}
            onChange={(value) => updateRowValue(record.key, 'vehicleCount', value)}
            style={{ width: '80%' }}
            min={0}
            precision={0}
          />
        </div>
      ),
    },
    {
      title: '平均行驶里程(km)',
      dataIndex: 'distance',
      key: 'distance',
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            value={record.distance}
            onChange={(value) => updateRowValue(record.key, 'distance', value)}
            style={{ width: '80%' }}
            min={0}
            precision={1}
          />
        </div>
      ),
    },
    {
      title: '氧化亚氮的排放因子(mg/km)',
      dataIndex: 'n2oFactor',
      key: 'n2oFactor',
      width: 150,
      render: (text) => <span style={{ display: 'flex', justifyContent: 'center' }}>{text || 0}</span>
    },
    {
      title: '排放量（mg）',
      key: 'n2oEmission',
      width: 100,
      render: (_, record) => {
        const calculated = calculateEmissions(record);
        return <span style={{ display: 'flex', justifyContent: 'center' }}>{calculated.n2oEmission.toFixed(2)}</span>;
      },
    },
    {
      title: '二氧化碳排放当量* (mgCO2e)',
      key: 'n2oCO2e_mg',
      width: 150,
      render: (_, record) => {
        const calculated = calculateEmissions(record);
        return <span style={{ display: 'flex', justifyContent: 'center' }}>{calculated.n2oCO2e_mg.toFixed(2)}</span>;
      },
    },
    {
      title: '甲烷的排放因子(mg/km)',
      dataIndex: 'ch4Factor',
      key: 'ch4Factor',
      width: 150,
      render: (text) => <span style={{ display: 'flex', justifyContent: 'center' }}>{text || 0}</span>
    },
    {
      title: '排放量（mg）',
      key: 'ch4Emission',
      width: 100,
      render: (_, record) => {
        const calculated = calculateEmissions(record);
        return <span style={{ display: 'flex', justifyContent: 'center' }}>{calculated.ch4Emission.toFixed(2)}</span>;
      },
    },
    {
      title: '二氧化碳排放当量* (mgCO2e)',
      key: 'ch4CO2e_mg',
      width: 150,
      render: (_, record) => {
        const calculated = calculateEmissions(record);
        return <span style={{ display: 'flex', justifyContent: 'center' }}>{calculated.ch4CO2e_mg.toFixed(2)}</span>;
      },
    },
    {
      title: '二氧化碳排放当量(tCO2e)',
      key: 'totalCO2e_t',
      width: 150,
      render: (_, record) => {
        const calculated = calculateEmissions(record);
        return <span style={{ display: 'flex', justifyContent: 'center' }}>{calculated.totalCO2e_t.toFixed(9)}</span>;
      },
    },
  ];

  return (
    <div className="methane-n2o-emission">
      <Title level={4}>化石燃料燃烧甲烷和氧化亚氮排放量计算</Title>

      {/* 数据表格 - 显示所有组合行 */}
      <Table
        columns={columns}
        dataSource={processedTableData}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowKey="key"
        // 使用Ant Design Table组件的内置属性来设置样式
// 移除重复的 pagination 属性，保留之前已设置的 pagination={false}
        rowClassName={() => 'ant-table-row-center'}
        // 使用Ant Design Table的列属性配置而不是内联CSS选择器
      />

      {/* 计算结果显示 */}
      <div style={{ marginTop: 30, padding: 20, backgroundColor: '#e6f7ff', borderRadius: 8 }}>
        <Title level={5}>计算结果</Title>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}>
          <Text type="secondary">化石燃料燃烧甲烷和氧化亚氮总排放量：</Text>
          <Text strong style={{ marginLeft: 10, color: '#1890ff', fontSize: '20px' }}>
            {totalEmission.toFixed(4)} 吨CO2e
          </Text>
        </div>
      </div>

      {/* 计算说明 */}
      <div style={{ marginTop: 30, padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <Title level={5}>计算说明</Title>
        <Paragraph>
          1. 甲烷和氧化亚氮排放量计算公式：
        </Paragraph>
        <Paragraph>
          排放量（tCO2e）= Σ[车辆数量 × 行驶里程 × 排放因子 × GWP] × 10^-9
        </Paragraph>
        <Paragraph>
          其中：GWP（全球变暖潜能值）- 甲烷：{GWP_VALUES.METHANE}，氧化亚氮：{GWP_VALUES.NITROUS_OXIDE}
        </Paragraph>
        <Paragraph>
          2. 排放因子根据车辆类型、燃料类型和排放标准从表3获取
        </Paragraph>
      </div>
    </div>
  );
}

export default MethaneN2OEmission;