'use client';

import { useEffect, useState } from 'react';

// Draft-specific QuickCalculation – mirrors main QuickCalculation
export default function DraftQuickCalculation({ onApplyCalculation }) {
  const [amount, setAmount] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [weightNeeded, setWeightNeeded] = useState('0.000 kg');
  const [calculatedWeight, setCalculatedWeight] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const calculateWeight = () => {
    const amountValue = parseFloat(amount) || 0;
    const priceValue = parseFloat(pricePerKg) || 0;

    if (priceValue <= 0) {
      setWeightNeeded("Enter valid price");
      setCalculatedWeight(0);
      return;
    }

    const weight = amountValue / priceValue;
    setWeightNeeded(`${weight.toFixed(3)} kg`);
    setCalculatedWeight(weight);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handlePriceChange = (e) => {
    setPricePerKg(e.target.value);
  };

  const handleApply = async () => {
    if (isApplying || calculatedWeight <= 0) return;

    setIsApplying(true);
    try {
      if (onApplyCalculation) {
        await onApplyCalculation(calculatedWeight);
        setAmount('');
        setPricePerKg('');
        setWeightNeeded('0.000 kg');
        setCalculatedWeight(0);
      } else {
        alert('Error: Calculation function not available');
      }
    } catch (error) {
      console.error('DraftQuickCalculation: Error applying calculation:', error);
      alert('Error applying calculation. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setPricePerKg('');
    setWeightNeeded('0.000 kg');
    setCalculatedWeight(0);
  };

  useEffect(() => {
    if (amount && pricePerKg) {
      calculateWeight();
    } else {
      setWeightNeeded('0.000 kg');
      setCalculatedWeight(0);
    }
  }, [amount, pricePerKg]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Quick Weight Calculation</h2>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            onKeyPress={handleKeyPress}
            step="1"
            min="1"
            placeholder="e.g. 500"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Price per Kg (₹)
          </label>
          <input
            type="number"
            value={pricePerKg}
            onChange={handlePriceChange}
            onKeyPress={handleKeyPress}
            step="0.01"
            min="0.01"
            placeholder="e.g. 25.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Weight Needed
          </label>
          <div
            className={`w-full px-3 py-2 border rounded-md ${
              calculatedWeight > 0
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-gray-300 bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{weightNeeded}</span>
              {calculatedWeight > 0 && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                  Ready
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleApply}
            disabled={calculatedWeight <= 0 || isApplying}
            className={`px-4 py-2 rounded-md transition-colors w-full flex items-center justify-center gap-2 ${
              calculatedWeight > 0 && !isApplying
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isApplying ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Applying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply to Last Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


