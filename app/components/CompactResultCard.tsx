'use client';

import type { StockAnalysisResult } from '@/lib/types';

interface CompactResultCardProps {
  result: StockAnalysisResult;
}

export default function CompactResultCard({ result }: CompactResultCardProps) {
  const { input, stockbitData, marketData, calculated } = result;

  const formatNumber = (num: number | null | undefined) => num?.toLocaleString() ?? '-';
  
  const calculateGain = (target: number) => {
    const gain = ((target - marketData.harga) / marketData.harga) * 100;
    return gain.toFixed(2);
  };

  return (
    <div className="compact-card">
      {/* Header */}
      <div className="compact-header">
        <div>
          <div className="compact-ticker">+ {input.emiten.toUpperCase()}</div>
          {result.sector && (
            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '2px' }}>
              {result.sector}
            </div>
          )}
        </div>
        <div className="compact-date">
          <span className="compact-date-icon">📅</span>
          {input.fromDate} — {input.toDate}
        </div>
      </div>

      {/* Top Broker Section */}
      <div className="compact-section">
        <div className="compact-section-title">Top Broker</div>
        <div className="compact-grid-3">
          <div className="compact-cell">
            <span className="compact-label">Bandar</span>
            <span className="compact-value compact-badge-primary">{stockbitData.bandar}</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">Barang</span>
            <span className="compact-value">{formatNumber(stockbitData.barangBandar)} lot</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">Avg Harga</span>
            <span className="compact-value">Rp {formatNumber(stockbitData.rataRataBandar)}</span>
            {stockbitData.rataRataBandar && marketData.harga && stockbitData.rataRataBandar < marketData.harga && (
              <span style={{ fontSize: '0.65rem', color: '#888', marginTop: '2px', display: 'block' }}>
                +{(((marketData.harga - stockbitData.rataRataBandar) / stockbitData.rataRataBandar) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Market Data Section */}
      <div className="compact-section">
        <div className="compact-section-title">Market Data</div>
        <div className="compact-grid-3">
          <div className="compact-cell">
            <span className="compact-label">Harga</span>
            <span className="compact-value">Rp {formatNumber(marketData.harga)}</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">Offer Max</span>
            <span className="compact-value">Rp {formatNumber(marketData.offerTeratas)}</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">Bid Min</span>
            <span className="compact-value">Rp {formatNumber(marketData.bidTerbawah)}</span>
          </div>
        </div>
        <div className="compact-grid-3">
          <div className="compact-cell">
            <span className="compact-label">Fraksi</span>
            <span className="compact-value">{formatNumber(marketData.fraksi)}</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">Total Bid</span>
            <span className="compact-value">{formatNumber(marketData.totalBid / 100)}</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">Total Offer</span>
            <span className="compact-value">{formatNumber(marketData.totalOffer / 100)}</span>
          </div>
        </div>
      </div>

      {/* Calculations Section */}
      <div className="compact-section">
        <div className="compact-section-title">Calculations</div>
        <div className="compact-grid-2">
          <div className="compact-cell">
            <span className="compact-label">Total Papan</span>
            <span className="compact-value">{formatNumber(calculated.totalPapan)}</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">Rata² Bid/Offer</span>
            <span className="compact-value">{formatNumber(calculated.rataRataBidOfer)}</span>
          </div>
        </div>
        <div className="compact-grid-2">
          <div className="compact-cell">
            <span className="compact-label">a (5% avg bandar)</span>
            <span className="compact-value">{formatNumber(calculated.a)}</span>
          </div>
          <div className="compact-cell">
            <span className="compact-label">p (Barang/Avg)</span>
            <span className="compact-value">{formatNumber(calculated.p)}</span>
          </div>
        </div>
      </div>

      {/* Target Section */}
      <div className="compact-section">
        <div className="compact-section-title">Target Prices</div>
        <div className="compact-grid-2">
          <div className="compact-cell compact-target-cell">
            <span className="compact-label">Target Realistis</span>
            <div className="compact-target">
              <span className="compact-target-value compact-badge-success">{calculated.targetRealistis1}</span>
              <span className="compact-target-gain">+{calculateGain(calculated.targetRealistis1)}%</span>
            </div>
          </div>
          <div className="compact-cell compact-target-cell">
            <span className="compact-label">Target Max</span>
            <div className="compact-target">
              <span className="compact-target-value compact-badge-warning">{calculated.targetMax}</span>
              <span className="compact-target-gain">+{calculateGain(calculated.targetMax)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
