// Results Logger - Enterprise Test Results Management
// Gestor de resultados enterprise para stress testing

console.log("📊 Results Logger - Enterprise Test Results Management");

const fs = require('fs').promises;
const path = require('path');

class ResultsLogger {
  constructor(config = {}) {
    this.name = 'results-logger';
    this.config = {
      outputDir: config.outputDir || './reports',
      filename: config.filename || 'stress-test-report',
      format: config.format || 'json', // json, csv, html
      includeTimeline: config.includeTimeline !== false,
      includeRawData: config.includeRawData || false,
      ...config
    };
    
    this.currentTest = null;
    this.results = null;
    
    console.log(`📊 [${this.name}] Results logger initialized:`, {
      outputDir: this.config.outputDir,
      format: this.config.format
    });
  }

  /**
   * Initialize new test session
   */
  async initializeTest(testName, scenario) {
    this.currentTest = {
      name: testName,
      scenario: scenario.name,
      startTime: new Date().toISOString(),
      config: this.config
    };
    
    console.log(`📊 [${this.name}] Test session initialized: ${testName}`);
  }

  /**
   * Save test results
   */
  async saveResults(results) {
    if (!this.currentTest) {
      throw new Error('No test session initialized');
    }
    
    this.results = results;
    this.currentTest.endTime = new Date().toISOString();
    this.currentTest.duration = Date.now() - new Date(this.currentTest.startTime).getTime();
    
    // Ensure output directory exists
    await this.ensureOutputDirectory();
    
    // Generate reports
    const reports = [];
    
    if (this.config.format.includes('json')) {
      const jsonReport = await this.generateJsonReport();
      reports.push(jsonReport);
    }
    
    if (this.config.format.includes('csv')) {
      const csvReport = await this.generateCsvReport();
      reports.push(csvReport);
    }
    
    if (this.config.format.includes('html')) {
      const htmlReport = await this.generateHtmlReport();
      reports.push(htmlReport);
    }
    
    console.log(`📊 [${this.name}] Results saved:`, reports);
    
    return reports;
  }

  /**
   * Generate JSON report
   */
  async generateJsonReport() {
    const report = {
      metadata: this.currentTest,
      summary: this.results.summary,
      endpoints: this.results.endpoints,
      bottlenecks: this.results.bottlenecks,
      recommendations: this.results.recommendations,
      performance: this.calculatePerformanceMetrics(),
      timestamp: new Date().toISOString()
    };
    
    if (this.config.includeTimeline) {
      report.timeline = this.results.timeline;
    }
    
    if (this.config.includeRawData) {
      report.rawData = {
        totalRequests: this.results.summary.total_requests,
        successfulRequests: this.results.summary.successful_requests,
        failedRequests: this.results.summary.failed_requests
      };
    }
    
    const filename = `${this.config.filename}-${Date.now()}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    return {
      type: 'json',
      filename,
      filepath,
      size: report
    };
  }

  /**
   * Generate CSV report
   */
  async generateCsvReport() {
    const filename = `${this.config.filename}-${Date.now()}.csv`;
    const filepath = path.join(this.config.outputDir, filename);
    
    // CSV headers
    const headers = [
      'timestamp',
      'endpoint',
      'latency_ms',
      'success',
      'status_code'
    ];
    
    // CSV rows
    const rows = [headers.join(',')];
    
    if (this.config.includeTimeline && this.results.timeline) {
      for (const record of this.results.timeline) {
        const row = [
          new Date(record.timestamp).toISOString(),
          record.endpoint,
          record.latency,
          record.success,
          record.statusCode
        ];
        rows.push(row.join(','));
      }
    }
    
    await fs.writeFile(filepath, rows.join('\n'));
    
    return {
      type: 'csv',
      filename,
      filepath,
      rows: rows.length - 1
    };
  }

  /**
   * Generate HTML report
   */
  async generateHtmlReport() {
    const filename = `${this.config.filename}-${Date.now()}.html`;
    const filepath = path.join(this.config.outputDir, filename);
    
    const html = this.generateHtmlContent();
    
    await fs.writeFile(filepath, html);
    
    return {
      type: 'html',
      filename,
      filepath
    };
  }

  /**
   * Generate HTML content
   */
  generateHtmlContent() {
    const summary = this.results.summary;
    const bottlenecks = this.results.bottlenecks;
    const recommendations = this.results.recommendations;
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stress Test Report - ${this.currentTest.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .status-${summary.system_status} { padding: 10px; border-radius: 4px; color: white; font-weight: bold; }
        .status-healthy { background: #28a745; }
        .status-degraded { background: #ffc107; color: #000; }
        .status-critical { background: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric h3 { margin: 0 0 10px 0; color: #007bff; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .bottlenecks, .recommendations { margin-bottom: 30px; }
        .bottleneck, .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
        .bottleneck.critical { background: #f8d7da; border-color: #f5c6cb; }
        .endpoint-stats { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Stress Test Report</h1>
            <h2>${this.currentTest.name}</h2>
            <p><strong>Scenario:</strong> ${this.currentTest.scenario}</p>
            <p><strong>Duration:</strong> ${this.formatDuration(this.currentTest.duration)}</p>
            <div class="status-${summary.system_status}">
                System Status: ${summary.system_status.toUpperCase()}
            </div>
        </div>

        <div class="metrics">
            <div class="metric">
                <h3>Total Requests</h3>
                <div class="value">${summary.total_requests.toLocaleString()}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${(100 - summary.error_rate).toFixed(1)}%</div>
            </div>
            <div class="metric">
                <h3>Avg Latency</h3>
                <div class="value">${summary.avg_latency}ms</div>
            </div>
            <div class="metric">
                <h3>P95 Latency</h3>
                <div class="value">${summary.p95_latency}ms</div>
            </div>
            <div class="metric">
                <h3>P99 Latency</h3>
                <div class="value">${summary.p99_latency}ms</div>
            </div>
            <div class="metric">
                <h3>Error Rate</h3>
                <div class="value">${summary.error_rate.toFixed(2)}%</div>
            </div>
        </div>

        <div class="endpoint-stats">
            <h2>📊 Endpoint Performance</h2>
            <table>
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Requests</th>
                        <th>Success Rate</th>
                        <th>Avg Latency</th>
                        <th>P95 Latency</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(this.results.endpoints).map(([endpoint, stats]) => `
                        <tr>
                            <td>${endpoint}</td>
                            <td>${stats.requests}</td>
                            <td>${((stats.successful / stats.requests) * 100).toFixed(1)}%</td>
                            <td>${Math.round(stats.latencies.reduce((sum, lat) => sum + lat, 0) / stats.latencies.length)}ms</td>
                            <td>${this.calculatePercentile(stats.latencies, 95)}ms</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${bottlenecks.length > 0 ? `
        <div class="bottlenecks">
            <h2>🚨 Performance Bottlenecks</h2>
            ${bottlenecks.map(bottleneck => `
                <div class="bottleneck ${bottleneck.severity}">
                    <strong>${bottleneck.endpoint} - ${bottleneck.type}:</strong> ${bottleneck.value}
                    <br><em>Severity: ${bottleneck.severity}</em>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>💡 Optimization Recommendations</h2>
            ${recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.type} (${rec.priority}):</strong> ${rec.description}
                    <br><em>Action: ${rec.action}</em>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>MiProfesional Load Testing System</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics() {
    const summary = this.results.summary;
    
    return {
      requestsPerSecond: Math.round(summary.total_requests / (this.currentTest.duration / 1000)),
      throughput: summary.successful_requests,
      efficiency: ((summary.successful_requests / summary.total_requests) * 100).toFixed(2),
      performanceScore: this.calculatePerformanceScore(),
      resourceUtilization: this.estimateResourceUtilization()
    };
  }

  /**
   * Calculate performance score (0-100)
   */
  calculatePerformanceScore() {
    const summary = this.results.summary;
    let score = 100;
    
    // Penalize high error rate
    score -= summary.error_rate * 2;
    
    // Penalize high latency
    if (summary.p95_latency > 1000) {
      score -= 20;
    } else if (summary.p95_latency > 500) {
      score -= 10;
    }
    
    // Bonus for good performance
    if (summary.error_rate < 1 && summary.p95_latency < 200) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Estimate resource utilization
   */
  estimateResourceUtilization() {
    const summary = this.results.summary;
    const rps = summary.total_requests / (this.currentTest.duration / 1000);
    
    return {
      cpu: Math.min(100, Math.round(rps * 0.1)), // Rough estimate
      memory: Math.min(100, Math.round(rps * 0.05)), // Rough estimate
      network: Math.min(100, Math.round(rps * 0.02)) // Rough estimate
    };
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Format duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.access(this.config.outputDir);
    } catch (error) {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Get saved reports
   */
  async getSavedReports() {
    try {
      await this.ensureOutputDirectory();
      const files = await fs.readdir(this.config.outputDir);
      
      return files
        .filter(file => file.startsWith(this.config.filename))
        .map(file => ({
          filename: file,
          path: path.join(this.config.outputDir, file),
          type: path.extname(file).substring(1),
          size: 0 // Would need fs.stat for actual size
        }))
        .sort((a, b) => b.filename.localeCompare(a.filename));
    } catch (error) {
      console.error(`📊 [${this.name}] Error getting saved reports:`, error);
      return [];
    }
  }

  /**
   * Clean old reports
   */
  async cleanOldReports(maxFiles = 10) {
    try {
      const reports = await this.getSavedReports();
      
      if (reports.length > maxFiles) {
        const filesToDelete = reports.slice(maxFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`📊 [${this.name}] Deleted old report: ${file.filename}`);
        }
      }
    } catch (error) {
      console.error(`📊 [${this.name}] Error cleaning old reports:`, error);
    }
  }

  /**
   * Get test summary
   */
  getTestSummary() {
    if (!this.results) {
      return null;
    }
    
    return {
      name: this.currentTest?.name,
      scenario: this.currentTest?.scenario,
      duration: this.currentTest?.duration,
      status: this.results.summary.system_status,
      requests: this.results.summary.total_requests,
      errorRate: this.results.summary.error_rate,
      avgLatency: this.results.summary.avg_latency,
      bottlenecks: this.results.bottlenecks.length,
      recommendations: this.results.recommendations.length
    };
  }
}

module.exports = {
  ResultsLogger
};
