import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from '@/components/Navbar';
import { InvestmentForm } from '@/components/InvestmentForm';
import { AnalysisResults } from '@/components/AnalysisResults';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useInvestmentAnalysis } from '@/hooks/useInvestmentAnalysis';
import { Lock } from 'lucide-react';
import type { InvestmentInputs, AnalysisResult } from '@/types/investment';

const CryptoAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { hasActiveSubscription, user } = useSubscription();
  const { analyzeInvestment, loading, error } = useInvestmentAnalysis();

  const handleAnalysis = async (inputs: InvestmentInputs) => {
    const result = await analyzeInvestment(inputs);
    if (result) {
      setAnalysisResult(result);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Crypto Investment Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Make informed investment decisions with our advanced analysis tools. 
            Get personalized recommendations based on your portfolio and risk tolerance.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!user ? (
            <Card className="text-center p-8">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Lock className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in to access the crypto investment analyzer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="analysis tools" size="lg" />
              </CardContent>
            </Card>
          ) : !hasActiveSubscription ? (
            <Card className="text-center p-8">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Lock className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle>Premium Feature</CardTitle>
                <CardDescription>
                  Upgrade to access advanced crypto investment analysis tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="analysis tools" size="lg" />
              </CardContent>
            </Card>
          ) : (
            <>
              <InvestmentForm onSubmit={handleAnalysis} loading={loading} />
              {analysisResult && <AnalysisResults result={analysisResult} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoAnalysis;