// Rate limiter utility for API requests
class RateLimiter {
  constructor(maxRequests = 120, windowMs = 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.storageKey = 'ragbot-rate-limit';
  }

  // Check if user can make a request
  canMakeRequest() {
    const data = this.getRateLimitData();
    const now = Date.now();
    
    // If no data exists or window has expired, reset
    if (!data || (now - data.startTime) > this.windowMs) {
      this.resetRateLimit();
      return true;
    }
    
    // Check if under limit
    return data.requestCount < this.maxRequests;
  }

  // Record a request
  recordRequest() {
    const data = this.getRateLimitData();
    const now = Date.now();
    
    if (!data || (now - data.startTime) > this.windowMs) {
      // Reset if window expired
      this.resetRateLimit();
      data = { startTime: now, requestCount: 0 };
    }
    
    data.requestCount++;
    this.saveRateLimitData(data);
  }

  // Get current rate limit status
  getStatus() {
    const data = this.getRateLimitData();
    const now = Date.now();
    
    if (!data || (now - data.startTime) > this.windowMs) {
      return {
        remaining: this.maxRequests,
        used: 0,
        resetTime: now + this.windowMs,
        canMakeRequest: true
      };
    }
    
    const remaining = Math.max(0, this.maxRequests - data.requestCount);
    const resetTime = data.startTime + this.windowMs;
    
    return {
      remaining,
      used: data.requestCount,
      resetTime,
      canMakeRequest: remaining > 0
    };
  }

  // Reset rate limit (for testing or admin purposes)
  resetRateLimit() {
    const data = {
      startTime: Date.now(),
      requestCount: 0
    };
    this.saveRateLimitData(data);
  }

  // Get formatted reset time
  getFormattedResetTime() {
    const status = this.getStatus();
    const resetDate = new Date(status.resetTime);
    return resetDate.toLocaleString();
  }

  // Private methods
  getRateLimitData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading rate limit data:', error);
      return null;
    }
  }

  saveRateLimitData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving rate limit data:', error);
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter(120, 24 * 60 * 60 * 1000); // 120 requests per 24 hours

export default rateLimiter;
