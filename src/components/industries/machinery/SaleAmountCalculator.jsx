import React, { useState, useEffect, useMemo } from 'react';

// 月份常量
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 连接处类型
const CONNECTION_TYPES = [
  { key: 'pipe', name: '管道' },
  { key: 'valve', name: '阀门' },
  { key: 'other', name: '其他连接处' }
];

// 初始化12个月的数据
const createInitialMonthData = (gasInfo = null) => {
  // 计算默认排放因子：0.342 mol/次 * 气体的摩尔质量 (g/mol) / 1,000,000 = t/次
  const defaultEmissionFactor = gasInfo?.molecularWeight 
    ? (0.342 * gasInfo.molecularWeight / 1000000).toFixed(6) 
    : '';
  
  return MONTHS.map((month, index) => ({
    month: index + 1,
    monthName: month,
    value: '',
    fillCount: '', // 填充次数
    emissionFactor: defaultEmissionFactor // 默认排放因子
  }));
};

// 初始化连接处数据
const createInitialConnectionData = () => {
  return CONNECTION_TYPES.map(type => ({
    ...type,
    data: createInitialMonthData()
  }));
};

const SaleAmountCalculator = ({
  visible,
  onCancel,
  onConfirm,
  existingData, // 现有的计算数据
  gasInfo = null // 气体信息（产品名称、摩尔质量、GWP值）
}) => {
  const [measurementType, setMeasurementType] = useState(existingData?.measurementType || 'noMeter'); // 'noMeter' | 'withMeter'
  const [uploadedFiles, setUploadedFiles] = useState({}); // 存储上传的文件信息
  
  // 基础数据状态
  const [mbData, setMbData] = useState(existingData?.mbData || createInitialMonthData()); // 向设备填充前容器内温室气体的质量
  const [meData, setMeData] = useState(existingData?.meData || createInitialMonthData()); // 向设备填充后容器内温室气体的质量
  const [mmData, setMmData] = useState(existingData?.mmData || createInitialMonthData()); // 由气体流量计测得的温室气体的填充量
  
  // 连接处泄漏数据
  const [connectionData, setConnectionData] = useState(() => {
    if (existingData?.connectionData) {
      // 如果有现有数据，保持原有结构
      return existingData.connectionData;
    }
    // 否则返回空数组，addConnection时会正确初始化
    return [];
  });
  
  // 处理文件上传
  const handleFileUpload = (connectionKey, event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${connectionKey}_${Date.now()}_${i}`;
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert(`文件 ${file.name} 格式不支持，请上传 JPG/PNG/GIF/PDF/DOC/DOCX 格式的文件。`);
        continue;
      }
      
      // 验证文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 超过5MB限制，请上传小于5MB的文件。`);
        continue;
      }
      
      const fileInfo = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        connectionKey,
        uploadTime: new Date().toISOString()
      };
      
      setUploadedFiles(prev => ({
        ...prev,
        [fileId]: fileInfo
      }));
    }
    
    // 清空输入框，允许重复上传相同文件
    event.target.value = '';
  };
  
  // 删除上传的文件
  const removeUploadedFile = (fileId) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fileId];
      return newFiles;
    });
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 添加新连接处
  const addConnection = (type = 'other') => {
    const typeMap = {
      pipe: '管道',
      valve: '阀门',
      other: '其他连接处'
    };
    
    const newConnection = {
      key: `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: typeMap[type] || '自定义连接处',
      type: type,
      data: createInitialMonthData(gasInfo)
    };
    
    setConnectionData(prev => [...prev, newConnection]);
  };
  
  // 删除连接处
  const removeConnection = (connectionKey) => {
    setConnectionData(prev => prev.filter(conn => conn.key !== connectionKey));
  };
  
  // 格式化数值
  const formatValue = (value, decimalPlaces = 2) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toFixed(decimalPlaces);
  };
  
  // 更新月度数据
  const updateMonthData = (dataArray, setDataArray, monthIndex, field, value) => {
    const newData = [...dataArray];
    newData[monthIndex] = {
      ...newData[monthIndex],
      [field]: value
    };
    setDataArray(newData);
  };
  
  // 更新连接处数据
  const updateConnectionData = (connectionKey, monthIndex, field, value) => {
    const newData = connectionData.map(conn => {
      if (conn.key === connectionKey) {
        const newConnData = [...conn.data];
        newConnData[monthIndex] = {
          ...newConnData[monthIndex],
          [field]: value
        };
        return { ...conn, data: newConnData };
      }
      return conn;
    });
    setConnectionData(newData);
  };
  
  // 计算各月的销售/异地使用量
  const calculatedResults = useMemo(() => {
    const results = [];
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      let baseValue = 0;
      
      if (measurementType === 'noMeter') {
        // 无计量表模式: DIi = MBi - MEi - ELi
        const mb = parseFloat(mbData[monthIndex]?.value) || 0;
        const me = parseFloat(meData[monthIndex]?.value) || 0;
        baseValue = mb - me;
      } else {
        // 有计量表模式: DIi = MMi - ELi
        const mm = parseFloat(mmData[monthIndex]?.value) || 0;
        baseValue = mm;
      }
      
      // 计算连接处泄漏总和
      let totalLeakage = 0;
      connectionData.forEach(connection => {
        const fillCount = parseFloat(connection.data[monthIndex]?.fillCount) || 0;
        const emissionFactor = parseFloat(connection.data[monthIndex]?.emissionFactor) || 0;
        totalLeakage += fillCount * emissionFactor;
      });
      
      // 最终结果
      const finalResult = baseValue - totalLeakage;
      
      results.push({
        month: monthIndex + 1,
        monthName: MONTHS[monthIndex],
        baseValue,
        totalLeakage,
        finalResult: finalResult > 0 ? finalResult : 0 // 确保结果不为负数
      });
    }
    
    return results;
  }, [measurementType, mbData, meData, mmData, connectionData]);
  
  // 渲染合并的基础数据输入表格 - 纵向格式
  const renderCombinedBasicDataTable = () => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ margin: '16px 0 8px 0', color: '#1976d2' }}>基础数据输入</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f4fd' }}>
              <th style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', minWidth: '120px', backgroundColor: '#f5f5f5' }}>指标</th>
              {MONTHS.map((month, monthIndex) => (
                <th key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', minWidth: '80px' }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* MB质量行 */}
            <tr>
              <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>
                向设备填充前容器内温室气体的质量 (MB)
                <br />
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>质量 (t)</span>
              </td>
              {MONTHS.map((month, monthIndex) => (
                <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={mbData[monthIndex]?.value || ''}
                    onChange={(e) => updateMonthData(mbData, setMbData, monthIndex, 'value', e.target.value)}
                    style={{
                      width: '80px',
                      textAlign: 'center',
                      border: '1px solid #d9d9d9',
                      padding: '6px',
                      fontSize: '13px'
                    }}
                    placeholder="0.00"
                  />
                </td>
              ))}
            </tr>
            
            {/* ME质量行 */}
            <tr>
              <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f3e5f5' }}>
                向设备填充后容器内温室气体的质量 (ME)
                <br />
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>质量 (t)</span>
              </td>
              {MONTHS.map((month, monthIndex) => (
                <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={meData[monthIndex]?.value || ''}
                    onChange={(e) => updateMonthData(meData, setMeData, monthIndex, 'value', e.target.value)}
                    style={{
                      width: '80px',
                      textAlign: 'center',
                      border: '1px solid #d9d9d9',
                      padding: '6px',
                      fontSize: '13px'
                    }}
                    placeholder="0.00"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // 渲染月度输入表格 - 纵向格式
  const renderMonthTable = (title, dataArray, setDataArray, fields) => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ margin: '16px 0 8px 0', color: '#1976d2' }}>{title}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f4fd' }}>
              <th style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', minWidth: '120px', backgroundColor: '#f5f5f5' }}>指标</th>
              {MONTHS.map((month, monthIndex) => (
                <th key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', minWidth: '80px' }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map(field => (
              <tr key={field.key}>
                <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  {field.name}
                </td>
                {MONTHS.map((month, monthIndex) => (
                  <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={dataArray[monthIndex]?.[field.key] || ''}
                      onChange={(e) => updateMonthData(dataArray, setDataArray, monthIndex, field.key, e.target.value)}
                      style={{
                        width: '80px',
                        textAlign: 'center',
                        border: '1px solid #d9d9d9',
                        padding: '6px',
                        fontSize: '13px'
                      }}
                      placeholder={field.placeholder}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // 渲染连接处泄漏表格 - 按月份纵向填写（行列翻转）
  const renderConnectionTable = () => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: '0', color: '#1976d2' }}>连接处泄漏计算</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => addConnection('pipe')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + 管道
          </button>
          <button
            onClick={() => addConnection('valve')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + 阀门
          </button>
          <button
            onClick={() => addConnection('other')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#722ed1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + 其他连接处
          </button>
        </div>
      </div>
      
      {connectionData.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px',
          color: '#999',
          fontStyle: 'italic'
        }}>
          暂无连接处，请点击上方按钮添加连接处类型
        </div>
      ) : (
        connectionData.map(connection => (
          <div key={connection.key} style={{ 
            marginBottom: '20px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {/* 连接处名称标题栏 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: '#f5f5f5', 
              padding: '12px 16px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <input
                type="text"
                value={connection.name}
                onChange={(e) => {
                  const newData = connectionData.map(conn => 
                    conn.key === connection.key 
                      ? { ...conn, name: e.target.value }
                      : conn
                  );
                  setConnectionData(newData);
                }}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#424242',
                  flex: 1,
                  marginRight: '12px'
                }}
                placeholder="连接处名称"
              />
              <button
                onClick={() => removeConnection(connection.key)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                删除
              </button>
            </div>
            
            {/* 文件上传区域 */}
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: '#fffbe6', 
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#b8860b' }}>
                  自定义排放因子证明资料
                </span>
                <br />
                <span style={{ fontSize: '11px', color: '#666' }}>
                  上传支持该连接处排放因子设定的技术文档
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  multiple
                  onChange={(e) => handleFileUpload(connection.key, e)}
                  style={{
                    fontSize: '12px',
                    padding: '6px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9',
                    cursor: 'pointer'
                  }}
                  title="上传排放因子证明资料"
                />
              </div>
            </div>
            
            {/* 已上传文件显示 */}
            {Object.values(uploadedFiles).filter(fileInfo => 
              fileInfo.connectionKey === connection.key
            ).length > 0 && (
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: '#f6ffed', 
                borderBottom: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
                  已上传文件:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.values(uploadedFiles).filter(fileInfo => 
                    fileInfo.connectionKey === connection.key
                  ).map(fileInfo => (
                    <div key={fileInfo.fileId} 
                         style={{ 
                           display: 'flex', 
                           alignItems: 'center', 
                           gap: '6px',
                           fontSize: '12px',
                           color: '#52c41a',
                           backgroundColor: '#f6ffed',
                           padding: '6px 8px',
                           borderRadius: '4px',
                           border: '1px solid #b7eb8f'
                         }}>
                      <span>{fileInfo.fileName}</span>
                      <button
                        onClick={() => removeUploadedFile(fileInfo.fileId)}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          lineHeight: '1'
                        }}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 数据表格 */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '900px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e8f4fd' }}>
                    <th style={{ border: '1px solid #d9d9d9', padding: '10px', textAlign: 'center', minWidth: '100px', backgroundColor: '#f5f5f5' }}>指标</th>
                    {MONTHS.map((month, monthIndex) => (
                      <th key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '10px', textAlign: 'center', minWidth: '80px' }}>
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 填充次数行 */}
                  <tr>
                    <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                      填充次数 (次)
                    </td>
                    {MONTHS.map((month, monthIndex) => (
                      <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={connection.data[monthIndex]?.fillCount || ''}
                          onChange={(e) => updateConnectionData(connection.key, monthIndex, 'fillCount', e.target.value)}
                          style={{
                            width: '70px',
                            textAlign: 'center',
                            border: '1px solid #d9d9d9',
                            padding: '6px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                  
                  {/* 排放因子行 */}
                  <tr>
                    <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                      填充气体造成泄漏的排放因子 (t/次)
                      <br />
                      <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                        超出默认排放因子需要上传证明资料
                      </span>
                    </td>
                    {MONTHS.map((month, monthIndex) => (
                      <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={connection.data[monthIndex]?.emissionFactor || ''}
                          onChange={(e) => updateConnectionData(connection.key, monthIndex, 'emissionFactor', e.target.value)}
                          style={{
                            width: '70px',
                            textAlign: 'center',
                            border: '1px solid #d9d9d9',
                            padding: '6px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                  
                  {/* 泄漏量行（计算结果） */}
                  <tr>
                    <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa', color: '#e74c3c' }}>
                      泄漏量 (t)
                    </td>
                    {MONTHS.map((month, monthIndex) => {
                      const fillCount = parseFloat(connection.data[monthIndex]?.fillCount) || 0;
                      const emissionFactor = parseFloat(connection.data[monthIndex]?.emissionFactor) || 0;
                      const leakage = fillCount * emissionFactor;
                      
                      return (
                        <td key={monthIndex} style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#e74c3c', backgroundColor: '#fff7f0' }}>
                          {formatValue(leakage, 3)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
  
  // 渲染计算结果表格
  const renderResultsTable = () => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ margin: '16px 0 8px 0', color: '#27ae60' }}>计算结果</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '800px', backgroundColor: '#f8f9fa' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8f5e8' }}>
              <th style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', minWidth: '120px' }}>
                指标
              </th>
              {MONTHS.map((month, index) => (
                <th key={index} style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', minWidth: '100px' }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 月份行 */}
            <tr>
              <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                月份
              </td>
              {MONTHS.map((month, index) => {
                const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
                return (
                  <td key={index} style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f8ff', color: '#1976d2' }}>
                    {monthNames[index]}
                  </td>
                );
              })}
            </tr>
            
            {/* 基础值行 */}
            <tr>
              <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                基础值 (t)<br/>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {measurementType === 'noMeter' ? 'MB-ME' : 'MM'}
                </span>
              </td>
              {calculatedResults.map(result => (
                <td key={result.month} style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', backgroundColor: '#fff' }}>
                  {formatValue(result.baseValue, 2)}
                </td>
              ))}
            </tr>
            
            {/* 泄漏总量行 */}
            <tr>
              <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa', color: '#e74c3c' }}>
                泄漏总量 (t)
              </td>
              {calculatedResults.map(result => (
                <td key={result.month} style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', backgroundColor: '#fff7f0', color: '#e74c3c', fontWeight: 'bold' }}>
                  {formatValue(result.totalLeakage, 3)}
                </td>
              ))}
            </tr>
            
            {/* 最终结果行 */}
            <tr>
              <td style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa', color: '#27ae60' }}>
                最终结果 (t)
              </td>
              {calculatedResults.map(result => (
                <td key={result.month} style={{ border: '1px solid #d9d9d9', padding: '12px', textAlign: 'center', backgroundColor: '#f0fff0', color: '#27ae60', fontWeight: 'bold' }}>
                  {formatValue(result.finalResult, 2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // 处理确认
  const handleConfirm = () => {
    const resultData = {
      measurementType,
      mbData,
      meData,
      mmData,
      connectionData,
      results: calculatedResults
    };
    onConfirm(resultData);
  };
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>温室气体向外销售/异地使用量计算</h3>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
        
        {/* 气体信息显示 */}
        {gasInfo && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            backgroundColor: '#e8f5e8', 
            border: '1px solid #c3e6c3', 
            borderRadius: '6px' 
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#27ae60' }}>气体信息</h4>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <strong>气体名称：</strong>
                <span style={{ color: '#2c3e50' }}>{gasInfo.name}</span>
              </div>
              <div>
                <strong>摩尔质量：</strong>
                <span style={{ color: '#2c3e50' }}>{gasInfo.molecularWeight} g/mol</span>
              </div>
              <div>
                <strong>GWP值：</strong>
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{gasInfo.gwp}</span>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              <strong>默认排放因子计算：</strong> 0.342 mol/次 × {gasInfo.molecularWeight} g/mol ÷ 1,000,000 = {(0.342 * gasInfo.molecularWeight / 1000000).toFixed(6)} t/次
              <br/>
              <strong style={{ color: '#e74c3c' }}>超出默认排放因子需要上传证明资料</strong>
            </div>
          </div>
        )}
        
        {/* 计量表类型选择 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>计量方式</h4>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="noMeter"
                checked={measurementType === 'noMeter'}
                onChange={(e) => setMeasurementType(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              无计量表
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                value="withMeter"
                checked={measurementType === 'withMeter'}
                onChange={(e) => setMeasurementType(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              有计量表
            </label>
          </div>
        </div>
        
        {/* 基础数据输入 */}
        {measurementType === 'noMeter' ? (
          renderCombinedBasicDataTable()
        ) : (
          renderMonthTable('由气体流量计测得的温室气体的填充量 (MM)', mmData, setMmData, [
            { key: 'value', name: '填充量 (t)', placeholder: '0.00' }
          ])
        )}
        
        {/* 连接处泄漏计算 */}
        {renderConnectionTable()}
        
        {/* 计算结果 */}
        {renderResultsTable()}
        
        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            确认并回填
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleAmountCalculator;