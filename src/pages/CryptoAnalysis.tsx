
import React, { useState } from 'react';
import { InvestmentForm } from '@/components/InvestmentForm';
import { AnalysisResults } from '@/components/AnalysisResults';
import { useInvestmentAnalysis } from '@/hooks/useInvestmentAnalysis';
import { toast } from 'sonner';
import type { InvestmentInputs, AnalysisResult } from '@/types/investment';

const CryptoAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { analyzeInvestment, loading, error } = useInvestmentAnalysis();

  const handleAnalysis = async (inputs: InvestmentInputs) => {
    const result = await analyzeInvestment(inputs);
    
    if (result) {
      setAnalysisResult(result);
      toast.success('Investment analysis completed successfully!');
    } else if (error) {
      toast.error(`Analysis failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Advanced Cryptocurrency Investment Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            Make informed investment decisions across Bitcoin, Blue Chip, and Small-Cap cryptocurrencies 
            using Cointime Economics, Federal Reserve analysis, and advanced financial metrics.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Cointime Economics Integration</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Smart Money Analysis</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              <span>Fed Rate Impact Assessment</span>
            </div>
          </div>
        </div>

        <InvestmentForm onSubmit={handleAnalysis} loading={loading} />

        {analysisResult && <AnalysisResults result={analysisResult} />}

        {error && (
          <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg max-w-2xl mx-auto">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoAnalysis;
