import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Typography, Card, Row, Col } from 'antd';
import { DoubleRightOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Item } = Form;

function CO2RecyclingEmission({ onEmissionChange, industry }) {
  // 表单状态
  const [form] = Form.useForm();
  // 添加计算结果状态
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  
  // CO2密度常量（吨/万Nm³）
  const CO2_DENSITY = 19.77;
  
  // 从values数组中获取指定字段的值
  const getValueFromFields = (fields, fieldName) => {
    // 如果fields是数组
    if (Array.isArray(fields)) {
      const field = fields.find(f => 
        Array.isArray(f.name) && f.name[0] === fieldName
      );
      return field ? field.value : '';
    }
    // 如果fields是对象（用于form.validateFields返回的情况）
    return fields?.[fieldName] || '';
  };
  
  // 计算CO2回收和利用量 - 修复：正确处理values数组格式
  const calculateCO2RecyclingAmount = useCallback((values) => {
    try {
      // 从values数组中获取各个字段的值
      const externalSupplyVolume = getValueFromFields(values, 'externalSupplyVolume');
      const externalSupplyConcentration = getValueFromFields(values, 'externalSupplyConcentration');
      const rawMaterialVolume = getValueFromFields(values, 'rawMaterialVolume');
      const rawMaterialConcentration = getValueFromFields(values, 'rawMaterialConcentration');
      
      // 输入验证和数值转换
      // 浓度现在接受百分比值(0-100)，内部转换为小数(0-1)
      const supplyVolume = parseFloat(externalSupplyVolume) || 0;
      const supplyConcentration = (parseFloat(externalSupplyConcentration) || 0) / 100; // 转换为小数
      const materialVolume = parseFloat(rawMaterialVolume) || 0;
      const materialConcentration = (parseFloat(rawMaterialConcentration) || 0) / 100; // 转换为小数
      
      // 确保浓度在0-1范围内
      const normalizedSupplyConcentration = Math.min(1, Math.max(0, supplyConcentration));
      const normalizedMaterialConcentration = Math.min(1, Math.max(0, materialConcentration));
      
      // 计算CO2回收和利用量
      const totalCO2Recycling = (
        supplyVolume * normalizedSupplyConcentration + 
        materialVolume * normalizedMaterialConcentration
      ) * CO2_DENSITY;
      
      return totalCO2Recycling;
    } catch (error) {
      console.error('计算错误:', error);
      return 0;
    }
  }, []);
  
  // 监听表单变化的函数
  const handleFieldsChange = useCallback((changedValues, allValues) => {
    // 当表单值变化时，计算并通知父组件
    try {
      const co2RecyclingAmount = calculateCO2RecyclingAmount(allValues);
      setCalculatedTotal(co2RecyclingAmount); // 更新本地状态以显示结果
      onEmissionChange(co2RecyclingAmount);
    } catch (error) {
      console.error('处理表单变化时出错:', error);
      setCalculatedTotal(0);
      onEmissionChange(0);
    }
  }, [calculateCO2RecyclingAmount, onEmissionChange]);
  
  // 初始计算
  useEffect(() => {
    // 使用标志变量来跟踪组件是否已卸载
    let isMounted = true;
    
    const validateAndCalculate = () => {
      form.validateFields().then(values => {
        // 检查组件是否仍被挂载
        if (isMounted) {
          const co2RecyclingAmount = calculateCO2RecyclingAmount(values);
          setCalculatedTotal(co2RecyclingAmount);
          onEmissionChange(co2RecyclingAmount);
        }
      }).catch(error => {
        // 表单验证失败时
        console.error('表单验证失败:', error);
        if (isMounted) {
          setCalculatedTotal(0);
          onEmissionChange(0);
        }
      });
    };
    
    // 初始计算
    validateAndCalculate();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [form, calculateCO2RecyclingAmount, onEmissionChange]);
  
  // 格式化数字显示
  const formatNumber = (num) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };
  
  return (
    <Card title={`表6：CO2回收和利用量（${industry}）`} style={{ marginBottom: 20 }}>
      <Paragraph type="secondary" style={{ marginBottom: 20 }}>
        CO2气体的密度（吨/万Nm³）为常量 19.77 为标准状况下 CO2 气体的密度
      </Paragraph>
      
      {/* 添加计算结果显示区域 */}
      <Card 
        title="计算结果" 
        style={{ marginBottom: 20, borderLeft: '4px solid #1890ff' }}
        type="inner"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>
            CO2回收和利用总量： {formatNumber(calculatedTotal)} 吨
          </Text>
        </div>
      </Card>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          externalSupplyVolume: '',
          externalSupplyConcentration: '',
          rawMaterialVolume: '',
          rawMaterialConcentration: ''
        }}
        onFieldsChange={handleFieldsChange}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Item
              label="CO2 回收外供量（万 Nm³）"
              name="externalSupplyVolume"
              rules={[
                {
                  pattern: /^\d*\.?\d*$/,
                  message: '请输入有效的数字',
                  validateFirst: true
                },
                {
                  validator: (_, value) => {
                    if (value && parseFloat(value) < 0) {
                      return Promise.reject('数值不能为负数');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input placeholder="请输入CO2回收外供量" />
            </Item>
          </Col>
          
          <Col span={12}>
            <Item
              label="外供气体 CO2 体积浓度（%）"
              name="externalSupplyConcentration"
              rules={[
                {
                  pattern: /^\d*\.?\d*$/,
                  message: '请输入有效的数字',
                  validateFirst: true
                },
                {
                  validator: (_, value) => {
                    // 验证范围从0-100%，更符合用户对百分比的理解
                    if (value && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
                      return Promise.reject('浓度取值范围为0-100%');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input placeholder="请输入外供气体CO2体积浓度百分比，范围0-100%" />
            </Item>
          </Col>
          
          <Col span={12}>
            <Item
              label="CO2 回收作原料量（万 Nm³）"
              name="rawMaterialVolume"
              rules={[
                {
                  pattern: /^\d*\.?\d*$/,
                  message: '请输入有效的数字',
                  validateFirst: true
                },
                {
                  validator: (_, value) => {
                    if (value && parseFloat(value) < 0) {
                      return Promise.reject('数值不能为负数');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input placeholder="请输入CO2回收作原料量" />
            </Item>
          </Col>
          
          <Col span={12}>
            <Item
              label="原料气 CO2 体积浓度（%）"
              name="rawMaterialConcentration"
              rules={[
                {
                  pattern: /^\d*\.?\d*$/,
                  message: '请输入有效的数字',
                  validateFirst: true
                },
                {
                  validator: (_, value) => {
                    // 验证范围从0-100%，更符合用户对百分比的理解
                    if (value && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
                      return Promise.reject('浓度取值范围为0-100%');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input placeholder="请输入原料气CO2体积浓度百分比，范围0-100%" />
            </Item>
          </Col>
        </Row>
        
        {/* 计算说明和结果显示 */}
        <Card title="计算说明" style={{ marginTop: 20 }}>
          <Paragraph>
            CO2回收和利用量（吨） = （CO2 回收外供量 * 外供气体 CO2 体积浓度百分比/100 + CO2 回收作原料量 * 原料气 CO2 体积浓度百分比/100） * 19.77
          </Paragraph>
          
          <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 4 }}>
            <Text strong>计算公式：</Text>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text>CO2回收和利用量</Text>
                <DoubleRightOutlined style={{ margin: '0 10px' }} />
                <Text>({`外供量 × (外供浓度%/100) + 原料量 × (原料浓度%/100)`}) × 19.77</Text>
              </div>
            </div>
          </div>
          
          {/* 添加证明材料要求 */}
          <div style={{ marginTop: 20 }}>
            <Paragraph>
              <Text strong>证明材料：</Text>
            </Paragraph>
            <Paragraph>
              1、请企业提供台帐或统计报表来证明CO2气体回收外供量以及回收自用作生产原料的 CO2 量。
            </Paragraph>
            <Paragraph>
              2、请企业提供台帐记录来证明CO2外供气体的CO2 气体的 CO2 体积浓度以及回收自用作生产原料的 CO2 气体的 CO2 体积浓度。
            </Paragraph>
          </div>
        </Card>
      </Form>
    </Card>
  );
}

export default CO2RecyclingEmission;