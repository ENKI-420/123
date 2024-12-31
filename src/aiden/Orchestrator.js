import OpenAIProvider from './models/providers/ChatGPT.js';
import GeminiProvider from './models/providers/Gemini.js';
import MistralProvider from './models/providers/Mistral.js';
import PerplexityProvider from './models/providers/Perplexity.js';
import TogetherAIProvider from './models/providers/TogetherAI.js';

class Orchestrator {
    constructor() {
        // Initialize providers
        this.providers = {
            openai: new OpenAIProvider(),
            gemini: new GeminiProvider(),
            mistral: new MistralProvider(),
            perplexity: new PerplexityProvider(),
            togetherai: new TogetherAIProvider()
        };

        // Track provider health and rate limits
        this.healthStatus = {};
        this.rateLimits = {};
        
        // Initialize status for all providers
        Object.keys(this.providers).forEach(provider => {
            this.healthStatus[provider] = true;
            this.rateLimits[provider] = {
                requests: 0,
                lastReset: Date.now(),
                limit: this.getProviderLimit(provider)
            };
        });
    }

    // Get rate limit for each provider
    getProviderLimit(provider) {
        const limits = {
            openai: 3500,
            gemini: 60,
            mistral: 180,
            perplexity: 120,
            togetherai: 300
        };
        return limits[provider] || 100;
    }

    // Select best provider based on requirements and availability
    selectProvider(requirements = {}) {
        const availableProviders = Object.entries(this.providers)
            .filter(([name, _]) => this.healthStatus[name] && !this.isRateLimited(name))
            .sort((a, b) => {
                // Prioritize based on requirements
                if (requirements.preferredProvider === a[0]) return -1;
                if (requirements.preferredProvider === b[0]) return 1;
                
                // Then by rate limit availability
                const aLimit = this.rateLimits[a[0]];
                const bLimit = this.rateLimits[b[0]];
                return (bLimit.limit - bLimit.requests) - (aLimit.limit - aLimit.requests);
            });

        if (availableProviders.length === 0) {
            throw new Error('No available providers');
        }

        return availableProviders[0][1];
    }

    // Check if provider is rate limited
    isRateLimited(provider) {
        const status = this.rateLimits[provider];
        const now = Date.now();
        
        // Reset counter if hour has passed
        if (now - status.lastReset > 3600000) {
            status.requests = 0;
            status.lastReset = now;
            return false;
        }

        return status.requests >= status.limit;
    }

    // Update rate limit counter
    updateRateLimit(provider) {
        this.rateLimits[provider].requests++;
    }

    // Main chat completion method with retries and failover
    async chatCompletion(messages, requirements = {}) {
        const maxRetries = requirements.maxRetries || 3;
        const excludeProviders = new Set();

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Select provider excluding failed ones
                const provider = this.selectProvider({
                    ...requirements,
                    exclude: excludeProviders
                });

                // Attempt completion
                const response = await provider.chatCompletion(messages);
                this.updateRateLimit(provider.name);
                return response;

            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                
                // Mark provider as unhealthy if error is serious
                if (this.isSeriousError(error)) {
                    const failedProvider = this.getProviderFromError(error);
                    if (failedProvider) {
                        this.healthStatus[failedProvider] = false;
                        excludeProviders.add(failedProvider);
                    }
                }

                // Throw error on last attempt
                if (attempt === maxRetries - 1) {
                    throw error;
                }
            }
        }
    }

    // Helper to determine if error requires provider exclusion
    isSeriousError(error) {
        const seriousErrors = [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ECONNRESET',
            'InvalidAuthentication',
            'RateLimitExceeded'
        ];
        return seriousErrors.some(errType => 
            error.code === errType || error.message.includes(errType)
        );
    }

    // Get provider name from error
    getProviderFromError(error) {
        // Extract provider from error message or stack
        const providerNames = Object.keys(this.providers);
        return providerNames.find(name => 
            error.stack.toLowerCase().includes(name.toLowerCase())
        );
    }

    // Method to check provider health
    async checkProviderHealth() {
        for (const [name, provider] of Object.entries(this.providers)) {
            try {
                await provider.healthCheck();
                this.healthStatus[name] = true;
            } catch (error) {
                console.error(`Health check failed for ${name}:`, error);
                this.healthStatus[name] = false;
            }
        }
    }

    // Periodic health check
    startHealthChecks(interval = 300000) { // 5 minutes
        setInterval(() => this.checkProviderHealth(), interval);
    }

    // Get current status of all providers
    getStatus() {
        return Object.entries(this.providers).map(([name, _]) => ({
            provider: name,
            healthy: this.healthStatus[name],
            rateLimit: this.rateLimits[name]
        }));
    }
}

export default Orchestrator;

