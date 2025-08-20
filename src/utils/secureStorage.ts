import CryptoJS from 'crypto-js';

// Generate a device-specific encryption key
const getEncryptionKey = (): string => {
  let key = localStorage.getItem('app_encryption_key');
  
  if (!key) {
    // Generate a new key based on device characteristics
    const deviceInfo = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
    
    key = CryptoJS.SHA256(deviceInfo + Date.now()).toString();
    localStorage.setItem('app_encryption_key', key);
  }
  
  return key;
};

export class SecureStorage {
  private static key = getEncryptionKey();
  
  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  static decrypt(encryptedData: string): any {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.key);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Failed to decrypt data');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  static setItem(key: string, data: any): void {
    try {
      const encrypted = this.encrypt(data);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store data securely:', error);
      // Fallback to regular storage for backwards compatibility
      localStorage.setItem(key, JSON.stringify(data));
    }
  }
  
  static getItem(key: string): any {
    try {
      // Try to get encrypted data first
      const encryptedData = localStorage.getItem(`secure_${key}`);
      if (encryptedData) {
        return this.decrypt(encryptedData);
      }
      
      // Fallback to regular storage for backwards compatibility
      const regularData = localStorage.getItem(key);
      if (regularData) {
        const parsed = JSON.parse(regularData);
        // Migrate to secure storage
        this.setItem(key, parsed);
        localStorage.removeItem(key);
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      // Try fallback to regular storage
      try {
        const regularData = localStorage.getItem(key);
        return regularData ? JSON.parse(regularData) : null;
      } catch {
        return null;
      }
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
    localStorage.removeItem(key); // Also remove non-encrypted version
  }
  
  static clear(): void {
    // Remove all secure storage items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_') || key === 'healthMetrics' || key === 'healthGoals') {
        localStorage.removeItem(key);
      }
    });
  }
}

// Data retention policy
export class DataRetentionManager {
  private static readonly MAX_METRICS_AGE_DAYS = 365 * 2; // 2 years
  private static readonly MAX_GOALS_AGE_DAYS = 365; // 1 year
  
  static cleanupOldData(): { metricsRemoved: number; goalsRemoved: number } {
    const now = new Date();
    let metricsRemoved = 0;
    let goalsRemoved = 0;
    
    try {
      // Clean up old metrics
      const metrics = SecureStorage.getItem('healthMetrics') || [];
      const filteredMetrics = metrics.filter((metric: any) => {
        const metricDate = new Date(metric.date);
        const daysDiff = (now.getTime() - metricDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > this.MAX_METRICS_AGE_DAYS) {
          metricsRemoved++;
          return false;
        }
        return true;
      });
      
      if (metricsRemoved > 0) {
        SecureStorage.setItem('healthMetrics', filteredMetrics);
      }
      
      // Clean up old goals
      const goals = SecureStorage.getItem('healthGoals') || [];
      const filteredGoals = goals.filter((goal: any) => {
        const goalDate = new Date(goal.targetDate);
        const daysDiff = (now.getTime() - goalDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > this.MAX_GOALS_AGE_DAYS) {
          goalsRemoved++;
          return false;
        }
        return true;
      });
      
      if (goalsRemoved > 0) {
        SecureStorage.setItem('healthGoals', filteredGoals);
      }
      
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
    
    return { metricsRemoved, goalsRemoved };
  }
  
  static getDataStats(): { totalMetrics: number; totalGoals: number; oldestMetric?: Date; newestMetric?: Date } {
    try {
      const metrics = SecureStorage.getItem('healthMetrics') || [];
      const goals = SecureStorage.getItem('healthGoals') || [];
      
      let oldestMetric: Date | undefined;
      let newestMetric: Date | undefined;
      
      if (metrics.length > 0) {
        const dates = metrics.map((m: any) => new Date(m.date)).sort();
        oldestMetric = dates[0];
        newestMetric = dates[dates.length - 1];
      }
      
      return {
        totalMetrics: metrics.length,
        totalGoals: goals.length,
        oldestMetric,
        newestMetric
      };
    } catch (error) {
      console.error('Failed to get data stats:', error);
      return { totalMetrics: 0, totalGoals: 0 };
    }
  }
}