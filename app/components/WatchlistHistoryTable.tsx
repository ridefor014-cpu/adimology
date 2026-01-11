'use client';

import { useState, useEffect } from 'react';
import { exportHistoryToPDF } from '@/lib/pdfExport';

interface AnalysisRecord {
  id: number;
  from_date: string;
  emiten: string;
  sector?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;       // maps to offer_teratas
  arb?: number;       // maps to bid_terbawah
  target_realistis?: number;
  target_max?: number;
  status: string;
  error_message?: string;
}

export default function WatchlistHistoryTable() {
  const [data, setData] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    emiten: '',
    sector: 'all',
    fromDate: '',
    toDate: '',
    status: 'all'
  });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ column: 'from_date', direction: 'desc' });
  const [sectors, setSectors] = useState<string[]>([]);
  const pageSize = 50;

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [filters, page, sort]);

  const fetchSectors = async () => {
    try {
      const response = await fetch('/api/sectors');
      const json = await response.json();
      if (json.success) {
        setSectors(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  // Debounced fetch for text inputs could be added, but manual trigger or loose effect is fine for now
  
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      });

      if (filters.emiten) params.append('emiten', filters.emiten);
      if (filters.sector !== 'all') params.append('sector', filters.sector);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);

      const response = await fetch(`/api/watchlist-history?${params}`);
      const json = await response.json();

      if (json.success) {
        setData(json.data || []);
        setTotalCount(json.count || 0);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num?: number) => num?.toLocaleString() ?? '-';
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Handle YYYY-MM-DD format
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).replace(' ', '-');
  };

  const calculateGain = (price: number | undefined, target: number | undefined) => {
    if (!price || !target || price === 0) return null;
    const gain = ((target - price) / price) * 100;
    return `+${gain.toFixed(1)}%`;
  };

  return (
    <div className="glass-card-static">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>📊 Watchlist Analysis History</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={fetchHistory}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => exportHistoryToPDF(data, filters)}
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.8rem',
              background: 'var(--gradient-success)',
              boxShadow: '0 4px 15px rgba(56, 239, 125, 0.4)'
            }}
            disabled={data.length === 0}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
          <label className="input-label compact-label">Emiten</label>
          <input
            type="text"
            className="input-field compact-input"
            placeholder="e.g., BBCA"
            value={filters.emiten}
            onChange={(e) => {
              setFilters({ ...filters, emiten: e.target.value.toUpperCase() });
              setPage(0); // Reset page on filter change
            }}
          />
        </div>

        <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
          <label className="input-label compact-label">From Date</label>
          <input
            type="date"
            className="input-field compact-input"
            value={filters.fromDate}
            onChange={(e) => {
              setFilters({ ...filters, fromDate: e.target.value });
              setPage(0);
            }}
            onClick={(e) => e.currentTarget.showPicker()}
          />
        </div>

        <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
          <label className="input-label compact-label">To Date</label>
          <input
            type="date"
            className="input-field compact-input"
            value={filters.toDate}
            onChange={(e) => {
              setFilters({ ...filters, toDate: e.target.value });
              setPage(0);
            }}
            onClick={(e) => e.currentTarget.showPicker()}
          />
        </div>

        <div className="input-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
          <label className="input-label compact-label">Status</label>
          <select
            className="input-field compact-input"
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(0);
            }}
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
          <label className="input-label compact-label">Sector</label>
          <select
            className="input-field compact-input"
            value={filters.sector}
            onChange={(e) => {
              setFilters({ ...filters, sector: e.target.value });
              setPage(0);
            }}
          >
            <option value="all">All Sectors</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          No data found matching your filters
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr>
                  <th 
                    style={{ whiteSpace: 'nowrap', padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => {
                      const direction = sort.column === 'from_date' && sort.direction === 'desc' ? 'asc' : 'desc';
                      setSort({ column: 'from_date', direction });
                    }}
                  >
                    Date {sort.column === 'from_date' ? (sort.direction === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th 
                    style={{ whiteSpace: 'nowrap', padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => {
                      const direction = sort.column === 'emiten' && sort.direction === 'asc' ? 'desc' : 'asc';
                      setSort({ column: 'emiten', direction });
                    }}
                  >
                    Emiten {sort.column === 'emiten' ? (sort.direction === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Harga</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target R1</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target Max</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bandar</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vol Bandar</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Bandar</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record, index) => (
                  <tr
                    key={record.id}
                    style={{ 
                      borderBottom: index < data.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>{formatDate(record.from_date)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{record.emiten}</div>
                      {record.sector && (
                        <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '2px' }}>
                          {record.sector}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem' }}>
                      {formatNumber(record.harga)}
                    </td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem', color: 'var(--accent-success)' }}>
                        {formatNumber(record.target_realistis)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {calculateGain(record.harga, record.target_realistis)}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem', color: 'var(--accent-warning)' }}>
                        {formatNumber(record.target_max)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {calculateGain(record.harga, record.target_max)}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{record.bandar || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem' }}>
                      {formatNumber(record.barang_bandar)}
                    </td>
                    <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem' }}>
                        {formatNumber(record.rata_rata_bandar)}
                      </div>
                      {record.rata_rata_bandar && record.harga && record.rata_rata_bandar < record.harga && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {calculateGain(record.rata_rata_bandar, record.harga)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {record.status === 'success' ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: 'rgba(56, 239, 125, 0.1)', 
                          color: 'var(--accent-success)' 
                        }}>
                          ✓
                        </span>
                      ) : (
                        <span
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            background: 'rgba(245, 87, 108, 0.1)', 
                            color: 'var(--accent-warning)',
                            cursor: 'pointer' 
                          }}
                          title={record.error_message}
                        >
                          ✕
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} records
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  padding: '0.5rem 1rem'
                }}
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  color: (page + 1) * pageSize >= totalCount ? 'var(--text-muted)' : 'var(--text-primary)',
                  padding: '0.5rem 1rem'
                }}
                disabled={(page + 1) * pageSize >= totalCount}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
