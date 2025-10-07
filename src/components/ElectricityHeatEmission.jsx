import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, Typography, Card, Table, Space } from 'antd';
import {
  electricityEmissionFactors,
  regionEmissionFactors,
  DEFAULT_HEAT_EMISSION_FACTOR,
  DEFAULT_ELECTRICITY_YEAR,
  DEFAULT_PROVINCE,
  DEFAULT_REGION,
  EMISSION_UNIT
} from '../config/emissionConstants';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Item } = Form;

// 修改组件参数定义，添加useRegionFactor属性
// 修改组件定义
export function ElectricityHeatEmission({ onEmissionChange, industry, useRegionFactor = true }) {
  
  // 固定的三种类型记录
  const [records, setRecords] = useState([
    { 
      key: '1', 
      type: 'electricity', 
      typeText: '电力', 
      purchasedAmount: '', 
      externalSupplyAmount: '', 
      emissionFactor: '', 
      year: DEFAULT_ELECTRICITY_YEAR, 
      province: DEFAULT_PROVINCE, 
      region: DEFAULT_REGION 
    },
    { 
      key: '2', 
      type: 'steam', 
      typeText: '蒸汽', 
      purchasedAmount: '', 
      externalSupplyAmount: '', 
      emissionFactor: '', 
      year: DEFAULT_ELECTRICITY_YEAR 
    },
    { 
      key: '3', 
      type: 'hotwater', 
      typeText: '热水', 
      purchasedAmount: '', 
      externalSupplyAmount: '', 
      emissionFactor: '', 
      year: DEFAULT_ELECTRICITY_YEAR 
    }
  ]);
  
  // 计算的排放总量
  const [totalEmission, setTotalEmission] = useState(0);

  // 计算单条记录的排放量
  const calculateEmission = (record) => {
    const { type, purchasedAmount, externalSupplyAmount, emissionFactor: customFactor, year, province, region } = record;
    
    // 计算净购入量
    const purchased = parseFloat(purchasedAmount) || 0;
    const externalSupply = parseFloat(externalSupplyAmount) || 0;
    const netPurchased = purchased - externalSupply;
    
    // 如果净购入量小于等于0，排放量为0
    if (netPurchased <= 0) {
      return { netPurchased, emission: 0 };
    }
    
    // 根据类型确定排放因子
    let factor;
    if (type === 'electricity') {
      // 电力：使用电网排放因子或自定义因子
      if (customFactor) {
        factor = parseFloat(customFactor) || 0;
      } else if (useRegionFactor) {
        // 使用区域因子
        const regionData = regionEmissionFactors.find(r => r.region === region);
        factor = regionData ? regionData[year === '2021' ? 'factor2021' : 'factor2022'] : 0.000558;
      } else {
        // 使用省份因子
        const provinceData = electricityEmissionFactors.find(p => p.province === province);
        factor = provinceData ? provinceData[year === '2021' ? 'factor2021' : 'factor2022'] : 0.558;
      }
    } else {
      // 热力（蒸汽/热水）：使用自定义因子或默认因子
      factor = customFactor ? (parseFloat(customFactor) || DEFAULT_HEAT_EMISSION_FACTOR) : DEFAULT_HEAT_EMISSION_FACTOR;
    }
    
    // 计算排放量
    const emission = netPurchased * factor;
    
    return { netPurchased, emission };
  };

  // 计算总排放量
  const calculateTotalEmission = useCallback(() => {
    let total = 0;
    
    records.forEach(record => {
      const { emission } = calculateEmission(record);
      total += emission;
    });
    
    setTotalEmission(total);
    onEmissionChange(total);
  }, [records, onEmissionChange]); // 移除isPaperIndustry依赖

  // 更新记录
  const updateRecord = (key, field, value) => {
    setRecords(records.map(record => 
      record.key === key ? { ...record, [field]: value } : record
    ));
  };

  // 获取当前选择的缺省排放因子
  const getDefaultEmissionFactor = (record) => {
    if (record.type !== 'electricity' || record.emissionFactor) {
      return null;
    }
    
    const { year, province, region } = record;
    
    if (useRegionFactor) {
      // 使用区域因子
      const regionData = regionEmissionFactors.find(r => r.region === region);
      return regionData ? regionData[year === '2021' ? 'factor2021' : 'factor2022'] : 0.000558;
    } else {
      // 使用省份因子
      const provinceData = electricityEmissionFactors.find(p => p.province === province);
      return provinceData ? provinceData[year === '2021' ? 'factor2021' : 'factor2022'] : 0.558;
    }
  };

  // 监听记录变化，重新计算排放量
  useEffect(() => {
    calculateTotalEmission();
  }, [calculateTotalEmission]);

  // 格式化数字显示
  const formatNumber = (num) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  // 表格列配置
  const columns = [
    {
      title: '类型',
      dataIndex: 'typeText',
      key: 'typeText',
      width: 80,
    },
    {
      title: '购入量（MWh 或 GJ）',
      dataIndex: 'purchasedAmount',
      key: 'purchasedAmount',
      render: (text, record) => (
        <Input
          value={record.purchasedAmount}
          onChange={(e) => updateRecord(record.key, 'purchasedAmount', e.target.value)}
          placeholder="请输入购入量"
          type="number"
          min="0"
          step="0.01"
        />
      ),
    },
    {
      title: '外供量（MWh 或 GJ）',
      dataIndex: 'externalSupplyAmount',
      key: 'externalSupplyAmount',
      render: (text, record) => (
        <Input
          value={record.externalSupplyAmount}
          onChange={(e) => updateRecord(record.key, 'externalSupplyAmount', e.target.value)}
          placeholder="请输入外供量"
          type="number"
          min="0"
          step="0.01"
        />
      ),
    },
    {
      title: '净购入量（MWh 或 GJ）',
      dataIndex: 'netPurchased',
      key: 'netPurchased',
      render: (text, record) => {
        const { netPurchased } = calculateEmission(record);
        return formatNumber(netPurchased);
      },
    },
    {
      title: 'CO2排放因子',
      dataIndex: 'emissionFactor',
      key: 'emissionFactor',
      render: (text, record) => {
        if (record.type === 'electricity') {
          // 获取当前选择的缺省排放因子
          const defaultFactor = getDefaultEmissionFactor(record);
          
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text>年份：</Text>
                <Select
                  value={record.year}
                  onChange={(value) => updateRecord(record.key, 'year', value)}
                  style={{ width: 100 }}
                >
                  <Option value="2021">2021年</Option>
                  <Option value="2022">2022年</Option>
                </Select>
              </Space>
              {useRegionFactor ? ( // 替换isPaperIndustry为useRegionFactor
                <Space>
                  <Text>区域：</Text>
                  <Select
                    value={record.region}
                    onChange={(value) => updateRecord(record.key, 'region', value)}
                    style={{ width: 120 }}
                  >
                    {regionEmissionFactors.map(region => (
                      <Option key={region.region} value={region.region}>{region.region}</Option>
                    ))}
                  </Select>
                </Space>
              ) : (
                <Space>
                  <Text>省份：</Text>
                  <Select
                    value={record.province}
                    onChange={(value) => updateRecord(record.key, 'province', value)}
                    style={{ width: 120 }}
                  >
                    {electricityEmissionFactors.map(province => (
                      <Option key={province.province} value={province.province}>{province.province}</Option>
                    ))}
                  </Select>
                </Space>
              )}
              {/* 显示当前选择的缺省排放因子 */}
              {defaultFactor !== null && (
                <Space>
                  <Text type="success">当前缺省排放因子：</Text>
                  <Input
                    value={formatNumber(defaultFactor)}
                    readOnly
                    style={{ width: 150, backgroundColor: '#f0f9ff', borderColor: '#91d5ff' }}
                    suffix={EMISSION_UNIT.ELECTRICITY}
                  />
                </Space>
              )}
              <Space>
                <Text>或自定义因子：</Text>
                <Input
                  value={record.emissionFactor}
                  onChange={(e) => updateRecord(record.key, 'emissionFactor', e.target.value)}
                  placeholder={EMISSION_UNIT.ELECTRICITY}
                  type="number"
                  min="0"
                  step="0.0001"
                />
              </Space>
            </Space>
          );
        } else {
          // 热力类型，允许用户自定义因子
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text>默认因子：</Text>
                <Text type="secondary">{DEFAULT_HEAT_EMISSION_FACTOR} {EMISSION_UNIT.HEAT}</Text>
              </Space>
              <Space>
                <Text>或自定义因子：</Text>
                <Input
                  value={record.emissionFactor}
                  onChange={(e) => updateRecord(record.key, 'emissionFactor', e.target.value)}
                  placeholder={EMISSION_UNIT.HEAT}
                  type="number"
                  min="0"
                  step="0.0001"
                />
              </Space>
            </Space>
          );
        }
      },
    },
    {
      title: 'CO2排放量（吨）',
      dataIndex: 'emission',
      key: 'emission',
      render: (text, record) => {
        const { emission } = calculateEmission(record);
        return formatNumber(emission);
      },
    },
  ];

  // 因子表格列配置
  const factorColumns = useRegionFactor ? [ // 替换isPaperIndustry为useRegionFactor
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: '2021年排放因子（吨CO2/MWh）',
      dataIndex: 'factor2021',
      key: 'factor2021',
      render: (text) => formatNumber(text),
    },
    {
      title: '2022年排放因子（吨CO2/MWh）',
      dataIndex: 'factor2022',
      key: 'factor2022',
      render: (text) => formatNumber(text),
    },
  ] : [
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
    },
    {
      title: '2021年排放因子（吨CO2/MWh）',
      dataIndex: 'factor2021',
      key: 'factor2021',
      render: (text) => formatNumber(text),
    },
    {
      title: '2022年排放因子（吨CO2/MWh）',
      dataIndex: 'factor2022',
      key: 'factor2022',
      render: (text) => formatNumber(text),
    },
  ];

  return (
    <Card title={`表7：企业净购入的电力和热力活动水平和排放因子数据一览（${industry}）`} style={{ marginBottom: 20 }}>
      <Paragraph type="secondary" style={{ marginBottom: 20 }}>
        {useRegionFactor 
          ? '电力供应的CO2排放因子等于企业所在区域的平均供电CO2排放因子。热力供应的CO2排放因子可使用默认值或自定义值。'
          : '电力供应的CO2排放因子等于企业生产场地所属电网的平均供电CO2排放因子。热力供应的CO2排放因子可使用默认值或自定义值。'
        }
      </Paragraph>

      {/* 计算结果显示区域 */}
      <Card 
        title="计算结果" 
        style={{ marginBottom: 20, borderLeft: '4px solid #1890ff' }}
        type="inner"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>
            CO2排放总量： {formatNumber(totalEmission)} {EMISSION_UNIT.TOTAL}
          </Text>
        </div>
      </Card>

      {/* 表格区域 */}
      <Table 
        columns={columns} 
        dataSource={records} 
        pagination={false}
        rowKey="key"
      />

      {/* 计算说明 */}
      <Card title="计算说明" style={{ marginTop: 20 }}>
        <Paragraph>
          净购入量（MWh或GJ）=购入量-外供量
        </Paragraph>
        <Paragraph>
          CO2排放量（吨）=净购入量 × CO2排放因子
        </Paragraph>
        <Paragraph>
          注：当净购入量小于等于0时，排放量为0。
        </Paragraph>
        
        {/* 排放因子表格 */}
        <Paragraph>
          <Text strong>{useRegionFactor ? '区域电力排放因子参考表：' : '电力排放因子参考表：'}</Text> // 替换isPaperIndustry为useRegionFactor
        </Paragraph>
        <Table 
          columns={factorColumns} 
          dataSource={useRegionFactor ? regionEmissionFactors : electricityEmissionFactors} // 替换isPaperIndustry为useRegionFactor
          pagination={{ pageSize: 10 }}
          rowKey={useRegionFactor ? 'region' : 'province'} // 替换isPaperIndustry为useRegionFactor
          style={{ marginBottom: 20 }}
        />
        
        {/* 证明材料要求 */}
        <Paragraph>
          <Text strong>证明材料：</Text>
        </Paragraph>
        <Paragraph>
          1、企业提供电力公司账单和外供电量证明。
        </Paragraph>
        <Paragraph>
          2、企业提供热力（蒸汽、热水）购售结算凭证和外供量证明。
        </Paragraph>
      </Card>
    </Card>
  );
}

export default ElectricityHeatEmission;