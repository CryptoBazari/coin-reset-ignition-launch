import { comprehensiveBetaCalculationService, BetaCalculationResult } from './comprehensiveBetaCalculationService';

export interface BetaCalculationExport {
  metadata: {
    coinSymbol: string;
    benchmarkSymbol: string;
    startDate: string;
    endDate: string;
    calculationDate: string;
    dataPoints: number;
  };
  priceData: {
    coin: Array<{ date: string; price: number }>;
    benchmark: Array<{ date: string; price: number }>;
  };
  alignedData: Array<{
    date: string;
    coinPrice: number;
    benchmarkPrice: number;
  }>;
  returns: Array<{
    date: string;
    coinReturn: number;
    benchmarkReturn: number;
  }>;
  calculations: {
    coinMean: number;
    benchmarkMean: number;
    covariance: number;
    benchmarkVariance: number;
    beta: number;
    confidence: string;
    annualizedVolatility?: number;
  };
}

export class BetaCalculationExportService {
  
  /**
   * Export beta calculation data for verification against manual calculations
   */
  async exportBetaCalculationData(coinSymbol: string): Promise<BetaCalculationExport> {
    console.log(`📋 Exporting beta calculation data for ${coinSymbol}`);
    
    try {
      // Get the beta calculation result
      const result = await comprehensiveBetaCalculationService.calculateComprehensiveBeta(coinSymbol);
      
      // Note: For full verification, we'd need to modify the service to return intermediate data
      // For now, we return the available calculation results
      const exportData: BetaCalculationExport = {
        metadata: {
          coinSymbol: result.coinSymbol,
          benchmarkSymbol: result.benchmarkSymbol,
          startDate: result.startDate,
          endDate: result.endDate,
          calculationDate: result.calculationDate,
          dataPoints: result.dataPoints
        },
        priceData: {
          coin: [],
          benchmark: []
        },
        alignedData: [],
        returns: [],
        calculations: {
          coinMean: result.coinMeanReturn,
          benchmarkMean: result.benchmarkMeanReturn,
          covariance: result.covariance,
          benchmarkVariance: result.benchmarkVariance,
          beta: result.beta,
          confidence: result.confidence,
          annualizedVolatility: result.annualizedVolatility
        }
      };
      
      console.log(`✅ Exported beta calculation summary for ${coinSymbol}`);
      console.log(`📊 Key metrics:`);
      console.log(`   Data points: ${exportData.metadata.dataPoints}`);
      console.log(`   Coin mean return: ${exportData.calculations.coinMean.toFixed(8)}`);
      console.log(`   Benchmark mean return: ${exportData.calculations.benchmarkMean.toFixed(8)}`);
      console.log(`   Covariance: ${exportData.calculations.covariance.toFixed(8)}`);
      console.log(`   Benchmark variance: ${exportData.calculations.benchmarkVariance.toFixed(8)}`);
      console.log(`   Beta: ${exportData.calculations.beta}`);
      
      return exportData;
      
    } catch (error) {
      console.error(`❌ Failed to export beta calculation data for ${coinSymbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Download calculation data as CSV for verification
   */
  async downloadCalculationCSV(coinSymbol: string): Promise<string> {
    const exportData = await this.exportBetaCalculationData(coinSymbol);
    
    // Create CSV content with calculation summary
    const csvLines = [
      'Beta Calculation Summary',
      `Coin Symbol,${exportData.metadata.coinSymbol}`,
      `Benchmark Symbol,${exportData.metadata.benchmarkSymbol}`,
      `Start Date,${exportData.metadata.startDate}`,
      `End Date,${exportData.metadata.endDate}`,
      `Data Points,${exportData.metadata.dataPoints}`,
      '',
      'Calculation Results',
      `Coin Mean Return,${exportData.calculations.coinMean.toFixed(8)}`,
      `Benchmark Mean Return,${exportData.calculations.benchmarkMean.toFixed(8)}`,
      `Covariance,${exportData.calculations.covariance.toFixed(8)}`,
      `Benchmark Variance,${exportData.calculations.benchmarkVariance.toFixed(8)}`,
      `Beta,${exportData.calculations.beta}`,
      `Confidence,${exportData.calculations.confidence}`,
      `Annualized Volatility,${exportData.calculations.annualizedVolatility?.toFixed(4) || 'N/A'}`,
      '',
      'Manual Verification Formula:',
      'Beta = Covariance / Benchmark Variance',
      `Beta = ${exportData.calculations.covariance.toFixed(8)} / ${exportData.calculations.benchmarkVariance.toFixed(8)}`,
      `Beta = ${exportData.calculations.beta}`,
      '',
      'Expected Range Validation:',
      `Data points should be ~998 for 36-month period: ${exportData.metadata.dataPoints} (${((exportData.metadata.dataPoints/998)*100).toFixed(1)}%)`,
      `Date range verification: ${exportData.metadata.startDate} to ${exportData.metadata.endDate}`,
      `Matches manual methodology: ${exportData.metadata.startDate === '2022-08-06' && exportData.metadata.endDate === '2025-05-01' ? 'YES' : 'NO'}`
    ];
    
    return csvLines.join('\n');
  }
  
  /**
   * Compare calculation results with manual methodology expectations
   */
  validateAgainstManualMethodology(exportData: BetaCalculationExport): {
    isValid: boolean;
    validations: Array<{ test: string; passed: boolean; expected: string; actual: string }>;
  } {
    const validations = [
      {
        test: 'Date Range Matches Manual',
        passed: exportData.metadata.startDate === '2022-08-06' && exportData.metadata.endDate === '2025-05-01',
        expected: '2022-08-06 to 2025-05-01',
        actual: `${exportData.metadata.startDate} to ${exportData.metadata.endDate}`
      },
      {
        test: 'Data Points Near Expected',
        passed: exportData.metadata.dataPoints >= 990 && exportData.metadata.dataPoints <= 1000,
        expected: '~998 observations',
        actual: `${exportData.metadata.dataPoints} observations`
      },
      {
        test: 'Beta is Reasonable',
        passed: exportData.calculations.beta > 0 && exportData.calculations.beta < 10,
        expected: '0 < Beta < 10',
        actual: `Beta = ${exportData.calculations.beta}`
      },
      {
        test: 'Covariance is Valid',
        passed: Math.abs(exportData.calculations.covariance) > 1e-8,
        expected: 'Covariance > 1e-8',
        actual: `Covariance = ${exportData.calculations.covariance.toFixed(8)}`
      },
      {
        test: 'Benchmark Variance is Positive',
        passed: exportData.calculations.benchmarkVariance > 0,
        expected: 'Variance > 0',
        actual: `Variance = ${exportData.calculations.benchmarkVariance.toFixed(8)}`
      }
    ];
    
    const isValid = validations.every(v => v.passed);
    
    console.log('🔍 Manual Methodology Validation:');
    validations.forEach(v => {
      console.log(`   ${v.passed ? '✅' : '❌'} ${v.test}: Expected ${v.expected}, Got ${v.actual}`);
    });
    
    return { isValid, validations };
  }
}

export const betaCalculationExportService = new BetaCalculationExportService();