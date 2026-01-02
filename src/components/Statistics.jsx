import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import { differenceInDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import "chart.js/auto";
import "../styles/Statistics.css";

const BACKEND_URL = "https://backend-production-4394.up.railway.app";

export default function Statistics() {
  const [activeTab, setActiveTab] = useState("daily");
  const [timeRange, setTimeRange] = useState("30");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isCustom, setIsCustom] = useState(false);
  const [driverSearchId, setDriverSearchId] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getRangeLabel = () => {
    if (isCustom) return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    return timeRange === "365" ? "All Time" : `Last ${timeRange} Days`;
  };

  useEffect(() => {
    setLoading(true);
    let days = timeRange;
    if (isCustom && startDate && endDate) {
      days = Math.max(1, differenceInDays(endDate, startDate));
    }
    fetch(`${BACKEND_URL}/api/analytics/detailed?days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [timeRange, startDate, endDate, isCustom]);

  const handleExport = (type) => {
    const endpointMap = {
      'daily': '/api/export/daily-report',
      'status': '/api/export/status-report',
      'drivers': '/api/export/drivers-report',
      'customers': '/api/export/customers-report',
      'analytics-report': '/api/export/master-report'
    };
    let days = timeRange;
    if (isCustom) days = Math.max(1, differenceInDays(endDate, startDate));
    let url = `${BACKEND_URL}${endpointMap[type]}?days=${days}`;
    if (type === 'drivers' && driverSearchId) url += `&driverId=${driverSearchId}`;
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
          <p className={loading ? "skeleton-text" : ""}>{loading ? "" : getRangeLabel()}</p>
        </div>
        <div className="range-picker-wrapper">
          <div className="segmented-control">
            <div className="selection-indicator" style={{ width: '20%', transform: `translateX(${timeRange === "7" ? "0%" : timeRange === "30" ? "100%" : timeRange === "90" ? "200%" : timeRange === "365" ? "300%" : "400%"})` }} />
            {[{ l: "7D", v: "7" }, { l: "30D", v: "30" }, { l: "90D", v: "90" }, { l: "All", v: "365" }, { l: "Custom", v: "custom" }].map((r) => (
              <button key={r.v} className={`range-segment ${timeRange === r.v ? "active" : ""}`} onClick={() => { setTimeRange(r.v); setIsCustom(r.v === "custom"); }}>{r.l}</button>
            ))}
          </div>
          {isCustom && (
            <div className="custom-date-row">
              <div className="date-input-group">
                <DatePicker selected={startDate} onChange={(d) => setStartDate(d)} selectsStart startDate={startDate} endDate={endDate} className="dark-datepicker" placeholderText="Start Date" />
                <span style={{ color: "#9ca3af" }}>→</span>
                <DatePicker selected={endDate} onChange={(d) => setEndDate(d)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} className="dark-datepicker" placeholderText="End Date" />
              </div>
            </div>
          )}
        </div>
        <div className="nav-actions">
          <button className="export-master-btn" onClick={() => handleExport('analytics-report')}>📄 {loading ? "..." : `Export Master`}</button>
          <button className="close-btn" onClick={() => navigate("/")}>✕</button>
        </div>
      </header>
      <div className="stats-grid-top">
        <div className={`stat-card revenue ${loading ? "skeleton" : ""}`}>
          {!loading && stats ? (
            <>
              <label>Total Revenue</label>
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
              <label>Success Rate</label>
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
              <p style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>Active in range</p>
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
                  <h3>📆 Delivery Volume</h3>
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
                  <h3>🚚 Order Status</h3>
                </div>
                <div className="chart-wrapper">
                  <Pie data={{ labels: ["Success", "Unsuccessful", "Pending"], datasets: [{ data: [stats.statusCounts.successful, stats.statusCounts.unsuccessful, stats.statusCounts.pending], backgroundColor: ["#10b981", "#ef4444", "#f1c40f"], borderWidth: 0 }] }} options={{ ...chartOptions, scales: {} }} />
                </div>
              </div>
            )}
            {activeTab === "drivers" && (
              <div className="viz-container">
                <div className="viz-header">
                  <h3>🧑‍✈️ Driver Performance</h3>
                  <button className="tab-export-btn" onClick={() => handleExport('drivers')}>📥 Export Reports</button>
                </div>
                <div className="chart-wrapper">
                  <Bar data={{ labels: Object.keys(stats.driverPerformance), datasets: [{ label: "Successful Trips", data: Object.values(stats.driverPerformance), backgroundColor: "#8b5cf6", borderRadius: 4 }] }} options={chartOptions} />
                </div>
              </div>
            )}
            {activeTab === "customers" && (
              <div className="table-container">
                <div className="viz-header" style={{ padding: "1.5rem" }}>
                  <h3 style={{ margin: 0 }}>🏆 Top Customers</h3>
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
