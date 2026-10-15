import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  User,
  X,
  Radio,
  FileText
} from 'lucide-react';

const API_BASE = ''; // relative path connects through Vite dev proxy & Nginx reverse proxy

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
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
    assigned_to: 'sre-oncall'
  });

  const fetchData = async () => {
    try {
      setRefreshing(true);
      // 1. Health Probe
      const healthRes = await fetch(`${API_BASE}/health`).catch(() => null);
      if (healthRes && healthRes.ok) {
        const hData = await healthRes.json();
        setHealth(hData);
      } else {
        setHealth({ status: 'degraded', database: 'unreachable' });
      }

      // 2. Incident List
      const incRes = await fetch(`${API_BASE}/api/v1/incidents`);
      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }

      // 3. Monitored Services
      const srvRes = await fetch(`${API_BASE}/api/v1/services`);
      if (srvRes.ok) {
        const sData = await srvRes.json();
        setServices(sData);
      }

      // 4. Incident Stats
      const statRes = await fetch(`${API_BASE}/api/v1/stats`);
      if (statRes.ok) {
        const stData = await statRes.json();
        setStats(stData);
      }
    } catch (err) {
      console.error('API Sync Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
          assigned_to: 'sre-oncall'
        });
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Validation Error: ${JSON.stringify(err.detail)}`);
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
      console.error('Status update failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Confirm archiving incident #${id}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/incidents/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Delete operation failed:', err);
    }
  };

  // Filtered dataset
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.service_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? inc.status === statusFilter : true;
    const matchesSeverity = severityFilter ? inc.severity === severityFilter : true;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const isSystemHealthy = health.status === 'healthy';

  return (
    <div>
      {/* Sleek Top Navigation Bar */}
      <header>
        <div className="header-container">
          <div className="logo-group">
            <div className="logo-icon-wrapper">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div className="logo-title">
              <h1>
                CloudPulse <span className="ops-tag">SRE</span>
              </h1>
              <p>Site Reliability & Incident Lifecycle Management</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="cluster-pill">
              <Radio size={13} color="#10b981" />
              <span>eks-cluster-us-east-1</span>
            </div>

            <a
              href="/metrics"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              id="btn-metrics"
              title="Prometheus Raw Metrics"
            >
              <Activity size={14} />
              <span>Metrics</span>
              <ExternalLink size={12} color="#94a3b8" />
            </a>

            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              id="btn-swagger"
              title="OpenAPI Documentation"
            >
              <FileText size={14} />
              <span>API Docs</span>
              <ExternalLink size={12} color="#94a3b8" />
            </a>

            <button
              className="btn btn-primary"
              id="btn-report-incident"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Report Incident</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Real-time Infrastructure Status Bar */}
        <div
          className={`system-banner ${
            isSystemHealthy ? 'banner-operational' : 'banner-degraded'
          }`}
        >
          <div className="banner-left">
            <span
              className="status-dot live-pulse"
              style={{
                backgroundColor: isSystemHealthy ? '#10b981' : '#f59e0b',
                boxShadow: isSystemHealthy
                  ? '0 0 8px #10b981'
                  : '0 0 8px #f59e0b'
              }}
            ></span>
            <span>
              {isSystemHealthy
                ? 'All Cloud Infrastructure Systems Operational'
                : 'Degraded Performance Detected — SRE Escalation Active'}
            </span>
          </div>

          <div className="banner-chips">
            <span className="banner-chip">API: {health.status}</span>
            <span className="banner-chip">DB: {health.database}</span>
            <span className="banner-chip">VPC: multi-az</span>
            <span className="banner-chip">Telemetry: active</span>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Total Incidents</span>
              <div className="kpi-icon-container">
                <FileText size={16} color="#94a3b8" />
              </div>
            </div>
            <div className="kpi-value" id="kpi-total-val">
              {stats ? stats.total_incidents : incidents.length}
            </div>
            <div className="kpi-subtext">Cumulative recorded production events</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label" style={{ color: '#f87171' }}>Active Outages</span>
              <div className="kpi-icon-container" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <ShieldAlert size={16} color="#f87171" />
              </div>
            </div>
            <div className="kpi-value" id="kpi-critical-val" style={{ color: '#f87171' }}>
              {stats ? stats.critical_count + stats.high_count : 0}
            </div>
            <div className="kpi-subtext">Critical & High severity issues</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label" style={{ color: '#fbbf24' }}>Under Triage</span>
              <div className="kpi-icon-container" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <Search size={16} color="#fbbf24" />
              </div>
            </div>
            <div className="kpi-value" id="kpi-active-val" style={{ color: '#fbbf24' }}>
              {stats ? stats.active_incidents : 0}
            </div>
            <div className="kpi-subtext">Under active root cause investigation</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label" style={{ color: '#34d399' }}>Resolved</span>
              <div className="kpi-icon-container" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle2 size={16} color="#34d399" />
              </div>
            </div>
            <div className="kpi-value" id="kpi-resolved-val" style={{ color: '#34d399' }}>
              {stats ? stats.resolved_incidents : 0}
            </div>
            <div className="kpi-subtext">Mitigated and post-mortem completed</div>
          </div>
        </div>

        {/* Monitored Microservices Catalog */}
        <section>
          <div className="section-header">
            <h2 className="section-title">
              <Server size={17} color="#3b82f6" />
              <span>Monitored Core Infrastructure</span>
            </h2>
            <span className="section-count">{services.length} services online</span>
          </div>

          <div className="services-grid">
            {services.map((srv) => (
              <div key={srv.id || srv.name} className="service-card">
                <div className="service-card-top">
                  <span className="service-name">{srv.name}</span>
                  <span className="badge badge-operational">
                    <span className="status-dot" style={{ backgroundColor: '#10b981' }}></span>
                    {srv.status}
                  </span>
                </div>
                <div className="service-metrics-row">
                  <span>Uptime: {srv.uptime_pct}%</span>
                  <span>Latency: {srv.latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Incident Feed & Triage */}
        <section>
          <div className="section-header">
            <h2 className="section-title">
              <AlertTriangle size={17} color="#f59e0b" />
              <span>Incident Response & Triage Feed</span>
            </h2>
            <span className="section-count">{filteredIncidents.length} displayed</span>
          </div>

          {/* Action Toolbar */}
          <div className="toolbar">
            <div className="toolbar-search-wrap">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="input-search"
                id="search-input"
                placeholder="Search incident title, service name, or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              <select
                className="select-filter"
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
                className="select-filter"
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

              <button
                className="btn btn-secondary"
                id="btn-refresh"
                onClick={fetchData}
                title="Refresh Feed"
              >
                <RefreshCw size={13} className={refreshing ? 'live-pulse' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Incidents Row List */}
          <div className="incidents-feed">
            {filteredIncidents.length === 0 ? (
              <div className="empty-feed">
                <CheckCircle2 size={32} color="#10b981" />
                <p>No active incidents matching current filters.</p>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  All systems operating within acceptable SLO parameters.
                </span>
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="incident-row"
                  id={`incident-${inc.id}`}
                >
                  <div className="incident-main">
                    <div className="incident-headline">
                      <span className={`badge badge-${inc.severity.toLowerCase()}`}>
                        {inc.severity}
                      </span>
                      <span className={`badge badge-${inc.status.toLowerCase()}`}>
                        {inc.status}
                      </span>
                      <span className="incident-title">{inc.title}</span>
                    </div>

                    {inc.description && (
                      <p className="incident-desc">{inc.description}</p>
                    )}

                    <div className="incident-meta">
                      <div className="meta-item">
                        <Server size={12} />
                        <span className="meta-service-tag">{inc.service_name}</span>
                      </div>

                      <div className="meta-item">
                        <User size={12} />
                        <span>{inc.assigned_to}</span>
                      </div>

                      <div className="meta-item">
                        <Clock size={12} />
                        <span>
                          {new Date(inc.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {inc.resolved_at && (
                        <div className="meta-item" style={{ color: '#34d399' }}>
                          <CheckCircle2 size={12} />
                          <span>
                            Resolved in{' '}
                            {Math.max(
                              1,
                              Math.round(
                                (new Date(inc.resolved_at) -
                                  new Date(inc.created_at)) /
                                  60000
                              )
                            )}{' '}
                            min
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="incident-actions">
                    {inc.status !== 'RESOLVED' ? (
                      <button
                        className="btn btn-action-resolve"
                        id={`btn-resolve-${inc.id}`}
                        onClick={() => handleStatusUpdate(inc.id, 'RESOLVED')}
                      >
                        <CheckCircle2 size={13} />
                        <span>Resolve</span>
                      </button>
                    ) : (
                      <button
                        className="btn btn-action-reopen"
                        onClick={() => handleStatusUpdate(inc.id, 'INVESTIGATING')}
                      >
                        Reopen
                      </button>
                    )}

                    <button
                      className="btn btn-ghost-danger"
                      id={`btn-delete-${inc.id}`}
                      onClick={() => handleDelete(inc.id)}
                      title="Archive Incident"
                    >
                      <Trash2 size={13} />
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <AlertTriangle size={18} color="#f59e0b" />
                <span>Declare Production Incident</span>
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIncident}>
              <div className="form-group">
                <label htmlFor="inc-title">Incident Title *</label>
                <input
                  id="inc-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ingress Gateway TLS Certificate Handshake Timeout"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="inc-service">Impacted Microservice *</label>
                <select
                  id="inc-service"
                  className="form-select"
                  value={formData.service_name}
                  onChange={(e) =>
                    setFormData({ ...formData, service_name: e.target.value })
                  }
                >
                  <option value="api-gateway">api-gateway</option>
                  <option value="auth-service">auth-service</option>
                  <option value="billing-pipeline">billing-pipeline</option>
                  <option value="postgres-cluster">postgres-cluster</option>
                  <option value="k8s-ingress-controller">k8s-ingress-controller</option>
                  <option value="worker-queue">worker-queue</option>
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="inc-severity">Severity Level</label>
                  <select
                    id="inc-severity"
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inc-status">Triage Status</label>
                  <select
                    id="inc-status"
                    className="form-select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="IDENTIFIED">Identified</option>
                    <option value="MONITORING">Monitoring</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inc-assignee">Assigned SRE Lead</label>
                <input
                  id="inc-assignee"
                  type="text"
                  className="form-input"
                  value={formData.assigned_to}
                  onChange={(e) =>
                    setFormData({ ...formData, assigned_to: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="inc-desc">Initial Triage Notes & Context</label>
                <textarea
                  id="inc-desc"
                  className="form-textarea"
                  rows="3"
                  placeholder="Outline symptoms, error codes, impact radius, or runbook links..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-submit-incident"
                >
                  Publish Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer>
        CloudPulse Platform &copy; 2026 | Enterprise SRE Operations, Incident Automation & Observability
      </footer>
    </div>
  );
}
