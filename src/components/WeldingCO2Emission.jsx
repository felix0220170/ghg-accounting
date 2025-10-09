import { useState, useEffect } from 'react';
import { Form, InputNumber, Input, Button, Table, Card, Typography, message } from 'antd';

const { Title, Text } = Typography;

function WeldingCO2Emission({ onEmissionChange, industry }) {
  const [form] = Form.useForm();
  const [gasRecords, setGasRecords] = useState([]);
  const [totalEmission, setTotalEmission] = useState(0);

  // 计算单个保护气的CO2排放量
  const calculateEmission = (record) => {
    const { gasName, netUsage, co2Percentage, mixedGasComponents } = record;
    
    if (!netUsage || !co2Percentage || !mixedGasComponents || mixedGasComponents.length === 0) {
      return 0;
    }
    
    // 计算分母：Sum(混合气体中每种气体的体积百分比 * 混合气体中每种气体的摩尔质量)
    const denominator = mixedGasComponents.reduce((sum, component) => {
      if (component.percentage && component.molarMass) {
        return sum + (component.percentage * component.molarMass);
      }
      return sum;
    }, 0);
    
    if (denominator === 0) return 0;
    
    // 保护气的CO2排放 = 保护气的净使用量 * 保护气中CO2的体积百分比 / Sum(...)
    const emission = (netUsage * co2Percentage) / denominator;
    
    return Math.max(0, emission); // 确保排放量不为负
  };

  // 计算总排放量
  const calculateTotalEmission = () => {
    const total = gasRecords.reduce((sum, record) => sum + calculateEmission(record), 0);
    setTotalEmission(total);
    if (onEmissionChange) {
      onEmissionChange(total);
    }
  };

  // 当气体记录变化时重新计算总排放量
  useEffect(() => {
    calculateTotalEmission();
  }, [gasRecords]);

  // 添加新的保护气记录
  const handleAddGasRecord = () => {
    const newRecord = {
      id: Date.now(),
      gasName: '',
      initialStock: 0,
      purchasedAmount: 0,
      finalStock: 0,
      soldAmount: 0,
      netUsage: 0, // 可以直接输入或自动计算
      co2Percentage: 0, // CO2体积百分比
      mixedGasComponents: [{ id: Date.now(), percentage: 0, molarMass: 0 }] // 混合气体成分
    };
    setGasRecords([...gasRecords, newRecord]);
  };

  // 更新气体记录的基本信息
  const handleUpdateRecord = (id, field, value) => {
    setGasRecords(gasRecords.map(record => 
      record.id === id ? { ...record, [field]: value } : record
    ));
  };

  // 更新净使用量（自动计算或直接输入）
  const handleUpdateNetUsage = (id, type, value) => {
    setGasRecords(gasRecords.map(record => {
      if (record.id === id) {
        if (type === 'direct') {
          // 直接输入净使用量
          return { ...record, netUsage: value };
        } else {
          // 更新库存量或购买量，然后重新计算净使用量
          const updatedRecord = { ...record, [type]: value };
          // 净使用量 = 期初库存 + 购入量 - 期末库存 - 售出量
          updatedRecord.netUsage = (updatedRecord.initialStock || 0) + 
                                  (updatedRecord.purchasedAmount || 0) - 
                                  (updatedRecord.finalStock || 0) - 
                                  (updatedRecord.soldAmount || 0);
          return updatedRecord;
        }
      }
      return record;
    }));
  };

  // 添加混合气体成分
  const handleAddComponent = (recordId) => {
    setGasRecords(gasRecords.map(record => {
      if (record.id === recordId) {
        const newComponent = { id: Date.now(), percentage: 0, molarMass: 0 };
        return { ...record, mixedGasComponents: [...record.mixedGasComponents, newComponent] };
      }
      return record;
    }));
  };

  // 更新混合气体成分
  const handleUpdateComponent = (recordId, componentId, field, value) => {
    setGasRecords(gasRecords.map(record => {
      if (record.id === recordId) {
        const updatedComponents = record.mixedGasComponents.map(component => {
          if (component.id === componentId) {
            return { ...component, [field]: value };
          }
          return component;
        });
        return { ...record, mixedGasComponents: updatedComponents };
      }
      return record;
    }));
  };

  // 删除混合气体成分
  const handleDeleteComponent = (recordId, componentId) => {
    setGasRecords(gasRecords.map(record => {
      if (record.id === recordId) {
        // 确保至少保留一个成分
        if (record.mixedGasComponents.length > 1) {
          const updatedComponents = record.mixedGasComponents.filter(component => component.id !== componentId);
          return { ...record, mixedGasComponents: updatedComponents };
        } else {
          message.warning('至少需要保留一个混合气体成分');
        }
      }
      return record;
    }));
  };

  // 删除气体记录
  const handleDeleteRecord = (id) => {
    setGasRecords(gasRecords.filter(record => record.id !== id));
  };

  // 混合气体成分表格列
  const componentColumns = (recordId) => [
    {
      title: '体积百分比(%)',
      key: 'percentage',
      render: (_, component) => (
        <InputNumber
          value={component.percentage}
          min={0}
          max={100}
          step={0.01}
          onChange={(value) => handleUpdateComponent(recordId, component.id, 'percentage', value)}
        />
      )
    },
    {
      title: '摩尔质量(g/mol)',
      key: 'molarMass',
      render: (_, component) => (
        <InputNumber
          value={component.molarMass}
          min={0}
          step={0.01}
          onChange={(value) => handleUpdateComponent(recordId, component.id, 'molarMass', value)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, component) => {
        // 如果只有一个成分，不显示删除按钮
        const record = gasRecords.find(r => r.id === recordId);
        if (record && record.mixedGasComponents.length > 1) {
          return (
            <Button danger size="small" onClick={() => handleDeleteComponent(recordId, component.id)}>删除</Button>
          );
        }
        return null;
      }
    }
  ];

  // 气体记录表列配置
  const columns = [
    {
      title: '保护气名称',
      key: 'gasName',
      render: (_, record) => (
        <Input
          value={record.gasName}
          onChange={(e) => handleUpdateRecord(record.id, 'gasName', e.target.value)}
          placeholder="例如：CO2-Ar混合气"
        />
      )
    },
    {
      title: '期初库存量(吨)',
      key: 'initialStock',
      render: (_, record) => (
        <InputNumber
          value={record.initialStock}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateNetUsage(record.id, 'initialStock', value)}
        />
      )
    },
    {
      title: '购入量(吨)',
      key: 'purchasedAmount',
      render: (_, record) => (
        <InputNumber
          value={record.purchasedAmount}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateNetUsage(record.id, 'purchasedAmount', value)}
        />
      )
    },
    {
      title: '期末库存量(吨)',
      key: 'finalStock',
      render: (_, record) => (
        <InputNumber
          value={record.finalStock}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateNetUsage(record.id, 'finalStock', value)}
        />
      )
    },
    {
      title: '售出量(吨)',
      key: 'soldAmount',
      render: (_, record) => (
        <InputNumber
          value={record.soldAmount}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateNetUsage(record.id, 'soldAmount', value)}
        />
      )
    },
    {
      title: '净使用量(吨)',
      key: 'netUsage',
      render: (_, record) => (
        <div>
          <InputNumber
            value={record.netUsage}
            min={0}
            step={0.001}
            onChange={(value) => handleUpdateNetUsage(record.id, 'direct', value)}
            placeholder="可直接输入"
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>净使用量 = 期初库存 + 购入量 - 期末库存 - 售出量</Text>
        </div>
      )
    },
    {
      title: 'CO2体积百分比(%)',
      key: 'co2Percentage',
      render: (_, record) => (
        <InputNumber
          value={record.co2Percentage}
          min={0}
          max={100}
          step={0.01}
          onChange={(value) => handleUpdateRecord(record.id, 'co2Percentage', value)}
        />
      )
    },
    {
      title: '混合气体成分',
      key: 'components',
      render: (_, record) => (
        <div>
          <Table
            dataSource={record.mixedGasComponents}
            columns={componentColumns(record.id)}
            pagination={false}
            size="small"
            rowKey="id"
          />
          <Button 
            type="link" 
            size="small" 
            onClick={() => handleAddComponent(record.id)}
          >
            添加成分
          </Button>
        </div>
      )
    },
    {
      title: 'CO2排放量(吨)',
      key: 'emission',
      render: (_, record) => calculateEmission(record).toFixed(4)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button danger size="small" onClick={() => handleDeleteRecord(record.id)}>删除</Button>
      )
    }
  ];

  return (
    <div className="welding-co2-emission">
      <Title level={4}>{industry} - CO2作为保护气的焊接过程造成的排放</Title>
      
      <Card className="calculation-formula" style={{ marginBottom: 20 }}>
        <Title level={5}>计算公式</Title>
        <p><strong>保护气的CO2排放(吨) = 保护气的净使用量(吨) × 保护气中CO2的体积百分比(%) / Sum(混合气体中每种气体的体积百分比(%) × 混合气体中每种气体的摩尔质量(g/mol))</strong></p>
        <p><strong>保护气的净使用量(吨) = 期初库存量(吨) + 购入量(吨) - 期末库存量(吨) - 售出量(吨)</strong></p>
      </Card>

      <div className="add-record-section" style={{ marginBottom: 20 }}>
        <Button type="primary" onClick={handleAddGasRecord}>添加保护气记录</Button>
      </div>

      <Table
        columns={columns}
        dataSource={gasRecords}
        rowKey="id"
        pagination={false}
        size="small"
      />

      {gasRecords.length > 0 && (
        <div className="total-emission" style={{ marginTop: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <Text strong>CO2作为保护气的焊接过程排放总量：{totalEmission.toFixed(4)} 吨CO2</Text>
        </div>
      )}
    </div>
  );
}

export default WeldingCO2Emission;