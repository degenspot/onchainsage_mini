import { AIProvider, AIProviderConfig, AIProviderType } from './ai-provider';
import { RuleBasedProvider } from './providers/rule-based-provider';
import { HuggingFaceProvider } from './providers/huggingface-provider';
import { AimlAPIProvider } from './providers/aimlapi-provider';
import { OpenAIProvider } from './providers/openai-provider';

class AIProviderFactory {
    private static instance: AIProviderFactory;
    private providers: Map<AIProviderType, AIProvider> = new Map();
    private healthStatus: Map<AIProviderType, boolean> = new Map();

    private constructor() {
        this.initProviders();
        this.startHealthChecks();
    }

    public static getInstance(): AIProviderFactory {
        if (!AIProviderFactory.instance) {
            AIProviderFactory.instance = new AIProviderFactory();
        }
        return AIProviderFactory.instance;
    }

    public static _resetForTests() {
        AIProviderFactory.instance = undefined as any;
    }

    private initProviders() {
        // Initialize providers based on environment configuration
        this.providers.set('rule-based', new RuleBasedProvider());

        if (process.env.HUGGINGFACE_API_KEY) {
            this.providers.set('huggingface', new HuggingFaceProvider({ apiKey: process.env.HUGGINGFACE_API_KEY }));
        }
        if (process.env.AIMLAPI_API_KEY) {
            this.providers.set('aimlapi', new AimlAPIProvider({ apiKey: process.env.AIMLAPI_API_KEY }));
        }
        if (process.env.OPENAI_API_KEY) {
            this.providers.set('openai', new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }));
        }
    }

    public createProvider(type: AIProviderType, config?: AIProviderConfig): AIProvider {
        switch (type) {
            case 'huggingface':
                return new HuggingFaceProvider(config);
            case 'aimlapi':
                return new AimlAPIProvider(config);
            case 'openai':
                return new OpenAIProvider(config);
            case 'rule-based':
            default:
                return new RuleBasedProvider();
        }
    }

    public getDefaultProvider(): AIProvider {
        const providerType = (process.env.AI_PROVIDER as AIProviderType) || 'rule-based';
        const provider = this.providers.get(providerType);

        if (provider && this.healthStatus.get(providerType) !== false) {
            return provider;
        }

        if (process.env.AI_FALLBACK_ENABLED !== 'false') {
            return this.getFallbackProvider();
        }
        
        throw new Error(`AI provider '${providerType}' is not available or unhealthy.`);
    }

    public getFallbackProvider(): AIProvider {
        return this.providers.get('rule-based')!;
    }

    private startHealthChecks() {
        if (process.env.AI_HEALTH_CHECK_ENABLED === 'false') {
            return;
        }
        const interval = parseInt(process.env.AI_HEALTH_CHECK_INTERVAL || '300000', 10);
        setInterval(() => this.runHealthChecks(), interval);
    }

    private async runHealthChecks() {
        for (const [type, provider] of this.providers.entries()) {
            if (type === 'rule-based') {
                this.healthStatus.set(type, true);
                continue;
            }
            try {
                // Simple health check: try to generate a thesis with dummy data
                await provider.generateThesis({ price: 0, liquidity: 0, volume24h: 0 }, [], { themes: [], sentiment: 0, momentum: 0, coherence: 0 });
                this.healthStatus.set(type, true);
            } catch (error) {
                this.healthStatus.set(type, false);
                console.error(`Health check failed for ${type}:`, error);
            }
        }
    }

    public switchProvider(type: AIProviderType): void {
        if (!this.providers.has(type)) {
            const config = this.deriveConfigFromEnv(type);
            this.providers.set(type, this.createProvider(type, config));
        }
        process.env.AI_PROVIDER = type;
    }

    public getAllProviders(): Map<AIProviderType, AIProvider> {
        return this.providers;
    }

    private deriveConfigFromEnv(type: AIProviderType): AIProviderConfig {
        switch (type) {
            case 'huggingface':
                return { apiKey: process.env.HUGGINGFACE_API_KEY, model: process.env.HUGGINGFACE_MODEL };
            case 'aimlapi':
                return { apiKey: process.env.AIMLAPI_API_KEY, model: process.env.AIMLAPI_MODEL };
            case 'openai':
                return { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL };
            default:
                return {};
        }
    }
}

export const getAIProvider = (): AIProvider => {
    return AIProviderFactory.getInstance().getDefaultProvider();
};

export { AIProviderFactory };
