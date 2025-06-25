
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
            Cryptocurrency Investment Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Make informed investment decisions across Bitcoin, Blue Chip, and Small-Cap cryptocurrencies 
            using advanced financial metrics and value investing principles.
          </p>
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
