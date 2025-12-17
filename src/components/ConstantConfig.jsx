import React, { useState } from 'react';
import { Row, Col, List, Typography, Button, Card } from 'antd';
import { GREENHOUSE_GAS_GWP } from '../config/greenhouseGasConstants';
import { DEFAULT_HEAT_EMISSION_FACTOR, EMISSION_UNIT } from '../config/emissionConstants';

const { Title, Text } = Typography;

const ConstantConfig = () => {
  // 选中的常量类别
  const [selectedConstantCategory, setSelectedConstantCategory] = useState('化石燃料常量');

  // 常量类别列表
  const constantCategories = [
    '化石燃料常量',
    '电力排放因子',
    '热力排放因子',
    '温室气体GWP值',
    '常见化工产品',
    '碳酸盐排放因子',
    '露天煤矿和矿后活动的CH4逃逸排放因子',
    '硝酸生产技术类型的排放因子'
  ];

  // 固体燃料数据
  const SOLID_FUELS = [
    { id: 'anthracite', name: '无烟煤', calorificValue: 22.867, carbonContent: 0.02749, type: 'solid' },
    { id: 'bituminous', name: '烟煤', calorificValue: 23.076, carbonContent: 0.02308, type: 'solid' },
    { id: 'lignite', name: '褐煤', calorificValue: 14.759, carbonContent: 0.02797, type: 'solid' },
    { id: 'gangue', name: '煤矸石', calorificValue: 8.374, carbonContent: 0.02541, type: 'solid' },
    { id: 'sludge', name: '煤泥', calorificValue: 12.545, carbonContent: 0.02541, type: 'solid' },
    { id: 'coke', name: '焦炭', calorificValue: 28.435, carbonContent: 0.02942, type: 'solid' },
    { id: 'petroleumCoke', name: '石油焦', calorificValue: 32.500, carbonContent: 0.02750, type: 'solid' }
  ];

  // 液体燃料数据
  const LIQUID_FUELS = [
    { id: 'crudeOil', name: '原油', calorificValue: 41.816, carbonContent: 0.02008, type: 'liquid', oxidationRate: 98 },
    { id: 'fuelOil', name: '燃料油', calorificValue: 41.816, carbonContent: 0.02110, type: 'liquid', oxidationRate: 98 },
    { id: 'gasoline', name: '汽油', calorificValue: 43.070, carbonContent: 0.01890, type: 'liquid', oxidationRate: 98 },
    { id: 'diesel', name: '柴油', calorificValue: 42.652, carbonContent: 0.02020, type: 'liquid', oxidationRate: 98 },
    { id: 'kerosene', name: '煤油', calorificValue: 43.070, carbonContent: 0.01960, type: 'liquid', oxidationRate: 98 },
    { id: 'aeroGasoline', name: '航空汽油', calorificValue: 44.300 , carbonContent: 0.01910, type: 'liquid', oxidationRate: 100 },
    { id: 'aeroKerosene', name: '航空煤油', calorificValue: 44.100, carbonContent: 0.01950, type: 'liquid', oxidationRate: 100 },
    { id: 'lng', name: '液化天然气', calorificValue: 51.498, carbonContent: 0.01720, type: 'liquid', oxidationRate: 98 },
    { id: 'lpg', name: '液化石油气', calorificValue: 50.179, carbonContent: 0.01720, type: 'liquid', oxidationRate: 98 },
    { id: 'coalTar', name: '煤焦油', calorificValue: 33.453, carbonContent: 0.02200, type: 'liquid', oxidationRate: 98 },
    { id: 'refineryGas', name: '炼厂干气', calorificValue: 45.998, carbonContent: 0.01820, type: 'liquid', oxidationRate: 98 }
  ];

  // 气体燃料数据
  const GAS_FUELS = [
    { id: 'naturalGas', name: '天然气', calorificValue: 389.310, carbonContent: 0.01532, type: 'gas', oxidationRate: 99 },
    { id: 'bfGas', name: '高炉煤气', calorificValue: 33.000, carbonContent: 0.07080, type: 'gas', oxidationRate: 99 },
    { id: 'converterGas', name: '转炉煤气', calorificValue: 84.000, carbonContent: 0.04960, type: 'gas', oxidationRate: 99 },
    { id: 'cokeOvenGas', name: '焦炉煤气', calorificValue: 173.854, carbonContent: 0.01210, type: 'gas', oxidationRate: 99 }
  ];

  // 化工产品数据
  const CHEMICAL_PRODUCTS = [
    { "id": "acetonitrile", "name": "乙腈", "carbonContent": 0.5852 },
    { "id": "acrylonitrile", "name": "丙烯腈", "carbonContent": 0.6664 },
    { "id": "butadiene", "name": "丁二烯", "carbonContent": 0.888 },
    { "id": "carbon_black", "name": "炭黑", "carbonContent": 0.970 },
    { "id": "ethylene", "name": "乙烯", "carbonContent": 0.856 },
    { "id": "dichloroethane", "name": "二氯乙烷", "carbonContent": 0.245 },
    { "id": "ethylene_glycol", "name": "乙二醇", "carbonContent": 0.387 },
    { "id": "ethylene_oxide", "name": "环氧乙烷", "carbonContent": 0.545 },
    { "id": "hydrogen_cyanide", "name": "氰化氢", "carbonContent": 0.4444 },
    { "id": "methanol", "name": "甲醇", "carbonContent": 0.375 },
    { "id": "methane", "name": "甲烷", "carbonContent": 0.749 },
    { "id": "ethane", "name": "乙烷", "carbonContent": 0.856 },
    { "id": "propane", "name": "丙烷", "carbonContent": 0.817 },
    { "id": "propylene", "name": "丙烯", "carbonContent": 0.8563 },
    { "id": "vinyl_chloride_monomer", "name": "氯乙烯单体", "carbonContent": 0.384 },
    { "id": "urea", "name": "尿素", "carbonContent": 0.200 },
    { "id": "ammonium_bicarbonate", "name": "碳酸氢铵", "carbonContent": 0.1519 },
    { "id": "calcium_carbide", "name": "标准电石", "carbonContent": 0.314 }
  ];

  // 碳酸盐排放因子数据
  const CARBONATE_EMISSION_FACTORS = [
    { id: 'carbonate-product-1', name: '碳酸钙 (CaCO₃) - 俗称：石灰石', formula: 'CaCO₃', emissionFactor: 0.4397 },
    { id: 'carbonate-product-2', name: '碳酸镁 (MgCO₃) - 俗称：菱镁矿', formula: 'MgCO₃', emissionFactor: 0.5220 },
    { id: 'carbonate-product-3', name: '碳酸钠 (Na₂CO₃) - 俗称：纯碱、苏打', formula: 'Na₂CO₃', emissionFactor: 0.4149 },
    { id: 'carbonate-product-4', name: '碳酸氢钠 (NaHCO₃) - 俗称：小苏打', formula: 'NaHCO₃', emissionFactor: 0.5237 },
    { id: 'carbonate-product-5', name: '碳酸亚铁 (FeCO₃) - 俗称：菱铁矿', formula: 'FeCO₃', emissionFactor: 0.3799 },
    { id: 'carbonate-product-6', name: '碳酸锰 (MnCO₃) - 俗称：菱锰矿', formula: 'MnCO₃', emissionFactor: 0.3829 },
    { id: 'carbonate-product-7', name: '碳酸钡 (BaCO₃) - 俗称：碳酸钡矿', formula: 'BaCO₃', emissionFactor: 0.2230 },
    { id: 'carbonate-product-8', name: '碳酸锂 (Li₂CO₃) - 俗称：锂矿产品', formula: 'Li₂CO₃', emissionFactor: 0.5955 },
    { id: 'carbonate-product-9', name: '碳酸钾 (K₂CO₃) - 俗称：钾碱', formula: 'K₂CO₃', emissionFactor: 0.3184 },
    { id: 'carbonate-product-10', name: '碳酸锶 (SrCO₃) - 俗称：碳酸锶矿', formula: 'SrCO₃', emissionFactor: 0.2980 },
    { id: 'carbonate-product-11', name: '碳酸镁钙 (CaMg(CO₃)₂) - 俗称：白云石', formula: 'CaMg(CO₃)₂', emissionFactor: 0.4773 }
  ];

  // 露天煤矿和矿后活动的CH4逃逸排放因子数据
  const CH4_ESCAPE_EMISSION_FACTORS = [
    { id: 'ch4-escape-product-1', name: '露天煤矿', emissionFactor: 1.34 },
    { id: 'ch4-escape-product-2', name: '高瓦斯矿井(矿后活动)', emissionFactor: 2.01 },
    { id: 'ch4-escape-product-3', name: '低瓦斯矿井(矿后活动)', emissionFactor: 0.6 },
    { id: 'ch4-escape-product-4', name: '露天煤矿(矿后活动)', emissionFactor: 0.34 }
  ];

  // 硝酸生产技术类型的排放因子数据
  const NITRIC_ACID_PROCESS_EMISSION_FACTORS = [
    { id: 'process-1', name: '高压法', emissionFactor: 0.0139 },
    { id: 'process-2', name: '中压法', emissionFactor: 0.0118 },
    { id: 'process-3', name: '常压法', emissionFactor: 0.0097 },
    { id: 'process-4', name: '双加压法', emissionFactor: 0.0080 },
    { id: 'process-5', name: '综合法', emissionFactor: 0.0075 },
    { id: 'process-6', name: '低压法', emissionFactor: 0.0050 }
  ];

  // 渲染常量内容
  const renderConstantContent = () => {
    switch (selectedConstantCategory) {
      case '化石燃料常量':
        // 准备所有燃料数据的JSON格式
        const allFuelsData = {
          solidFuels: SOLID_FUELS,
          liquidFuels: LIQUID_FUELS,
          gasFuels: GAS_FUELS
        };
        
        // 格式化JSON字符串
        const formattedJson = JSON.stringify(allFuelsData, null, 2);
        
        // 复制JSON到剪贴板
        const copyToClipboard = () => {
          navigator.clipboard.writeText(formattedJson)
            .then(() => {
              alert('JSON数据已复制到剪贴板');
            })
            .catch(err => {
              console.error('复制失败:', err);
            });
        };
        
        return (
          <div>
            <Title level={5}>固体燃料</Title>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：各种工业生产企业</Text>
            </div>
            <List
              bordered
              dataSource={SOLID_FUELS}
              renderItem={fuel => (
                <List.Item>
                  <div>
                    <Text strong>{fuel.name}</Text>
                    <div>低位发热量: {fuel.calorificValue} MJ/kg</div>
                    <div>单位热值含碳量: {fuel.carbonContent} tC/GJ</div>
                    <div>碳氧化率: 98%</div>
                  </div>
                </List.Item>
              )}
            />
            
            <Title level={5} style={{ marginTop: '20px' }}>液体燃料</Title>
            <List
              bordered
              dataSource={LIQUID_FUELS}
              renderItem={fuel => (
                <List.Item>
                  <div>
                    <Text strong>{fuel.name}</Text>
                    <div>低位发热量: {fuel.calorificValue} MJ/kg</div>
                    <div>单位热值含碳量: {fuel.carbonContent} tC/GJ</div>
                    <div>碳氧化率: {fuel.oxidationRate}%</div>
                  </div>
                </List.Item>
              )}
            />
            
            <Title level={5} style={{ marginTop: '20px' }}>气体燃料</Title>
            <List
              bordered
              dataSource={GAS_FUELS}
              renderItem={fuel => (
                <List.Item>
                  <div>
                    <Text strong>{fuel.name}</Text>
                    <div>低位发热量: {fuel.calorificValue} MJ/m³</div>
                    <div>单位热值含碳量: {fuel.carbonContent} tC/GJ</div>
                    <div>碳氧化率: {fuel.oxidationRate}%</div>
                  </div>
                </List.Item>
              )}
            />
            
            <Title level={5} style={{ marginTop: '20px' }}>JSON格式数据</Title>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={copyToClipboard}>复制JSON</Button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {formattedJson}
              </pre>
            </Card>
          </div>
        );
      case '电力排放因子':
        return (
          <div>
            <Title level={5}>统一电力排放因子</Title>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：使用外购电力的企业</Text>
            </div>
            <Text>0.5366 tCO₂/MW·h</Text>
          </div>
        );

      case '热力排放因子':
        return (
          <div>
            <Title level={5}>默认热力排放因子</Title>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：使用外购热力的企业</Text>
            </div>
            <Text>{DEFAULT_HEAT_EMISSION_FACTOR} {EMISSION_UNIT.HEAT}</Text>
          </div>
        );
      case '温室气体GWP值':
        return (
          <div>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：所有需要计算温室气体排放的企业</Text>
            </div>
            <List
              bordered
              dataSource={Object.entries(GREENHOUSE_GAS_GWP)}
              renderItem={(entry) => {
                const [gas, gwp] = entry;
                return (
                  <List.Item>
                    <div>
                      <Text strong>{gas}</Text>
                      <div>全球变暖潜能值(GWP): {gwp}</div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        );
      case '常见化工产品':
        // 准备化工产品数据的JSON格式
        const chemicalProductsJson = JSON.stringify(CHEMICAL_PRODUCTS, null, 2);
        
        // 复制JSON到剪贴板
        const copyChemicalProductsJson = () => {
          navigator.clipboard.writeText(chemicalProductsJson)
            .then(() => {
              alert('化工产品数据已复制到剪贴板');
            })
            .catch(err => {
              console.error('复制失败:', err);
            });
        };
        
        return (
          <div>
            <Title level={5}>常见化工产品</Title>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：化工生产企业</Text>
            </div>
            <List
              bordered
              dataSource={CHEMICAL_PRODUCTS}
              renderItem={product => (
                <List.Item>
                  <div>
                    <Text strong>{product.name}</Text>
                    <div>含碳量: {product.carbonContent}</div>
                  </div>
                </List.Item>
              )}
            />
            
            <Title level={5} style={{ marginTop: '20px' }}>JSON格式数据</Title>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={copyChemicalProductsJson}>复制JSON</Button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {chemicalProductsJson}
              </pre>
            </Card>
          </div>
        );
      case '碳酸盐排放因子':
        // 准备碳酸盐排放因子数据的JSON格式
        const carbonateEmissionFactorsJson = JSON.stringify(CARBONATE_EMISSION_FACTORS, null, 2);
        
        // 复制JSON到剪贴板
        const copyCarbonateEmissionFactorsJson = () => {
          navigator.clipboard.writeText(carbonateEmissionFactorsJson)
            .then(() => {
              alert('碳酸盐排放因子数据已复制到剪贴板');
            })
            .catch(err => {
              console.error('复制失败:', err);
            });
        };
        
        return (
          <div>
            <Title level={5}>碳酸盐排放因子</Title>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：化工、冶金等使用碳酸盐的企业</Text>
            </div>
            <List
              bordered
              dataSource={CARBONATE_EMISSION_FACTORS}
              renderItem={carbonate => (
                <List.Item>
                  <div>
                    <Text strong>{carbonate.name}</Text>
                    <div>化学式: {carbonate.formula}</div>
                    <div>排放因子: {carbonate.emissionFactor}</div>
                  </div>
                </List.Item>
              )}
            />
            
            <Title level={5} style={{ marginTop: '20px' }}>JSON格式数据</Title>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={copyCarbonateEmissionFactorsJson}>复制JSON</Button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {carbonateEmissionFactorsJson}
              </pre>
            </Card>
          </div>
        );
      case '露天煤矿和矿后活动的CH4逃逸排放因子':
        // 准备CH4逃逸排放因子数据的JSON格式
        const ch4EscapeEmissionFactorsJson = JSON.stringify(CH4_ESCAPE_EMISSION_FACTORS, null, 2);
        
        // 复制JSON到剪贴板
        const copyCH4EscapeEmissionFactorsJson = () => {
          navigator.clipboard.writeText(ch4EscapeEmissionFactorsJson)
            .then(() => {
              alert('CH4逃逸排放因子数据已复制到剪贴板');
            })
            .catch(err => {
              console.error('复制失败:', err);
            });
        };
        
        return (
          <div>
            <Title level={5}>露天煤矿和矿后活动的CH4逃逸排放因子</Title>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：煤炭生产行业</Text>
            </div>
            <List
              bordered
              dataSource={CH4_ESCAPE_EMISSION_FACTORS}
              renderItem={ch4Escape => (
                <List.Item>
                  <div>
                    <Text strong>{ch4Escape.name}</Text>
                    <div>排放因子: {ch4Escape.emissionFactor} kg CH4/吨原煤</div>
                  </div>
                </List.Item>
              )}
            />
            
            <Title level={5} style={{ marginTop: '20px' }}>JSON格式数据</Title>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={copyCH4EscapeEmissionFactorsJson}>复制JSON</Button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {ch4EscapeEmissionFactorsJson}
              </pre>
            </Card>
          </div>
        );
      case '硝酸生产技术类型的排放因子':
        // 准备硝酸生产技术类型的排放因子数据的JSON格式
        const nitricAcidProcessEmissionFactorsJson = JSON.stringify(NITRIC_ACID_PROCESS_EMISSION_FACTORS, null, 2);
        
        // 复制JSON到剪贴板
        const copyNitricAcidProcessEmissionFactorsJson = () => {
          navigator.clipboard.writeText(nitricAcidProcessEmissionFactorsJson)
            .then(() => {
              alert('硝酸生产技术类型的排放因子数据已复制到剪贴板');
            })
            .catch(err => {
              console.error('复制失败:', err);
            });
        };
        
        return (
          <div>
            <Title level={5}>硝酸生产技术类型的排放因子</Title>
            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              <Text type="secondary">适用行业：化工生产企业</Text>
            </div>
            <List
              bordered
              dataSource={NITRIC_ACID_PROCESS_EMISSION_FACTORS}
              renderItem={process => (
                <List.Item>
                  <div>
                    <Text strong>{process.name}</Text>
                    <div>排放因子: {process.emissionFactor}</div>
                  </div>
                </List.Item>
              )}
            />
            
            <Title level={5} style={{ marginTop: '20px' }}>JSON格式数据</Title>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={copyNitricAcidProcessEmissionFactorsJson}>复制JSON</Button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {nitricAcidProcessEmissionFactorsJson}
              </pre>
            </Card>
          </div>
        );

      default:
        return <div>请选择常量类别</div>;
    }
  };

  return (
    <Row gutter={24}>
      <Col span={8}>
        <List
          bordered
          dataSource={constantCategories}
          renderItem={(category) => (
            <List.Item
              onClick={() => setSelectedConstantCategory(category)}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedConstantCategory === category ? '#f0f0f0' : 'transparent'
              }}
            >
              {category}
            </List.Item>
          )}
        />
      </Col>
      <Col span={16}>
        <div style={{ padding: '0 16px' }}>
          {renderConstantContent()}
        </div>
      </Col>
    </Row>
  );
};

export default ConstantConfig;