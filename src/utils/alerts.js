const EventEmitter = require('events');
const winston = require('winston');

// Alert severity levels
const Severity = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

class AlertManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxHistorySize: 1000,
            aggregationWindow: 300000, // 5 minutes in ms
            ...config
        };
        
        this.alertHistory = [];
        this.activeAlerts = new Map();
        this.notificationChannels = new Map();
        this.alertFilters = [];
        
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.File({ filename: 'alerts.log' })
            ]
        });
    }

    // Add a new notification channel
    addNotificationChannel(channelName, handler) {
        this.notificationChannels.set(channelName, handler);
    }

    // Add alert filter
    addAlertFilter(filter) {
        this.alertFilters.push(filter);
    }

    // Create and route a new alert
    async createAlert(alert) {
        const alertData = {
            id: this._generateAlertId(),
            timestamp: Date.now(),
            severity: alert.severity || Severity.INFO,
            message: alert.message,
            source: alert.source,
            metadata: alert.metadata || {},
            status: 'active'
        };

        // Apply filters
        if (this._shouldFilter(alertData)) {
            return null;
        }

        // Check for similar active alerts for aggregation
        const aggregatedAlert = this._checkAggregation(alertData);
        if (aggregatedAlert) {
            this._updateAggregatedAlert(aggregatedAlert, alertData);
            return aggregatedAlert;
        }

        // Store the alert
        this.activeAlerts.set(alertData.id, alertData);
        this._addToHistory(alertData);

        // Emit event for monitoring integration
        this.emit('newAlert', alertData);

        // Route alert to appropriate channels
        await this._routeAlert(alertData);

        return alertData;
    }

    // Resolve an active alert
    resolveAlert(alertId, resolution = {}) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert ${alertId} not found`);
        }

        alert.status = 'resolved';
        alert.resolution = resolution;
        alert.resolvedAt = Date.now();

        this.activeAlerts.delete(alertId);
        this._addToHistory(alert);
        this.emit('alertResolved', alert);

        return alert;
    }

    // Get active alerts with optional filtering
    getActiveAlerts(filter = {}) {
        return Array.from(this.activeAlerts.values())
            .filter(alert => this._matchesFilter(alert, filter));
    }

    // Get alert history with optional filtering
    getAlertHistory(filter = {}) {
        return this.alertHistory
            .filter(alert => this._matchesFilter(alert, filter));
    }

    // Private methods
    _generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _shouldFilter(alert) {
        return this.alertFilters.some(filter => filter(alert));
    }

    _checkAggregation(newAlert) {
        const cutoffTime = Date.now() - this.config.aggregationWindow;
        
        return Array.from(this.activeAlerts.values())
            .find(alert => 
                alert.source === newAlert.source &&
                alert.severity === newAlert.severity &&
                alert.timestamp > cutoffTime
            );
    }

    _updateAggregatedAlert(existingAlert, newAlert) {
        existingAlert.count = (existingAlert.count || 1) + 1;
        existingAlert.lastOccurrence = newAlert.timestamp;
        existingAlert.metadata.aggregated = true;
        
        this.emit('alertAggregated', existingAlert);
    }

    async _routeAlert(alert) {
        try {
            const promises = [];
            
            for (const [channelName, handler] of this.notificationChannels) {
                if (this._shouldNotifyChannel(channelName, alert)) {
                    promises.push(handler(alert));
                }
            }

            await Promise.all(promises);
        } catch (error) {
            this.logger.error('Error routing alert', { alert, error });
            throw error;
        }
    }

    _shouldNotifyChannel(channelName, alert) {
        // Implement channel-specific routing logic
        return true;
    }

    _matchesFilter(alert, filter) {
        return Object.entries(filter).every(([key, value]) => 
            alert[key] === value
        );
    }

    _addToHistory(alert) {
        this.alertHistory.push(alert);
        
        // Maintain history size limit
        if (this.alertHistory.length > this.config.maxHistorySize) {
            this.alertHistory.shift();
        }
    }
}

module.exports = {
    AlertManager,
    Severity
};

