interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeOperations: Map<string, number> = new Map();

  // Start timing an operation
  start(operation: string): void {
    const startTime = Date.now();
    this.activeOperations.set(operation, startTime);
    console.log(`⏱️  Started: ${operation}`);
  }

  // End timing an operation
  end(operation: string): number {
    const startTime = this.activeOperations.get(operation);
    const endTime = Date.now();
    
    if (!startTime) {
      console.warn(`⚠️  No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = endTime - startTime;
    
    this.metrics.push({
      operation,
      startTime,
      endTime,
      duration
    });

    this.activeOperations.delete(operation);
    
    console.log(`✅ Completed: ${operation} in ${duration}ms`);
    return duration;
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics for a specific operation
  getMetricsForOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  // Get summary statistics
  getSummary(): { [operation: string]: { count: number; totalTime: number; avgTime: number } } {
    const summary: { [operation: string]: { count: number; totalTime: number; avgTime: number } } = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.operation]) {
        summary[metric.operation] = { count: 0, totalTime: 0, avgTime: 0 };
      }
      
      summary[metric.operation].count++;
      summary[metric.operation].totalTime += metric.duration || 0;
      summary[metric.operation].avgTime = summary[metric.operation].totalTime / summary[metric.operation].count;
    });
    
    return summary;
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }

  // Log performance comparison
  logComparison(oldTime: number, newTime: number, operation: string): void {
    const improvement = ((oldTime - newTime) / oldTime) * 100;
    const improvementText = improvement > 0 ? `${improvement.toFixed(1)}% faster` : `${Math.abs(improvement).toFixed(1)}% slower`;
    
    console.log(`🚀 Performance Improvement for ${operation}:`);
    console.log(`   Before: ${oldTime}ms`);
    console.log(`   After:  ${newTime}ms`);
    console.log(`   Result: ${improvementText}`);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for common operations
export const trackBestiaryLoad = () => performanceMonitor.start('Bestiary Initial Load');
export const trackBestiaryLoadEnd = () => performanceMonitor.end('Bestiary Initial Load');

export const trackTypeLoad = (type: string) => performanceMonitor.start(`Load ${type} monsters`);
export const trackTypeLoadEnd = (type: string) => performanceMonitor.end(`Load ${type} monsters`);

export const trackFileDiscovery = () => performanceMonitor.start('File Discovery');
export const trackFileDiscoveryEnd = () => performanceMonitor.end('File Discovery'); 