'use client';

import { useState, useEffect } from 'react';
import InputForm from './InputForm';
import CompactResultCard from './CompactResultCard';
import BrokerSummaryCard from './BrokerSummaryCard';
import html2canvas from 'html2canvas';
import type { StockInput, StockAnalysisResult } from '@/lib/types';
import { getDefaultDate } from '@/lib/utils';

interface CalculatorProps {
  selectedStock?: string | null;
}

// Helper function to format the result data for copying
function formatResultForCopy(result: StockAnalysisResult): string {
  const { input, stockbitData, marketData, calculated } = result;

  const formatNumber = (num: number | null | undefined) => num?.toLocaleString() ?? '-';

  const calculateGain = (target: number) => {
    const gain = ((target - marketData.harga) / marketData.harga) * 100;
    return gain.toFixed(2);
  };

  const lines = [
    `ADIMOLGY: ${input.emiten.toUpperCase()}`,
    `${input.fromDate} s/d ${input.toDate}`,
    ``,
    `TOP BROKER`,
    `Broker: ${stockbitData.bandar}`,
    `∑ Brg: ${formatNumber(stockbitData.barangBandar)} lot`,
    `Avg Harga: Rp ${formatNumber(stockbitData.rataRataBandar)}`,
    ``,
    `MARKET DATA`,
    `Harga: Rp ${formatNumber(marketData.harga)}`,
    `Offer Max: Rp ${formatNumber(marketData.offerTeratas)}`,
    `Bid Min: Rp ${formatNumber(marketData.bidTerbawah)}`,
    `Fraksi: ${formatNumber(marketData.fraksi)}`,
    `∑ Bid: ${formatNumber(marketData.totalBid / 100)}`,
    `∑ Offer: ${formatNumber(marketData.totalOffer / 100)}`,
    ``,
    `CALCULATIONS`,
    `∑ Papan: ${formatNumber(calculated.totalPapan)}`,
    `Avg Bid-Offer: ${formatNumber(calculated.rataRataBidOfer)}`,
    `a (5% avg bandar): ${formatNumber(calculated.a)}`,
    `p (Brg/Avg Bid-Offer): ${formatNumber(calculated.p)}`,
    ``,
    `Target 1: ${calculated.targetRealistis1} (+${calculateGain(calculated.targetRealistis1)}%)`,
    `Target 2: ${calculated.targetMax} (+${calculateGain(calculated.targetMax)}%)`,
  ];

  return lines.join('\n');
}

export default function Calculator({ selectedStock }: CalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StockAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  // Date state lifted from InputForm
  const [fromDate, setFromDate] = useState(getDefaultDate());
  const [toDate, setToDate] = useState(getDefaultDate());

  // Reset result and error when a new stock is selected from sidebar
  useEffect(() => {
    if (selectedStock) {
      setResult(null);
      setError(null);
      // Auto-analyze with current selected dates
      // This allows clicking watchlist items to RESPECT the date range selected by user
      handleSubmit({
        emiten: selectedStock,
        fromDate,
        toDate
      });
    }
  }, [selectedStock]);

  const handleSubmit = async (data: StockInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to analyze stock');
      }

      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFromDate(newFrom);
    setToDate(newTo);
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      const formattedText = formatResultForCopy(result);
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyImage = async () => {
    const cardElement = document.getElementById('compact-result-card-container');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
      });

      // Wrap toBlob in a Promise to keep the async chain active for Safari's strict user-gesture checks
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error('Failed to generate image blob');

      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } catch (err) {
        console.error('Clipboard write failed:', err);
        
        // 1. Fallback for iOS Safari / Mobile: Web Share API
        // This opens the native share sheet which is often preferred on mobile
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], `${result?.input.emiten || 'stock'}-analysis.png`, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Stock Analysis Result',
                });
                return; 
            }
        }
        
        // 2. If all else fails
        throw err;
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError('Failed to copy image. Try taking a screenshot manually.');
    }
  };

  return (
    <div className="container">


      <InputForm
        onSubmit={handleSubmit}
        loading={loading}
        initialEmiten={selectedStock}
        fromDate={fromDate}
        toDate={toDate}
        onDateChange={handleDateChange}
      />

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p className="text-secondary mt-2">Fetching data from Stockbit...</p>
        </div>
      )}

      {error && (
        <div className="glass-card mt-4" style={{
          background: 'rgba(245, 87, 108, 0.1)',
          borderColor: 'var(--accent-warning)'
        }}>
          <h3>❌ Error</h3>
          <p style={{ color: 'var(--accent-warning)' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '2rem' }}>
          {result.isFromHistory && result.historyDate && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              color: '#ffc107',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                Data broker live tidak tersedia. Menampilkan data history terakhir dari tanggal 
                <strong style={{ marginLeft: '4px', color: '#ffca2c' }}>
                  {new Date(result.historyDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </div>
            </div>
          )}

          {/* Side-by-side Cards Container */}
          <div className="cards-row">
            {/* Left Column: Compact Result + Copy Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div id="compact-result-card-container">
                <CompactResultCard result={result} />
              </div>

              {/* Copy Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleCopy}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: copied ? 'var(--gradient-success)' : 'var(--gradient-primary)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyImage}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: copiedImage ? 'var(--gradient-success)' : '#4a5568',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {copiedImage ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📸</span>
                      <span>Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Broker Summary */}
            {result.brokerSummary && (
              <BrokerSummaryCard
                emiten={result.input.emiten}
                dateRange={`${result.input.fromDate} — ${result.input.toDate}`}
                brokerSummary={result.brokerSummary}
                sector={result.sector}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
