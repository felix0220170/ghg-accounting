import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Typography, Card, Row, Col } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Item } = Form;

function TailGasPurificationEmission({ onEmissionChange, industry }) {
  // 表单状态
  const [form] = Form.useForm();
  // 计算结果状态 - 只保留排放量
  const [calculatedEmission, setCalculatedEmission] = useState(0);
  
  // 从values数组中获取指定字段的值
  const getValueFromFields = useCallback((fields, fieldName) => {
    if (Array.isArray(fields)) {
      const field = fields.find(f => 
        Array.isArray(f.name) && f.name[0] === fieldName
      );
      return field ? field.value : '';
    }
    return fields?.[fieldName] || '';
  }, []);
  
  // 计算尾气净化过程排放量 - 修复：正确处理values数组格式
  const calculateEmission = useCallback((values) => {
    try {
      // 从values数组中获取各个字段的值
      const ureaAmount = getValueFromFields(values, 'ureaAmount');
      const ureaPurity = getValueFromFields(values, 'ureaPurity');
      
      // 输入验证和数值转换
      const amount = parseFloat(ureaAmount) || 0;
      const purity = parseFloat(ureaPurity) || 99.6; // 默认99.6%
      
      // 确保纯度在0-100范围内
      const normalizedPurity = Math.min(100, Math.max(0, purity));
      
      // 计算排放因子 (12/60×P×44/12×10^-3)
      const factor = (12 / 60) * (normalizedPurity / 100) * (44 / 12) * 0.001;
      
      // 计算排放量 E = M × 因子
      const emission = amount * factor;
      
      return emission;
    } catch (error) {
      console.error('计算错误:', error);
      return 0;
    }
  }, [getValueFromFields]);
  
  // 监听表单变化 - 修复：使用正确的方式处理表单变化
  const handleFieldsChange = useCallback((changedValues, allValues) => {
    try {
      // 当表单值变化时，计算并通知父组件
      const emission = calculateEmission(allValues);
      setCalculatedEmission(emission);
      onEmissionChange(emission);
    } catch (error) {
      console.error('处理表单变化时出错:', error);
      setCalculatedEmission(0);
      onEmissionChange(0);
    }
  }, [calculateEmission, onEmissionChange]);
  
  // 初始计算
  useEffect(() => {
    // 使用标志变量来跟踪组件是否已卸载
    let isMounted = true;
    
    // 设置默认纯度值
    form.setFieldsValue({ ureaPurity: '99.6' });
    
    const validateAndCalculate = () => {
      form.validateFields().then(values => {
        // 检查组件是否仍被挂载
        if (isMounted) {
          const emission = calculateEmission(values);
          setCalculatedEmission(emission);
          onEmissionChange(emission);
        }
      }).catch(error => {
        // 表单验证失败时
        console.error('表单验证失败:', error);
        if (isMounted) {
          setCalculatedEmission(0);
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
  }, [form, calculateEmission, onEmissionChange]);
  
  // 格式化数字显示
  const formatNumber = (value) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value || 0);
  };
  
  return (
    <Card title={`${industry || '陆上交通运输行业'} - 尾气净化过程排放量计算`}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form 
            form={form}
            layout="vertical"
            onFieldsChange={handleFieldsChange} // 恢复为onFieldsChange
            initialValues={{ ureaPurity: '99.6' }} // 字符串形式的默认值
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Item 
                  label="尿素使用量(kg)" 
                  name="ureaAmount"
                  rules={[
                    { pattern: /^\d*(\.\d+)?$/, message: '请输入有效的数字' },
                    { min: 0, message: '数值不能为负数' }
                  ]}
                >
                  <Input placeholder="请输入尿素使用量" />
                </Item>
              </Col>
              <Col span={8}>
                <Item 
                  label="尿素纯度(%)" 
                  name="ureaPurity"
                  rules={[
                    { pattern: /^\d*(\.\d+)?$/, message: '请输入有效的数字' },
                    { min: 0, max: 100, message: '纯度应在0-100之间' }
                  ]}
                >
                  <Input placeholder="默认99.6%" />
                </Item>
              </Col>
            </Row>
          </Form>
        </Col>
        
        {/* 计算结果显示 - 移除排放因子显示 */}
        <Col span={24}>
          <div style={{ 
            padding: 20, 
            backgroundColor: '#f0f2f5', 
            borderRadius: 8, 
            marginTop: 20 
          }}>
            <Title level={5} style={{ marginBottom: 10 }}>计算结果</Title>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <div>
                  <Text type="secondary">尾气净化过程排放量：</Text>
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatNumber(calculatedEmission)} tCO2
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
        
        {/* 计算说明 */}
        <Col span={24}>
          <div style={{ 
            padding: 20, 
            backgroundColor: '#e6f7ff', 
            borderRadius: 8, 
            marginTop: 20 
          }}>
            <Title level={5}>计算说明</Title>
            <Paragraph>
              尾气净化过程排放量计算公式：E过程 = M × 12/60 × P × 44/12 × 10⁻³
            </Paragraph>
            <ul>
              <li>E过程：尾气净化过程产生的二氧化碳排放量，单位为吨CO2（tCO2）</li>
              <li>M：尿素使用量，单位为千克（kg）</li>
              <li>P：尿素纯度，单位为%（默认值：99.6%）</li>
              <li>12/60：尿素中氮的质量分数</li>
              <li>44/12：CO2与C的分子量之比</li>
              <li>10⁻³：单位转换因子（从kg转换为t）</li>
            </ul>
          </div>
        </Col>
      </Row>
    </Card>
  );
}

export default TailGasPurificationEmission;