import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import "../styles/Statistics.css";

const BACKEND_URL = "https://backend-production-4394.up.railway.app"

export default function Statistics() {
  const [activeTab, setActiveTab] = useState("daily");
  const [timeRange, setTimeRange] = useState("30");
  const [driverSearchId, setDriverSearchId] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getRangeLabel = () => (timeRange === "365" ? "All Time" : `Last ${timeRange} Days`);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/analytics/detailed?days=${timeRange}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [timeRange]);

  const handleExport = (type) => {
  const endpointMap = {
    'daily': '/api/export/daily-report',
    'status': '/api/export/status-report',
    'drivers': '/api/export/drivers-report',
    'customers': '/api/export/customers-report',
    'analytics-report': '/api/export/master-report'
  };

  let url = `${BACKEND_URL}${endpointMap[type]}?days=${timeRange}`;
  
  // Strict assigned_driver_id search
  if (type === 'drivers' && driverSearchId) {
    url += `&driverId=${driverSearchId}`;
  }

  window.open(url);
};

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#e5e7eb", font: { family: 'Inter', weight: '600' } } } },
    scales: { y: { ticks: { color: "#9ca3af" }, grid: { color: "#374151" } }, x: { ticks: { color: "#9ca3af" }, grid: { display: false } } }
  };

  if (error) return (
    <div className="stats-error">
      <h2>⚠️ Connection Error</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const successRate = stats ? (stats.statusCounts.successful / (stats.statusCounts.successful + stats.statusCounts.unsuccessful || 1)) * 100 : 0;

  return (
    <div className="stats-page">
      <header className="stats-navbar">
        <div className="brand">
          <h1>📊 Tolo Analytics</h1>
          <p className={loading ? "skeleton-text" : ""}>{loading ? "" : `${getRangeLabel()}`}</p>
        </div>
        <div className="range-picker-container">
          <label>Range:</label>
          <div className="range-buttons">
            {[{ label: "7D", value: "7" }, { label: "30D", value: "30" }, { label: "90D", value: "90" }, { label: "ALL", value: "365" }].map((range) => (
              <button key={range.value} className={`range-btn ${timeRange === range.value ? "active" : ""}`} onClick={() => setTimeRange(range.value)}>{range.label}</button>
            ))}
          </div>
        </div>
        <div className="nav-actions">
          <button className="export-master-btn" onClick={() => handleExport('analytics-report')}>📄 {loading ? "..." : `Export Master Report`}</button>
          <button className="close-btn" onClick={() => navigate("/")}>✕</button>
        </div>
      </header>
      <div className="stats-grid-top">
        <div className={`stat-card revenue ${loading ? "skeleton" : ""}`}>
          {!loading && stats ? (
            <>
              <label>Total Revenue ({getRangeLabel()})</label>
              <h2>{stats.totalMoney.toLocaleString()} Br</h2>
              <div className="birr-breakdown">
                <span>100s: <b>{stats.birrCounts[100]}</b></span>
                <span>200s: <b>{stats.birrCounts[200]}</b></span>
                <span>300s: <b>{stats.birrCounts[300]}</b></span>
              </div>
            </>
          ) : <div className="skeleton-placeholder"></div>}
        </div>
        <div className={`stat-card performance ${loading ? "skeleton" : ""}`}>
          {!loading && stats ? (
            <>
              <label>Success Rate({timeRange}D)</label>
              <h2>{Math.round(successRate)}%</h2>
              <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${successRate}%` }}></div></div>
            </>
          ) : <div className="skeleton-placeholder"></div>}
        </div>
        <div className={`stat-card users ${loading ? "skeleton" : ""}`}>
          {!loading && stats ? (
            <>
              <label>Unique Customers</label>
              <h2>{stats.totalUsers}</h2>
              <p style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>Active in {getRangeLabel()}</p>
            </>
          ) : <div className="skeleton-placeholder"></div>}
        </div>
      </div>
      <nav className="stats-tabs">
        {["daily", "status", "drivers", "customers"].map(tab => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab.toUpperCase()}</button>
        ))}
      </nav>
      <main className="stats-content">
        {loading ? (
          <div className="viz-container skeleton" style={{ height: "400px" }}></div>
        ) : (
          <>
            {activeTab === "daily" && (
              <div className="viz-container">
                <div className="viz-header">
                  <h3>📆 Delivery Volume ({getRangeLabel()})</h3>
                  <button className="tab-export-btn" onClick={() => handleExport('daily')}>📥 Export Reports</button>
                </div>
                <div className="chart-wrapper">
                  <Bar data={{ labels: Object.keys(stats.dailyCounts), datasets: [{ label: "Orders", data: Object.values(stats.dailyCounts), backgroundColor: "#3b82f6", borderRadius: 4 }] }} options={chartOptions} />
                </div>
              </div>
            )}
            {activeTab === "status" && (
              <div className="viz-container-small">
                <div className="viz-header">
                  <h3>🚚 Order Status ({getRangeLabel()})</h3>
                  
                </div>
                <div className="chart-wrapper">
                  <Pie data={{ labels: ["Success", "Unsuccessful", "Pending"], datasets: [{ data: [stats.statusCounts.successful, stats.statusCounts.unsuccessful, stats.statusCounts.pending], backgroundColor: ["#10b981", "#ef4444", "#f1c40f"], borderWidth: 0 }] }} options={{ ...chartOptions, scales: {} }} />
                </div>
              </div>
            )}
            {activeTab === "drivers" && (
              <div className="viz-container">
                <div className="viz-header">
                  <h3>🧑‍✈️ Driver Performance ({getRangeLabel()})</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="tab-export-btn" onClick={() => handleExport('drivers')}>📥 Export Reports</button>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Bar data={{ labels: Object.keys(stats.driverPerformance), datasets: [{ label: "Successful Trips", data: Object.values(stats.driverPerformance), backgroundColor: "#8b5cf6", borderRadius: 4 }] }} options={chartOptions} />
                </div>
              </div>
            )}
            {activeTab === "customers" && (
              <div className="table-container">
                <div className="viz-header" style={{ padding: "1.5rem" }}>
                  <h3 style={{ margin: 0 }}>🏆 Top Customers ({getRangeLabel()})</h3>
                  <button className="tab-export-btn" onClick={() => handleExport('customers')}>📥 Export Reports</button>
                </div>
                <table className="modern-table">
                  <thead><tr><th>Phone Number</th><th>Primary Location</th><th>Sent</th><th>Received</th><th>Total</th></tr></thead>
                  <tbody>
                    {stats.customerStats.map((c, i) => (
                      <tr key={i}>
                        <td>{c.phone}</td><td>{c.location}</td><td>{c.sent}</td><td>{c.received}</td><td><span className="total-badge">{c.total}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
