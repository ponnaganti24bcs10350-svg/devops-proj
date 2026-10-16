import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  X
} from 'lucide-react';

const API_BASE = '';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
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
      const healthRes = await fetch(`${API_BASE}/health`).catch(() => null);
      if (healthRes && healthRes.ok) {
        const hData = await healthRes.json();
        setHealth(hData);
      } else {
        setHealth({ status: 'degraded', database: 'unreachable' });
      }
      const incRes = await fetch(`${API_BASE}/api/v1/incidents`);
      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }
      const srvRes = await fetch(`${API_BASE}/api/v1/services`);
      if (srvRes.ok) {
        const sData = await srvRes.json();
        setServices(sData);
      }
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
    try {
      setIncidents((prev) => prev.filter((inc) => inc.id !== id));
      const res = await fetch(`${API_BASE}/api/v1/incidents/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchData();
      } else {
        await fetchData();
      }
    } catch (err) {
      console.error('Delete operation failed:', err);
      await fetchData();
    }
  };
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
      <header>
        <div className="header-container">
          <div className="logo-group">
            <div className="logo-icon-wrapper">
              <Activity size={18} strokeWidth={2.4} />
            </div>
            <div className="logo-title">
              <h1>
                CloudPulse <span className="ops-tag">SRE</span>
              </h1>
              <p>Platform Health & Incident Command</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="cluster-pill">
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
              <span>Metrics</span>
              <ExternalLink size={12} color="var(--text-muted)" />
            </a>

            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              id="btn-swagger"
              title="OpenAPI Documentation"
            >
              <span>API Docs</span>
              <ExternalLink size={12} color="var(--text-muted)" />
            </a>

            <button
              className="btn btn-primary"
              id="btn-report-incident"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={15} strokeWidth={2.4} />
              <span>Report Incident</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="system-banner">
          <div className="banner-left">
            <span className={`status-badge ${isSystemHealthy ? 'badge-operational' : 'badge-degraded'}`}>
              {isSystemHealthy ? 'All Systems Operational' : 'Degraded Performance'}
            </span>
            <span className="banner-summary-text">
              {isSystemHealthy
                ? 'All cloud microservices passing health probes with normal latency.'
                : 'Elevated error rates detected. SRE on-call escalation in progress.'}
            </span>
          </div>

          <div className="banner-chips">
            <span className="banner-chip">API: {health.status}</span>
            <span className="banner-chip">DB: {health.database}</span>
            <span className="banner-chip">Multi-AZ</span>
          </div>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Total incidents</span>
            <div className="kpi-value" id="kpi-total-val">
              {stats ? stats.total_incidents : incidents.length}
            </div>
            <div className="kpi-subtext">Recorded lifecycle history</div>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Active outages</span>
            <div
              className={`kpi-value ${stats && (stats.critical_count + stats.high_count) > 0 ? 'val-alert' : ''}`}
              id="kpi-critical-val"
            >
              {stats ? stats.critical_count + stats.high_count : 0}
            </div>
            <div className="kpi-subtext">High & critical severity issues</div>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Under triage</span>
            <div className="kpi-value val-triage" id="kpi-active-val">
              {stats ? stats.active_incidents : 0}
            </div>
            <div className="kpi-subtext">Active root cause investigation</div>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Resolved</span>
            <div className="kpi-value val-resolved" id="kpi-resolved-val">
              {stats ? stats.resolved_incidents : 0}
            </div>
            <div className="kpi-subtext">Mitigated and closed</div>
          </div>
        </div>
        <section>
          <div className="section-header">
            <h2 className="section-title">
              <span>Monitored Core Infrastructure</span>
            </h2>
            <span className="section-count">{services.length} services</span>
          </div>

          <div className="services-grid">
            {services.map((srv) => (
              <div key={srv.id || srv.name} className="service-card">
                <div className="service-card-top">
                  <span className="service-name">{srv.name}</span>
                  <span className="service-status-pill">{srv.status.toLowerCase()}</span>
                </div>
                <div className="service-metrics-row">
                  <span>{srv.uptime_pct}% uptime</span>
                  <span>{srv.latency_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="section-header">
            <h2 className="section-title">
              <span>Incident Response & Triage Feed</span>
            </h2>
            <span className="section-count">{filteredIncidents.length} displayed</span>
          </div>
          <div className="toolbar">
            <div className="toolbar-search-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="input-search"
                id="search-input"
                placeholder="Search by title, service, or assignee..."
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
          <div className="incidents-feed">
            {filteredIncidents.length === 0 ? (
              <div className="empty-feed">
                <p>No active incidents matching current filters.</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  All systems operating within acceptable SLO thresholds.
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
                        {inc.severity.toLowerCase()}
                      </span>
                      <span className={`badge badge-${inc.status.toLowerCase()}`}>
                        {inc.status.toLowerCase()}
                      </span>
                      <span className="incident-title">{inc.title}</span>
                    </div>

                    {inc.description && (
                      <p className="incident-desc">{inc.description}</p>
                    )}

                    <div className="incident-meta">
                      <span className="meta-service-tag">{inc.service_name}</span>
                      <span>&bull;</span>
                      <span>Assigned to {inc.assigned_to}</span>
                      <span>&bull;</span>
                      <span>
                        {new Date(inc.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {inc.resolved_at && (
                        <>
                          <span>&bull;</span>
                          <span style={{ color: 'var(--status-ok-text)' }}>
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
                        </>
                      )}
                    </div>
                  </div>
                  <div className="incident-actions">
                    {inc.status !== 'RESOLVED' ? (
                      <button
                        className="btn btn-action-resolve"
                        id={`btn-resolve-${inc.id}`}
                        onClick={() => handleStatusUpdate(inc.id, 'RESOLVED')}
                      >
                        Resolve
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
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Declare Production Incident</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
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
        CloudPulse Platform &copy; 2026 | Site Reliability Operations & Incident Management
      </footer>
    </div>
  );
}
