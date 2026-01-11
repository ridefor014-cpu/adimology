import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketDetector, fetchOrderbook, getTopBroker, parseLot, getBrokerSummary, fetchEmitenInfo } from '@/lib/stockbit';
import { calculateTargets } from '@/lib/calculations';
import { saveStockQuery, getLatestStockQuery } from '@/lib/supabase';
import type { StockInput, ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: StockInput = await request.json();
    const { emiten, fromDate, toDate } = body;

    // Validate input
    if (!emiten || !fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: emiten, fromDate, toDate' },
        { status: 400 }
      );
    }

    // Fetch data from both Stockbit APIs and emiten info
    const [marketDetectorData, orderbookData, emitenInfoData] = await Promise.all([
      fetchMarketDetector(emiten, fromDate, toDate),
      fetchOrderbook(emiten),
      fetchEmitenInfo(emiten).catch(() => null), // Don't fail if sector fetch fails
    ]);

    // Extract top broker data
    const brokerData = getTopBroker(marketDetectorData);

    if (!brokerData) {
      // Attempt to fetch latest historical data
      const historyData = await getLatestStockQuery(emiten);
      
      if (historyData) {
        return NextResponse.json({
          success: true,
          data: {
            input: { emiten, fromDate: historyData.from_date, toDate: historyData.to_date },
            stockbitData: {
              bandar: historyData.bandar,
              barangBandar: historyData.barang_bandar,
              rataRataBandar: historyData.rata_rata_bandar
            },
            marketData: {
               harga: historyData.harga,
               offerTeratas: historyData.ara,
               bidTerbawah: historyData.arb,
               totalBid: historyData.total_bid,
               totalOffer: historyData.total_offer,
               fraksi: historyData.fraksi
            },
            calculated: {
               totalPapan: historyData.total_papan,
               rataRataBidOfer: historyData.rata_rata_bid_ofer,
               a: historyData.a,
               p: historyData.p,
               targetRealistis1: historyData.target_realistis,
               targetMax: historyData.target_max
            },
            brokerSummary: null,
            isFromHistory: true,
            historyDate: historyData.from_date
          }
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Data broker tidak tersedia untuk periode ini (Market belum buka atau saham tidak aktif)'
        },
        { status: 404 }
      );
    }

    // Extract broker summary for the new card
    const brokerSummary = getBrokerSummary(marketDetectorData);

    // Extract sector from emiten info
    const sector = emitenInfoData?.data?.sector || undefined;


    // Extract market data
    // The API might return data wrapped in 'data' property or directly
    // based on previous code handling. We'll try to access .data first.
    // Casting to any to avoid strict type checks on the potential direct structure if types are strict
    const obData = orderbookData.data || (orderbookData as any);

    if (!obData.total_bid_offer || obData.close === undefined) {
      // console.log('Orderbook API Response Structure:', JSON.stringify(orderbookData, null, 2));
      throw new Error('Invalid Orderbook API response structure');
    }

    // Mencari offer terbesar dan bid terkecil dari orderbook hari ini
    const offerPrices = (obData.offer || []).map((o: { price: string }) => Number(o.price));
    const bidPrices = (obData.bid || []).map((b: { price: string }) => Number(b.price));

    const offerTeratas = offerPrices.length > 0
      ? Math.max(...offerPrices)
      : Number(obData.high || 0);
    const bidTerbawah = bidPrices.length > 0 ? Math.min(...bidPrices) : 0;

    const marketData = {
      harga: Number(obData.close),
      offerTeratas,
      bidTerbawah,
      totalBid: parseLot(obData.total_bid_offer.bid.lot),
      totalOffer: parseLot(obData.total_bid_offer.offer.lot),
    };



    // Calculate targets
    // Note: totalBid and totalOffer are divided by 100 as per user requirement
    const calculated = calculateTargets(
      brokerData.rataRataBandar,
      brokerData.barangBandar,
      marketData.offerTeratas,
      marketData.bidTerbawah,
      marketData.totalBid / 100,
      marketData.totalOffer / 100,
      marketData.harga
    );


    // Prepare response
    const result: ApiResponse = {
      success: true,
      data: {
        input: { emiten, fromDate, toDate },
        stockbitData: brokerData,
        marketData: {
          ...marketData,
          fraksi: calculated.fraksi,
        },
        calculated: {
          totalPapan: calculated.totalPapan,
          rataRataBidOfer: calculated.rataRataBidOfer,
          a: calculated.a,
          p: calculated.p,
          targetRealistis1: calculated.targetRealistis1,
          targetMax: calculated.targetMax,
        },
        brokerSummary,
        sector,
      },
    };

    // Save to Supabase (non-blocking)
    saveStockQuery({
      emiten,
      sector,
      from_date: fromDate,
      to_date: toDate,
      bandar: brokerData.bandar,
      barang_bandar: brokerData.barangBandar,
      rata_rata_bandar: brokerData.rataRataBandar,
      harga: marketData.harga,
      ara: marketData.offerTeratas,
      arb: marketData.bidTerbawah,
      fraksi: calculated.fraksi,
      total_bid: marketData.totalBid,
      total_offer: marketData.totalOffer,
      total_papan: calculated.totalPapan,
      rata_rata_bid_ofer: calculated.rataRataBidOfer,
      a: calculated.a,
      p: calculated.p,
      target_realistis: calculated.targetRealistis1,
      target_max: calculated.targetMax,
    }).catch((err) => console.error('Failed to save to Supabase:', err));

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
