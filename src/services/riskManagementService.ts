import { VirtualAsset } from '@/types/virtualPortfolio';
import { CoinMarketCapCoin } from './coinMarketCapService';

export interface RiskAnalysis {
  currentBtcAllocation: number;
  recommendedBtcAllocation: number;
  totalValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  isCompliant: boolean;
  rebalanceAmount: number;
  rebalanceDirection: 'buy' | 'sell' | 'none';
  diversificationScore: number;
}

export interface RebalanceRecommendation {
  action: 'buy_btc' | 'sell_btc' | 'none';
  amount: number;
  targetAllocation: number;
  reason: string;
}

class RiskManagementService {
  /**
   * Get recommended BTC allocation percentage based on portfolio value
   */
  getRecommendedBtcAllocation(totalValue: number): number {
    if (totalValue <= 20000) {
      return 50; // 50% for up to $20K
    } else if (totalValue <= 100000) {
      return 70; // 70% for $20K - $100K
    } else {
      return 85; // 85% for above $100K
    }
  }

  /**
   * Calculate current BTC allocation percentage
   */
  calculateBtcAllocation(assets: VirtualAsset[], liveCoinsData: CoinMarketCapCoin[]): number {
    let totalValue = 0;
    let btcValue = 0;

    assets.forEach(asset => {
      const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
      const currentPrice = liveCoinData?.current_price || asset.average_price;
      const assetValue = asset.total_amount * currentPrice;
      
      totalValue += assetValue;
      
      if (asset.virtual_coins.symbol === 'BTC') {
        btcValue += assetValue;
      }
    });

    return totalValue > 0 ? (btcValue / totalValue) * 100 : 0;
  }

  /**
   * Calculate portfolio total value with live prices
   */
  calculatePortfolioValue(assets: VirtualAsset[], liveCoinsData: CoinMarketCapCoin[]): number {
    return assets.reduce((total, asset) => {
      const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
      const currentPrice = liveCoinData?.current_price || asset.average_price;
      return total + (asset.total_amount * currentPrice);
    }, 0);
  }

  /**
   * Calculate diversification score (0-100, higher is better)
   */
  calculateDiversificationScore(assets: VirtualAsset[], liveCoinsData: CoinMarketCapCoin[]): number {
    if (assets.length === 0) return 0;

    const totalValue = this.calculatePortfolioValue(assets, liveCoinsData);
    if (totalValue === 0) return 0;

    // Calculate concentration risk using Herfindahl-Hirschman Index
    let hhi = 0;
    assets.forEach(asset => {
      const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
      const currentPrice = liveCoinData?.current_price || asset.average_price;
      const assetValue = asset.total_amount * currentPrice;
      const weight = (assetValue / totalValue) * 100;
      hhi += Math.pow(weight, 2);
    });

    // Convert HHI to a 0-100 score (lower HHI = higher diversification)
    // HHI ranges from 10000 (complete concentration) to 0 (perfect diversification)
    const diversificationScore = Math.max(0, 100 - (hhi / 100));
    return Math.round(diversificationScore);
  }

  /**
   * Perform comprehensive risk analysis
   */
  analyzeRisk(assets: VirtualAsset[], liveCoinsData: CoinMarketCapCoin[]): RiskAnalysis {
    const totalValue = this.calculatePortfolioValue(assets, liveCoinsData);
    const currentBtcAllocation = this.calculateBtcAllocation(assets, liveCoinsData);
    const recommendedBtcAllocation = this.getRecommendedBtcAllocation(totalValue);
    const diversificationScore = this.calculateDiversificationScore(assets, liveCoinsData);

    const allocationDiff = Math.abs(currentBtcAllocation - recommendedBtcAllocation);
    const isCompliant = currentBtcAllocation >= recommendedBtcAllocation;

    // Calculate rebalance amount
    const targetBtcValue = (recommendedBtcAllocation / 100) * totalValue;
    const currentBtcValue = (currentBtcAllocation / 100) * totalValue;
    const rebalanceAmount = Math.abs(targetBtcValue - currentBtcValue);

    let riskLevel: 'low' | 'medium' | 'high';
    if (allocationDiff <= 5) {
      riskLevel = 'low';
    } else if (allocationDiff <= 15) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    return {
      currentBtcAllocation: Math.round(currentBtcAllocation * 100) / 100,
      recommendedBtcAllocation,
      totalValue,
      riskLevel,
      isCompliant,
      rebalanceAmount,
      rebalanceDirection: currentBtcAllocation < recommendedBtcAllocation ? 'buy' : 
                        currentBtcAllocation > recommendedBtcAllocation ? 'sell' : 'none',
      diversificationScore
    };
  }

  /**
   * Generate rebalancing recommendations
   */
  getRebalanceRecommendation(riskAnalysis: RiskAnalysis): RebalanceRecommendation {
    const { currentBtcAllocation, recommendedBtcAllocation, totalValue, rebalanceAmount, isCompliant } = riskAnalysis;

    if (isCompliant) {
      return {
        action: 'none',
        amount: 0,
        targetAllocation: recommendedBtcAllocation,
        reason: 'Portfolio is properly balanced according to risk guidelines.'
      };
    }

    if (currentBtcAllocation < recommendedBtcAllocation) {
      return {
        action: 'buy_btc',
        amount: rebalanceAmount,
        targetAllocation: recommendedBtcAllocation,
        reason: `Increase BTC allocation from ${currentBtcAllocation.toFixed(1)}% to ${recommendedBtcAllocation}% to meet risk guidelines.`
      };
    } else {
      return {
        action: 'sell_btc',
        amount: rebalanceAmount,
        targetAllocation: recommendedBtcAllocation,
        reason: `Reduce BTC allocation from ${currentBtcAllocation.toFixed(1)}% to ${recommendedBtcAllocation}% to avoid over-concentration.`
      };
    }
  }
}

export const riskManagementService = new RiskManagementService();