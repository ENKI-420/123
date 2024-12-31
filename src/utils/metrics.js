const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class MetricsCollector {
    static instance = null;
    
    constructor() {
        if (MetricsCollector.instance) {
            return MetricsCollector.instance;
        }
        
        this.metrics = {
            counters: new Map(),
            gauges: new Map(),
            histograms: new Map()
        };
        
        this.eventEmitter = new EventEmitter();
        this.persistencePath = path.join(process.cwd(), 'data', 'metrics');
        this.flushInterval = 60000; // 1 minute
        
        this.setupPersistence();
        MetricsCollector.instance = this;
    }
    
    // Counter methods
    incrementCounter(name, value = 1, tags = {}) {
        const key = this.formatMetricKey(name, tags);
        const current = this.metrics.counters.get(key) || 0;
        this.metrics.counters.set(key, current + value);
        this.emit('metric.counter', { name, value: current + value, tags });
    }
    
    // Gauge methods
    setGauge(name, value, tags = {}) {
        const key = this.formatMetricKey(name, tags);
        this.metrics.gauges.set(key, value);
        this.emit('metric.gauge', { name, value, tags });
    }
    
    // Histogram methods
    recordHistogram(name, value, tags = {}) {
        const key = this.formatMetricKey(name, tags);
        if (!this.metrics.histograms.has(key)) {
            this.metrics.histograms.set(key, []);
        }
        this.metrics.histograms.get(key).push(value);
        this.emit('metric.histogram', { name, value, tags });
    }
    
    // Aggregation methods
    getMetricValue(type, name, tags = {}) {
        const key = this.formatMetricKey(name, tags);
        return this.metrics[type].get(key);
    }
    
    getHistogramStats(name, tags = {}) {
        const key = this.formatMetricKey(name, tags);
        const values = this.metrics.histograms.get(key) || [];
        if (values.length === 0) return null;
        
        const sorted = [...values].sort((a, b) => a - b);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p95: sorted[Math.floor(sorted.length * 0.95)],
            count: values.length
        };
    }
    
    // Event handling
    on(event, handler) {
        this.eventEmitter.on(event, handler);
    }
    
    emit(event, data) {
        this.eventEmitter.emit(event, data);
    }
    
    // Persistence methods
    async setupPersistence() {
        try {
            await fs.mkdir(this.persistencePath, { recursive: true });
            this.startPeriodicFlush();
            await this.loadPersistedMetrics();
        } catch (error) {
            console.error('Failed to setup metrics persistence:', error);
        }
    }
    
    async persistMetrics() {
        const timestamp = new Date().toISOString();
        const metricsData = {
            timestamp,
            counters: Object.fromEntries(this.metrics.counters),
            gauges: Object.fromEntries(this.metrics.gauges),
            histograms: Object.fromEntries(this.metrics.histograms)
        };
        
        try {
            const filename = `metrics-${timestamp}.json`;
            await fs.writeFile(
                path.join(this.persistencePath, filename),
                JSON.stringify(metricsData, null, 2)
            );
        } catch (error) {
            console.error('Failed to persist metrics:', error);
        }
    }
    
    async loadPersistedMetrics() {
        try {
            const files = await fs.readdir(this.persistencePath);
            const latestFile = files
                .filter(f => f.startsWith('metrics-'))
                .sort()
                .pop();
            
            if (latestFile) {
                const data = JSON.parse(
                    await fs.readFile(path.join(this.persistencePath, latestFile))
                );
                this.metrics.counters = new Map(Object.entries(data.counters));
                this.metrics.gauges = new Map(Object.entries(data.gauges));
                this.metrics.histograms = new Map(Object.entries(data.histograms));
            }
        } catch (error) {
            console.error('Failed to load persisted metrics:', error);
        }
    }
    
    startPeriodicFlush() {
        setInterval(() => this.persistMetrics(), this.flushInterval);
    }
    
    // Utility methods
    formatMetricKey(name, tags) {
        const tagString = Object.entries(tags)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
        return tagString ? `${name}:${tagString}` : name;
    }
    
    // Monitoring system integration
    async getMetricsSnapshot() {
        return {
            timestamp: new Date().toISOString(),
            counters: Object.fromEntries(this.metrics.counters),
            gauges: Object.fromEntries(this.metrics.gauges),
            histograms: Object.entries(this.metrics.histograms).reduce((acc, [key, values]) => {
                acc[key] = this.getHistogramStats(key);
                return acc;
            }, {})
        };
    }
    
    reset() {
        this.metrics.counters.clear();
        this.metrics.gauges.clear();
        this.metrics.histograms.clear();
    }
}

module.exports = MetricsCollector;

