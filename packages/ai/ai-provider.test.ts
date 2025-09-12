import { AIProviderFactory, getAIProvider } from './ai-provider-factory';
import { RuleBasedProvider } from './providers/rule-based-provider';
import { OpenAIProvider } from './providers/openai-provider';

describe('AIProviderFactory', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        AIProviderFactory._resetForTests();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return RuleBasedProvider by default', () => {
        const provider = getAIProvider();
        expect(provider).toBeInstanceOf(RuleBasedProvider);
    });

    it('should return OpenAIProvider when configured', () => {
        process.env.AI_PROVIDER = 'openai';
        process.env.OPENAI_API_KEY = 'test-key';
        const provider = getAIProvider();
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should fallback to RuleBasedProvider if configured provider fails', () => {
        process.env.AI_PROVIDER = 'openai';
        // No API key provided, so it should fail to initialize and fallback
        const factory = AIProviderFactory.getInstance();
        const provider = factory.getDefaultProvider();
        expect(provider).toBeInstanceOf(RuleBasedProvider);
    });

    it('should allow switching providers at runtime', () => {
        process.env.OPENAI_API_KEY = 'test-key';
        const factory = AIProviderFactory.getInstance();
        
        let provider = factory.getDefaultProvider();
        expect(provider).toBeInstanceOf(RuleBasedProvider);

        factory.switchProvider('openai');
        
        provider = factory.getDefaultProvider();
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    // Mocking the providers to test the factory logic without making real API calls
    it('should use the correct provider based on configuration', () => {
        process.env.AI_PROVIDER = 'openai';
        process.env.OPENAI_API_KEY = 'fake-key';

        const factory = AIProviderFactory.getInstance();
        const provider = factory.getDefaultProvider();
        expect(provider).toBeInstanceOf(OpenAIProvider);

        process.env.AI_PROVIDER = 'rule-based';
        factory.switchProvider('rule-based');
        const anotherProvider = factory.getDefaultProvider();
        expect(anotherProvider).toBeInstanceOf(RuleBasedProvider);
    });
});
