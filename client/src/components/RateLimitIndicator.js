import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import rateLimiter from '../utils/rateLimiter';

const RateLimitIndicator = () => {
  const [status, setStatus] = useState(rateLimiter.getStatus());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update status every minute
    const interval = setInterval(() => {
      setStatus(rateLimiter.getStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Show indicator if usage is high (>80%) or if limit is reached
  useEffect(() => {
    const usagePercentage = (status.used / 120) * 100;
    setIsVisible(usagePercentage > 80 || !status.canMakeRequest);
  }, [status]);

  if (!isVisible) return null;

  const usagePercentage = (status.used / 120) * 100;
  const isLimitReached = !status.canMakeRequest;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`p-3 rounded-lg border shadow-lg max-w-sm ${
        isLimitReached 
          ? 'bg-red-900/90 border-red-600 text-red-100' 
          : 'bg-yellow-900/90 border-yellow-600 text-yellow-100'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {isLimitReached ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isLimitReached ? 'Rate Limit Reached' : 'Rate Limit Warning'}
          </span>
        </div>
        
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Requests used:</span>
            <span className="font-medium">{status.used} / 120</span>
          </div>
          
          <div className="flex justify-between">
            <span>Remaining:</span>
            <span className="font-medium">{status.remaining}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isLimitReached ? 'bg-red-400' : 'bg-yellow-400'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex items-center space-x-1 mt-2 text-gray-300">
            <Clock className="w-3 h-3" />
            <span className="text-xs">
              Resets: {rateLimiter.getFormattedResetTime()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitIndicator;
