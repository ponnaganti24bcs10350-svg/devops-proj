import React, { useState, useEffect } from 'react';

const API_BASE = ''; // relative path works with Vite dev proxy and Nginx ingress

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    service_name: 'api-gateway',
    severity: 'MEDIUM',
    status: 'INVESTIGATING',
    description: '',
    assigned_to: 'devops-oncall'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Health check
      const healthRes = await fetch(`${API_BASE}/health`).catch(() => null);
      if (healthRes && healthRes.ok) {
        const hData = await healthRes.json();
        setHealth(hData);
      } else {
        setHealth({ status: 'degraded', database: 'unreachable' });
      }

      // Incidents list
      const incRes = await fetch(`${API_BASE}/api/v1/incidents`);
      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }

      // Services list
      const srvRes = await fetch(`${API_BASE}/api/v1/services`);
      if (srvRes.ok) {
        const sData = await srvRes.json();
        setServices(sData);
      }

      // Stats
      const statRes = await fetch(`${API_BASE}/api/v1/stats`);
      if (statRes.ok) {
        const stData = await statRes.json();
        setStats(stData);
      }
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to sync with CloudPulse API. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          service_name: 'api-gateway',
          severity: 'MEDIUM',
          status: 'INVESTIGATING',
          description: '',
          assigned_to: 'devops-oncall'
        });
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${JSON.stringify(err.detail)}`);
      }
    } catch (err) {
      alert(`Request failed: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete incident #${id}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/incidents/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch = inc.title.toLowerCase().includes(search.toLowerCase()) ||
                          inc.service_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? inc.status === statusFilter : true;
    const matchesSeverity = severityFilter ? inc.severity === severityFilter : true;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const isSystemHealthy = health.status === 'healthy';

  return (
    <div>
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="logo-group">
            <div className="logo-badge">⚡</div>
            <div className="logo-title">
              <h1>CloudPulse Ops</h1>
              <p>SRE Reliability & Incident Automation Platform</p>
            </div>
          </div>
          <div className="header-actions">
            <a href="/metrics" target="_blank" rel="noreferrer" className="btn btn-secondary" id="btn-metrics">
              📊 Prometheus Metrics
            </a>
            <a href="/docs" target="_blank" rel="noreferrer" className="btn btn-secondary" id="btn-swagger">
              📖 API Docs
            </a>
            <button
              className="btn btn-primary"
              id="btn-report-incident"
              onClick={() => setIsModalOpen(true)}
            >
              + Report Incident
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* System Health Banner */}
        <div className={`system-banner ${isSystemHealthy ? 'banner-operational' : 'banner-degraded'}`}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              className="status-indicator pulse"
              style={{ backgroundColor: isSystemHealthy ? '#10b981' : '#f59e0b' }}
            ></span>
            <strong>
              {isSystemHealthy
                ? 'All Cloud Infrastructure Systems Operational'
                : 'Degraded Performance Detected — SRE On-call Alerted'}
            </strong>
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, fontFamily: 'monospace' }}>
            Backend: {health.status} | DB: {health.database} | Node: production-eks-us-east-1
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="glass-panel kpi-card kpi-total">
            <div className="kpi-title">
              <span>Total Incidents</span>
              <span>📋</span>
            </div>
            <div className="kpi-value" id="kpi-total-val">{stats ? stats.total_incidents : incidents.length}</div>
            <div className="kpi-subtext">Cumulative tracked events</div>
          </div>

          <div className="glass-panel kpi-card kpi-critical">
            <div className="kpi-title">
              <span>Active Outages</span>
              <span>🚨</span>
            </div>
            <div className="kpi-value" id="kpi-critical-val" style={{ color: '#f87171' }}>
              {stats ? stats.critical_count + stats.high_count : 0}
            </div>
            <div className="kpi-subtext">Critical & High priority incidents</div>
          </div>

          <div className="glass-panel kpi-card kpi-active">
            <div className="kpi-title">
              <span>Investigating</span>
              <span>🔍</span>
            </div>
            <div className="kpi-value" id="kpi-active-val" style={{ color: '#fbbf24' }}>
              {stats ? stats.active_incidents : 0}
            </div>
            <div className="kpi-subtext">Under active root cause analysis</div>
          </div>

          <div className="glass-panel kpi-card kpi-resolved">
            <div className="kpi-title">
              <span>Resolved Events</span>
              <span>✅</span>
            </div>
            <div className="kpi-value" id="kpi-resolved-val" style={{ color: '#34d399' }}>
              {stats ? stats.resolved_incidents : 0}
            </div>
            <div className="kpi-subtext">Post-mortem & mitigated</div>
          </div>
        </div>

        {/* Monitored Microservices Catalog */}
        <section className="services-section">
          <h2>🌐 Monitored Core Services ({services.length})</h2>
          <div className="services-grid">
            {services.map((srv) => (
              <div key={srv.id || srv.name} className="glass-panel service-card">
                <div className="service-header">
                  <span className="service-name">{srv.name}</span>
                  <span className="badge badge-resolved">{srv.status}</span>
                </div>
                <div className="service-meta">
                  <span>Uptime: {srv.uptime_pct}%</span>
                  <span>Latency: {srv.latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Incidents Management Section */}
        <section className="incidents-section">
          <h2>🚨 Active Incident Feed & Triage</h2>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-filter-group">
              <input
                type="text"
                className="input-field"
                id="search-input"
                placeholder="Search incidents or services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minWidth: '220px' }}
              />
              <select
                className="select-field"
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="IDENTIFIED">Identified</option>
                <option value="MONITORING">Monitoring</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <select
                className="select-field"
                id="severity-filter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <button className="btn btn-secondary" onClick={fetchData} id="btn-refresh">
              🔄 Refresh
            </button>
          </div>

          {/* Incidents List */}
          <div className="incidents-list">
            {filteredIncidents.length === 0 ? (
              <div className="glass-panel empty-state">
                <p>✨ No incidents matching current filters. All systems green!</p>
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div key={inc.id} className="glass-panel incident-card" id={`incident-${inc.id}`}>
                  <div className="incident-info">
                    <div className="incident-top">
                      <span className={`badge badge-${inc.severity.toLowerCase()}`}>
                        {inc.severity}
                      </span>
                      <span className={`badge badge-${inc.status.toLowerCase()}`}>
                        {inc.status}
                      </span>
                      <span className="incident-title">{inc.title}</span>
                    </div>
                    {inc.description && <p className="incident-desc">{inc.description}</p>}
                    <div className="incident-meta">
                      <span>Service: <strong>{inc.service_name}</strong></span>
                      <span>Assignee: {inc.assigned_to}</span>
                      <span>Created: {new Date(inc.created_at).toLocaleString()}</span>
                      {inc.resolved_at && (
                        <span style={{ color: '#34d399' }}>
                          Resolved: {new Date(inc.resolved_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="incident-actions">
                    {inc.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-success-sm"
                        id={`btn-resolve-${inc.id}`}
                        onClick={() => handleStatusUpdate(inc.id, 'RESOLVED')}
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                    {inc.status === 'RESOLVED' && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => handleStatusUpdate(inc.id, 'INVESTIGATING')}
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      className="btn btn-danger-outline"
                      id={`btn-delete-${inc.id}`}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      onClick={() => handleDelete(inc.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Report Incident Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚨 Report New Production Incident</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateIncident}>
              <div className="form-group">
                <label htmlFor="inc-title">Incident Title *</label>
                <input
                  id="inc-title"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Latency degradation in Redis cluster"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="inc-service">Impacted Service *</label>
                <select
                  id="inc-service"
                  className="select-field"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                >
                  <option value="api-gateway">api-gateway</option>
                  <option value="auth-service">auth-service</option>
                  <option value="billing-pipeline">billing-pipeline</option>
                  <option value="postgres-cluster">postgres-cluster</option>
                  <option value="k8s-ingress-controller">k8s-ingress-controller</option>
                  <option value="worker-queue">worker-queue</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="inc-severity">Severity Level</label>
                  <select
                    id="inc-severity"
                    className="select-field"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inc-status">Initial Status</label>
                  <select
                    id="inc-status"
                    className="select-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="IDENTIFIED">Identified</option>
                    <option value="MONITORING">Monitoring</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inc-assignee">Assigned Engineer / Squad</label>
                <input
                  id="inc-assignee"
                  type="text"
                  className="input-field"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="inc-desc">Description / Triage Notes</label>
                <textarea
                  id="inc-desc"
                  className="input-field"
                  rows="3"
                  placeholder="Provide context, error traces, runbook links, or impact scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="btn-submit-incident">
                  Publish Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer>
        CloudPulse DevOps Platform | Production Capstone Project | Built with FastAPI, React, Docker, Kubernetes & Helm
      </footer>
    </div>
  );
}
