
import { mockGlassNodeService } from './mockGlassNodeService';
import { enhancedFallbackDataService } from './enhancedFallbackDataService';

export interface FallbackCAGRResult {
  cagr: number;
  initialValue: number;
  finalValue: number;
  timeperiodYears: number;
  dataPoints: number;
  dataSource: 'live_api' | 'test_data' | 'database';
  calculationSteps: {
    step1_initialValue: number;
    step2_finalValue: number;
    step3_timeperiodYears: number;
    step4_growthRatio: number;
    step5_exponent: number;
    step6_cagrBase: number;
    step7_finalCAGR: number;
  };
  confidence: 'high' | 'medium' | 'low';
}

class FallbackCAGRService {
  
  async calculateCAGR(
    coinId: string,
    symbol: string,
    yearsBack: number = 3
  ): Promise<FallbackCAGRResult> {
    console.log(`📊 Calculating CAGR for ${symbol} with fallback support`);
    
    // Check if APIs are available
    const apiAvailable = await enhancedFallbackDataService.checkGlassnodeAvailability();
    
    if (apiAvailable) {
      console.log('🌐 Attempting live API CAGR calculation');
      try {
        return await this.calculateLiveCAGR(coinId, symbol, yearsBack);
      } catch (error) {
        console.log('⚠️ Live API failed, using test data');
        return await this.calculateTestCAGR(symbol, yearsBack);
      }
    } else {
      console.log('🧪 Using test data for CAGR calculation');
      return await this.calculateTestCAGR(symbol, yearsBack);
    }
  }
  
  private async calculateLiveCAGR(
    coinId: string,
    symbol: string,
    yearsBack: number
  ): Promise<FallbackCAGRResult> {
    // This would use the enhanced real-time CAGR service
    // For now, throw error to trigger fallback
    throw new Error('Live API implementation pending');
  }
  
  private async calculateTestCAGR(
    symbol: string,
    yearsBack: number
  ): Promise<FallbackCAGRResult> {
    const testData = mockGlassNodeService.getTestData(symbol);
    
    if (!testData || !testData.priceHistory || testData.priceHistory.length < 2) {
      throw new Error(`Insufficient test data for ${symbol} CAGR calculation`);
    }
    
    // Filter data for the requested time period
    const endTime = Date.now() / 1000;
    const startTime = endTime - (yearsBack * 365.25 * 24 * 60 * 60);
    
    const filteredHistory = testData.priceHistory.filter(point => 
      point.timestamp >= startTime && point.timestamp <= endTime
    );
    
    if (filteredHistory.length < 2) {
      // Use all available data if filtered set is too small
      const allData = testData.priceHistory;
      const actualYears = (allData[allData.length - 1].timestamp - allData[0].timestamp) / (365.25 * 24 * 60 * 60);
      
      return this.performCAGRCalculation(
        allData[0].price,
        allData[allData.length - 1].price,
        actualYears,
        allData.length,
        'test_data'
      );
    }
    
    // Sort by timestamp to ensure correct order
    const sortedData = filteredHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate exact time period
    const actualYears = (sortedData[sortedData.length - 1].timestamp - sortedData[0].timestamp) / (365.25 * 24 * 60 * 60);
    
    console.log(`📈 ${symbol} Test CAGR - Using ${sortedData.length} data points over ${actualYears.toFixed(2)} years`);
    
    return this.performCAGRCalculation(
      sortedData[0].price,
      sortedData[sortedData.length - 1].price,
      actualYears,
      sortedData.length,
      'test_data'
    );
  }
  
  private performCAGRCalculation(
    initialValue: number,
    finalValue: number,
    timeperiodYears: number,
    dataPoints: number,
    dataSource: 'live_api' | 'test_data' | 'database'
  ): FallbackCAGRResult {
    console.log('🧮 Performing 7-step CAGR calculation:');
    
    // Step 1: Initial Value
    const step1_initialValue = initialValue;
    console.log(`   Step 1 - Initial Value: $${step1_initialValue.toLocaleString()}`);
    
    // Step 2: Final Value  
    const step2_finalValue = finalValue;
    console.log(`   Step 2 - Final Value: $${step2_finalValue.toLocaleString()}`);
    
    // Step 3: Time period in years
    const step3_timeperiodYears = timeperiodYears;
    console.log(`   Step 3 - Time Period: ${step3_timeperiodYears.toFixed(3)} years`);
    
    // Step 4: Growth Ratio (Final Value / Initial Value)
    const step4_growthRatio = step2_finalValue / step1_initialValue;
    console.log(`   Step 4 - Growth Ratio: ${step4_growthRatio.toFixed(6)}`);
    
    // Step 5: Exponent (1/n)
    const step5_exponent = 1 / step3_timeperiodYears;
    console.log(`   Step 5 - Exponent (1/n): ${step5_exponent.toFixed(6)}`);
    
    // Step 6: CAGR Base (Growth Ratio^Exponent)
    const step6_cagrBase = Math.pow(step4_growthRatio, step5_exponent);
    console.log(`   Step 6 - CAGR Base: ${step6_cagrBase.toFixed(6)}`);
    
    // Step 7: Final CAGR ((Base - 1) * 100)
    const step7_finalCAGR = (step6_cagrBase - 1) * 100;
    console.log(`   Step 7 - Final CAGR: ${step7_finalCAGR.toFixed(2)}%`);
    
    const calculationSteps = {
      step1_initialValue,
      step2_finalValue,
      step3_timeperiodYears,
      step4_growthRatio,
      step5_exponent,
      step6_cagrBase,
      step7_finalCAGR
    };
    
    const confidence = this.determineConfidence(dataPoints, timeperiodYears, dataSource);
    
    return {
      cagr: step7_finalCAGR,
      initialValue: step1_initialValue,
      finalValue: step2_finalValue,
      timeperiodYears: step3_timeperiodYears,
      dataPoints,
      dataSource,
      calculationSteps,
      confidence
    };
  }
  
  private determineConfidence(
    dataPoints: number,
    timeperiodYears: number,
    dataSource: string
  ): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Data points score
    if (dataPoints >= 1000) score += 40;
    else if (dataPoints >= 500) score += 30;
    else if (dataPoints >= 100) score += 20;
    else score += 10;
    
    // Time period score
    if (timeperiodYears >= 3) score += 30;
    else if (timeperiodYears >= 2) score += 20;
    else if (timeperiodYears >= 1) score += 10;
    else score += 5;
    
    // Data source score
    if (dataSource === 'live_api') score += 30;
    else if (dataSource === 'test_data') score += 25; // High quality test data
    else if (dataSource === 'database') score += 20;
    
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
}

export const fallbackCAGRService = new FallbackCAGRService();
