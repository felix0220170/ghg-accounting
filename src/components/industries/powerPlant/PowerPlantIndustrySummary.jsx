import React from 'react';
import { Card, Statistic, Row, Col, Table } from 'antd';

// 月份数组
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const PowerPlantIndustrySummary = ({ data }) => {
  // 默认数据，防止data未定义时报错
  const defaultData = {
    fuelEmission: { CO2: 0, CH4: 0, N2O: 0, total: 0 },
    electricityEmission: { CO2: 0, CH4: 0, N2O: 0, total: 0 },
    totalEmission: { CO2: 0, CH4: 0, N2O: 0, total: 0 },
    units: [],
    monthlyUnitEmissions: {
      fuel: [],
      electricity: []
    }
  };

  // 计算月度汇总数据
  const calculateMonthlySummary = (unitEmissions) => {
    const summary = {};
    MONTHS.forEach(month => {
      summary[month] = unitEmissions.reduce((sum, unit) => sum + (unit[month] || 0), 0);
    });
    return summary;
  };

  // 计算合并的月度汇总数据
  const calculateCombinedMonthlySummary = (data) => {
    const summary = {};
    MONTHS.forEach(month => {
      const fuelTotal = data.monthlyUnitEmissions.fuel.reduce((sum, unit) => sum + (unit[month] || 0), 0);
      const electricityTotal = data.monthlyUnitEmissions.electricity.reduce((sum, unit) => sum + (unit[month] || 0), 0);
      summary[month] = fuelTotal + electricityTotal;
    });
    return summary;
  };

  const summaryData = data || defaultData;

  // 排放类型表格数据
  const emissionTableData = [
    {
      key: '1',
      emissionType: '化石燃料燃烧排放',
      CO2: summaryData.fuelEmission.CO2,
      CH4: summaryData.fuelEmission.CH4,
      N2O: summaryData.fuelEmission.N2O,
      total: summaryData.fuelEmission.total,
    },
    {
      key: '2',
      emissionType: '购入使用电力排放',
      CO2: summaryData.electricityEmission.CO2,
      CH4: summaryData.electricityEmission.CH4,
      N2O: summaryData.electricityEmission.N2O,
      total: summaryData.electricityEmission.total,
    },
    {
      key: '3',
      emissionType: '合计',
      CO2: summaryData.totalEmission.CO2,
      CH4: summaryData.totalEmission.CH4,
      N2O: summaryData.totalEmission.N2O,
      total: summaryData.totalEmission.total,
    },
  ];

  // 排放类型表格列
  const emissionColumns = [
    { title: '排放类型', dataIndex: 'emissionType', key: 'emissionType' },
    { 
      title: 'CO2排放量(吨)', 
      dataIndex: 'CO2', 
      key: 'CO2',
      render: (text) => text.toFixed(2)
    },
    { 
      title: 'CH4排放量(吨)', 
      dataIndex: 'CH4', 
      key: 'CH4',
      render: (text) => text.toFixed(2)
    },
    { 
      title: 'N2O排放量(吨)', 
      dataIndex: 'N2O', 
      key: 'N2O',
      render: (text) => text.toFixed(2)
    },
    { 
      title: '总排放量(吨CO2e)', 
      dataIndex: 'total', 
      key: 'total',
      render: (text) => text.toFixed(2)
    },
  ];

  // 机组信息表格数据
  const unitTableData = summaryData.units.map((unit, index) => ({
    key: index + 1,
    name: unit.name,
    type: unit.type,
    capacity: unit.capacity,
    fuelType: unit.fuelType,
    status: unit.status,
  }));

  // 机组信息表格列
  const unitColumns = [
    { title: '机组名称', dataIndex: 'name', key: 'name' },
    { title: '机组类型', dataIndex: 'type', key: 'type' },
    { title: '装机容量(MW)', dataIndex: 'capacity', key: 'capacity' },
    { title: '燃料类型', dataIndex: 'fuelType', key: 'fuelType' },
    { title: '运行状态', dataIndex: 'status', key: 'status' },
  ];

  return (
    <div className="power-plant-industry-summary">
      <h3>发电设施碳排放汇总</h3>
      
      {/* 排放量统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="化石燃料燃烧排放" 
              value={summaryData.fuelEmission.total} 
              precision={2}
              suffix="吨CO2e"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="购入使用电力排放" 
              value={summaryData.electricityEmission.total} 
              precision={2}
              suffix="吨CO2e"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic 
              title="总排放量" 
              value={summaryData.totalEmission.total} 
              precision={2}
              suffix="吨CO2e"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>



      {/* 机组信息表格 */}
      {/* 化石燃料各机组按月汇总 */}




      {/* 总体按月汇总 */}
      <div style={{ marginBottom: 24 }}>
        <h4>总体月度排放汇总</h4>
        <Table
          columns={[
            { title: '排放类型', dataIndex: 'type', key: 'type' },
            ...MONTHS.map(month => ({
              title: month,
              dataIndex: month,
              key: month,
              render: value => value.toFixed(2)
            })),
            {
              title: '全年累计',
              dataIndex: 'total',
              key: 'total',
              render: value => value.toFixed(2)
            }
          ]}
          dataSource={[
            {
              key: '1',
              type: '化石燃料燃烧排放',
              ...calculateMonthlySummary(summaryData.monthlyUnitEmissions.fuel),
              total: summaryData.fuelEmission.total
            },
            {
              key: '2',
              type: '购入使用电力排放',
              ...calculateMonthlySummary(summaryData.monthlyUnitEmissions.electricity),
              total: summaryData.electricityEmission.total
            },
            {
              key: '3',
              type: '合计',
              ...calculateCombinedMonthlySummary(summaryData),
              total: summaryData.totalEmission.total
            }
          ]}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>


    </div>
  );
};


export default PowerPlantIndustrySummary;