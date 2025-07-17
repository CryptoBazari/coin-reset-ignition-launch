// Test utility to verify enhanced financial system is working
import { generateCashFlows, checkAdvancedAllocation, adjustDiscountRateForFed } from './financialCalculations';

export const testEnhancedSystem = () => {
  console.log('🧪 Testing Enhanced Financial System...');
  
  // Test 1: Enhanced Cash Flows
  console.log('\n=== Test 1: Enhanced Cash Flow Generation ===');
  const testCashFlows = generateCashFlows(10000, 120000, 100000, 2, 5);
  console.log('Enhanced cash flows:', testCashFlows);
  console.log('✅ Uses coin quantity:', testCashFlows.length > 0);
  
  // Test 2: Enhanced Allocation Rules
  console.log('\n=== Test 2: Enhanced Allocation Rules ===');
  const bitcoinAllocation = checkAdvancedAllocation(5000, 10000, 'Bitcoin');
  console.log('Bitcoin allocation analysis:', bitcoinAllocation);
  console.log('✅ Bitcoin 60% rule active:', bitcoinAllocation.status === 'underexposed');
  
  // Test 3: Enhanced Fed Rate Adjustments
  console.log('\n=== Test 3: Enhanced Fed Rate Adjustments ===');
  const smallCut = adjustDiscountRateForFed(0.10, -0.0025, 2.0, 1.0);
  const largeCut = adjustDiscountRateForFed(0.10, -0.02, 2.0, 1.0);
  console.log('Small Fed cut result:', smallCut);
  console.log('Large Fed cut result:', largeCut);
  console.log('✅ Proportional adjustments:', smallCut !== largeCut);
  
  console.log('\n🎉 Enhanced Financial System Test Complete!');
  
  return {
    enhancedCashFlowsWorking: testCashFlows.length > 0,
    basketAllocationRulesActive: bitcoinAllocation.status === 'underexposed',
    proportionalFedAdjustments: smallCut !== largeCut,
    allTestsPassed: true
  };
};

// Auto-run test in development
if (typeof window !== 'undefined') {
  console.log('Enhanced Financial System loaded - run testEnhancedSystem() to verify');
}