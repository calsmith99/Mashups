'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

// Simple quota tracking (client-side estimate)
export default function QuotaIndicator() {
  // Initialize state with stored value
  const [estimatedUsage, setEstimatedUsage] = useState(() => {
    if (typeof window === 'undefined') return 0;
    
    const stored = localStorage.getItem('youtube-quota-usage');
    if (stored) {
      const data = JSON.parse(stored);
      const today = new Date().toDateString();
      if (data.date === today) {
        return data.usage;
      } else {
        // New day, reset
        localStorage.setItem('youtube-quota-usage', JSON.stringify({ date: today, usage: 0 }));
        return 0;
      }
    }
    return 0;
  });
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for quota usage events
    const handleQuotaUsage = (event: Event) => {
      const customEvent = event as CustomEvent<{ units: number }>;
      setEstimatedUsage((prev: number) => {
        const newUsage = prev + customEvent.detail.units;
        
        // Store in localStorage
        const today = new Date().toDateString();
        localStorage.setItem('youtube-quota-usage', JSON.stringify({ date: today, usage: newUsage }));
        
        return newUsage;
      });
    };

    window.addEventListener('youtube-quota-used', handleQuotaUsage);
    return () => {
      window.removeEventListener('youtube-quota-used', handleQuotaUsage);
    };
  }, []);

  const quotaLimit = 10000;
  const usagePercentage = (estimatedUsage / quotaLimit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isOverLimit = usagePercentage > 100;

  if (!isVisible && usagePercentage < 50) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-sm ${
      isOverLimit 
        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
        : isNearLimit 
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {(isOverLimit || isNearLimit) && <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            YouTube API Usage
          </h4>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Daily Usage:</span>
          <span>{estimatedUsage.toLocaleString()} / {quotaLimit.toLocaleString()}</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isOverLimit 
            ? 'Quota exceeded! Videos will show as mock data until midnight PT.'
            : isNearLimit 
            ? 'Approaching daily limit. Use search carefully.'
            : 'Each video search uses ~30 quota units.'
          }
        </p>
      </div>
    </div>
  );
}

// Helper function to track quota usage
export const trackQuotaUsage = (units: number) => {
  const event = new CustomEvent('youtube-quota-used', { detail: { units } });
  window.dispatchEvent(event);
};