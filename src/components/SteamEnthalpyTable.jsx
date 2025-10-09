import React, { useState } from 'react';
import { saturatedSteamTable, superheatedSteamTable } from '../config/steamConstants';

const SteamEnthalpyTable = () => {
  const [activeTab, setActiveTab] = useState('saturated');

  return (
    <div className="steam-enthalpy-table-container">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'saturated' ? 'active' : ''}`}
          onClick={() => setActiveTab('saturated')}
        >
          饱和蒸汽热焓表
        </button>
        <button
          className={`tab-button ${activeTab === 'superheated' ? 'active' : ''}`}
          onClick={() => setActiveTab('superheated')}
        >
          过热蒸汽热焓表
        </button>
      </div>

      <div className="table-content">
        {activeTab === 'saturated' && (
          <table className="enthalpy-table">
            <thead>
              <tr>
                <th>压力 (MPa)</th>
                <th>温度 (℃)</th>
                <th>焓值 (kJ/kg)</th>
              </tr>
            </thead>
            <tbody>
              {saturatedSteamTable.map((item, index) => (
                <tr key={index}>
                  <td>{item.pressure.toFixed(3)}</td>
                  <td>{item.temperature.toFixed(2)}</td>
                  <td>{item.enthalpy.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'superheated' && (
          <table className="enthalpy-table">
            <thead>
              <tr>
                <th>压力 (MPa)</th>
                <th>温度 (℃)</th>
                <th>焓值 (kJ/kg)</th>
              </tr>
            </thead>
            <tbody>
              {superheatedSteamTable.map((item, index) => (
                <tr key={index}>
                  <td>{item.pressure.toFixed(1)}</td>
                  <td>{item.temperature}</td>
                  <td>{item.enthalpy.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .steam-enthalpy-table-container {
          margin: 20px 0;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          overflow: hidden;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e8e8e8;
        }

        .tab-button {
          padding: 10px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .tab-button:hover {
          background-color: #f5f5f5;
        }

        .tab-button.active {
          color: #1890ff;
          border-bottom: 2px solid #1890ff;
        }

        .table-content {
          max-height: 400px;
          overflow-y: auto;
        }

        .enthalpy-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .enthalpy-table th,
        .enthalpy-table td {
          padding: 8px 12px;
          text-align: center;
          border-bottom: 1px solid #f0f0f0;
        }

        .enthalpy-table th {
          background-color: #fafafa;
          font-weight: 500;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .enthalpy-table tbody tr:hover {
          background-color: #f9f9f9;
        }
      `}</style>
    </div>
  );
};

export default SteamEnthalpyTable;