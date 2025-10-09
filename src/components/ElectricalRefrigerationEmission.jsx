import { useState, useEffect } from 'react';
import { Form, InputNumber, Select, Table, Button, message, Typography, Row, Col, Card, Modal, Input } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 预设气体的全球变暖潜势(GWP)和摩尔质量
const PRESET_GAS_CONSTANTS = {
  SF6: { name: 'SF6', gwp: 23500, molarMass: 146.07 }, // 六氟化硫
  HFCs: { name: 'HFCs', gwp: 1000, molarMass: 102.03 }, // 氢氟碳化物(取HFC-134a为例)
  PFCs: { name: 'PFCs', gwp: 5000, molarMass: 138.01 }  // 全氟化碳(取PFC-14为例)
};

// 填充气体造成泄漏的排放因子(0.342 mol/次)
const DEFAULT_LEAK_FACTOR_MOL = 0.342;

function ElectricalRefrigerationEmission({ onEmissionChange, industry }) {
  const [form] = Form.useForm();
  const [gasRecords, setGasRecords] = useState([]);
  const [totalEmission, setTotalEmission] = useState(0);
  const [selectedGas, setSelectedGas] = useState('SF6');
  const [customGases, setCustomGases] = useState([]);
  const [isCustomGasModalVisible, setIsCustomGasModalVisible] = useState(false);
  const [customGasForm] = Form.useForm();

  // 获取所有可选气体（预设气体 + 自定义气体）
  const getAllAvailableGases = () => {
    const presetOptions = Object.entries(PRESET_GAS_CONSTANTS).map(([key, value]) => ({
      value: key,
      label: value.name,
      isPreset: true
    }));
    const customOptions = customGases.map(gas => ({
      value: `custom-${gas.id}`,
      label: gas.name,
      isPreset: false,
      gasData: gas
    }));
    return [...presetOptions, ...customOptions];
  };

  // 获取气体数据（预设或自定义）
  const getGasData = (gasType) => {
    if (gasType.startsWith('custom-')) {
      const customId = gasType.replace('custom-', '');
      return customGases.find(gas => gas.id === customId);
    }
    return PRESET_GAS_CONSTANTS[gasType];
  };

  // 计算气体泄漏排放因子(吨/次) - 对于预设气体
  const calculateLeakFactor = (gasType) => {
    const gas = getGasData(gasType);
    if (!gas) return 0;
    
    // 如果是自定义气体且提供了自定义泄漏因子，直接使用
    if (gas.customLeakFactor !== undefined) {
      return gas.customLeakFactor;
    }
    
    // 对于预设气体，计算泄漏因子：0.342 mol * 摩尔质量(g/mol) / 1,000,000 g/吨
    return (DEFAULT_LEAK_FACTOR_MOL * gas.molarMass) / 1000000;
  };

  // 计算单条记录的排放量
  const calculateEmission = (record) => {
    const { gasType, initialStock, finalStock, purchasedAmount, 
            beforeFillMass, afterFillMass, measuredMass, fillTimes } = record;
    
    const gas = getGasData(gasType);
    if (!gas) return 0;
    
    const leakFactor = calculateLeakFactor(gasType);
    
    // 计算填充量
    let fillAmount;
    if (measuredMass !== undefined && measuredMass !== null) {
      fillAmount = measuredMass;
    } else if (beforeFillMass !== undefined && afterFillMass !== undefined) {
      fillAmount = beforeFillMass - afterFillMass - (fillTimes * leakFactor);
    } else {
      return 0;
    }
    
    // CO2的总排放 = (期初库存量 + 购入量 - 期末库存量 - 填充量) * GWP
    const emission = (initialStock + purchasedAmount - finalStock - fillAmount) * gas.gwp;
    
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
  }, [gasRecords, customGases]);

  // 添加气体记录
  const handleAddRecord = () => {
    const newRecord = {
      id: Date.now(),
      gasType: selectedGas,
      initialStock: 0,
      finalStock: 0,
      purchasedAmount: 0,
      beforeFillMass: 0,
      afterFillMass: 0,
      measuredMass: null,
      fillTimes: 0
    };
    setGasRecords([...gasRecords, newRecord]);
  };

  // 更新气体记录
  const handleUpdateRecord = (id, field, value) => {
    setGasRecords(gasRecords.map(record => 
      record.id === id ? { ...record, [field]: value } : record
    ));
  };

  // 删除气体记录
  const handleDeleteRecord = (id) => {
    setGasRecords(gasRecords.filter(record => record.id !== id));
  };

  // 打开添加自定义气体模态框
  const showCustomGasModal = () => {
    setIsCustomGasModalVisible(true);
  };

  // 关闭添加自定义气体模态框
  const handleCustomGasModalCancel = () => {
    setIsCustomGasModalVisible(false);
    customGasForm.resetFields();
  };

  // 添加自定义气体
  const handleAddCustomGas = () => {
    customGasForm.validateFields().then(values => {
      const newCustomGas = {
        id: Date.now().toString(),
        name: values.name,
        gwp: values.gwp,
        customLeakFactor: values.customLeakFactor || undefined
      };
      
      setCustomGases([...customGases, newCustomGas]);
      setIsCustomGasModalVisible(false);
      customGasForm.resetFields();
      message.success('自定义气体添加成功！');
    });
  };

  // 删除自定义气体
  const handleDeleteCustomGas = (id) => {
    const gasInUse = gasRecords.some(record => record.gasType === `custom-${id}`);
    if (gasInUse) {
      message.error('该自定义气体正在使用中，无法删除！');
      return;
    }
    setCustomGases(customGases.filter(gas => gas.id !== id));
    message.success('自定义气体删除成功！');
  };

  // 表格列配置
  const columns = [
    {
      title: '气体类型',
      dataIndex: 'gasType',
      key: 'gasType',
      render: (text, record) => (
        <Select
          value={text}
          style={{ width: 120 }}
          onChange={(value) => handleUpdateRecord(record.id, 'gasType', value)}
        >
          {getAllAvailableGases().map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}{option.isPreset ? ' (预设)' : ' (自定义)'}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: '期初库存量(吨)',
      dataIndex: 'initialStock',
      key: 'initialStock',
      render: (text, record) => (
        <InputNumber
          value={text}
          style={{ width: 100 }}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateRecord(record.id, 'initialStock', value)}
        />
      )
    },
    {
      title: '期末库存量(吨)',
      dataIndex: 'finalStock',
      key: 'finalStock',
      render: (text, record) => (
        <InputNumber
          value={text}
          style={{ width: 100 }}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateRecord(record.id, 'finalStock', value)}
        />
      )
    },
    {
      title: '购入量(吨)',
      dataIndex: 'purchasedAmount',
      key: 'purchasedAmount',
      render: (text, record) => (
        <InputNumber
          value={text}
          style={{ width: 100 }}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateRecord(record.id, 'purchasedAmount', value)}
        />
      )
    },
    {
      title: '填充前容器内质量(吨)',
      dataIndex: 'beforeFillMass',
      key: 'beforeFillMass',
      render: (text, record) => (
        <InputNumber
          value={text}
          style={{ width: 120 }}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateRecord(record.id, 'beforeFillMass', value)}
        />
      )
    },
    {
      title: '填充后容器内质量(吨)',
      dataIndex: 'afterFillMass',
      key: 'afterFillMass',
      render: (text, record) => (
        <InputNumber
          value={text}
          style={{ width: 120 }}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateRecord(record.id, 'afterFillMass', value)}
        />
      )
    },
    {
      title: '流量计测得质量(吨)',
      dataIndex: 'measuredMass',
      key: 'measuredMass',
      render: (text, record) => (
        <InputNumber
          value={text}
          style={{ width: 120 }}
          min={0}
          step={0.001}
          onChange={(value) => handleUpdateRecord(record.id, 'measuredMass', value)}
          placeholder="可选"
        />
      )
    },
    {
      title: '对制冷或电气设备填充的次数',
      dataIndex: 'fillTimes',
      key: 'fillTimes',
      render: (text, record) => (
        <InputNumber
          value={text}
          style={{ width: 150 }}
          min={0}
          onChange={(value) => handleUpdateRecord(record.id, 'fillTimes', value)}
          placeholder="设备填充次数"
        />
      )
    },
    {
      title: '气体泄漏排放因子(吨/次)',
      key: 'leakFactor',
      render: (_, record) => calculateLeakFactor(record.gasType).toFixed(8)
    },
    {
      title: '排放量(吨CO2e)',
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
    <div className="electrical-refrigeration-emission">
      <Title level={4}>{industry} - 电气与制冷设备生产的过程排放</Title>
      
      <Card className="calculation-formula" style={{ marginBottom: 20 }}>
        <Title level={5}>计算公式</Title>
        <p><strong>CO2排放(吨CO2e) = (期初库存量 + 购入量 - 期末库存量 - 填充量) × GWP</strong></p>
        <p>其中：填充量优先使用流量计测得值；无流量计时，填充量 = 填充前容器内质量 - 填充后容器内质量 - (填充次数 × 泄漏排放因子)</p>
        <p>填充气体泄漏排放因子：预设气体使用0.342 mol/次 × 气体摩尔质量(g/mol) / 1000000；自定义气体可手动输入</p>
        <p>预设气体全球变暖潜势(GWP)：SF6 = 23500，HFCs = 1000(以HFC-134a为例)，PFCs = 5000(以PFC-14为例)</p>
      </Card>

      <div className="add-record-section" style={{ marginBottom: 20 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>选择气体类型：</Text>
          </Col>
          <Col>
            <Select
              value={selectedGas}
              style={{ width: 150 }}
              onChange={setSelectedGas}
            >
              {getAllAvailableGases().map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}{option.isPreset ? ' (预设)' : ' (自定义)'}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button type="primary" onClick={handleAddRecord}>添加气体记录</Button>
          </Col>
          <Col>
            <Button onClick={showCustomGasModal}>添加自定义气体</Button>
          </Col>
        </Row>
      </div>

      {/* 自定义气体列表 */}
      {customGases.length > 0 && (
        <Card title="自定义气体列表" style={{ marginBottom: 20 }}>
          <Table
            columns={[
              { title: '气体名称', dataIndex: 'name', key: 'name' },
              { title: '全球变暖潜势(GWP)', dataIndex: 'gwp', key: 'gwp' },
              { title: '自定义泄漏排放因子(吨/次)', dataIndex: 'customLeakFactor', key: 'customLeakFactor', render: value => value ? value.toFixed(8) : '-' },
              { 
                title: '操作', 
                key: 'action', 
                render: (_, record) => (
                  <Button danger size="small" onClick={() => handleDeleteCustomGas(record.id)}>删除</Button>
                )
              }
            ]}
            dataSource={customGases}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={gasRecords}
        rowKey="id"
        pagination={false}
        size="small"
      />

      {gasRecords.length > 0 && (
        <div className="total-emission" style={{ marginTop: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <Text strong>电气与制冷设备生产的过程排放总量：{totalEmission.toFixed(4)} 吨CO2e</Text>
        </div>
      )}

      {/* 添加自定义气体模态框 */}
      <Modal
        title="添加自定义气体"
        open={isCustomGasModalVisible}
        onOk={handleAddCustomGas}
        onCancel={handleCustomGasModalCancel}
      >
        <Form form={customGasForm} layout="vertical">
          <Form.Item
            name="name"
            label="气体名称"
            rules={[{ required: true, message: '请输入气体名称' }]}
          >
            <Input placeholder="例如：HFC-32" />
          </Form.Item>
          <Form.Item
            name="gwp"
            label="全球变暖潜势(GWP)"
            rules={[{ required: true, message: '请输入全球变暖潜势' }, { type: 'number', min: 0, message: 'GWP必须大于或等于0' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="例如：675" />
          </Form.Item>
          <Form.Item
            name="customLeakFactor"
            label="自定义泄漏排放因子(吨/次)"
            tooltip="不填写则使用默认计算方法：0.342 mol/次 × 气体摩尔质量/1000000"
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.00000001} placeholder="例如：0.00005" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ElectricalRefrigerationEmission;