import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export const initializeOpenAI = (apiKey: string) => {
    if (!openaiInstance) {
        openaiInstance = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Required for client-side usage
        });
    }
    return openaiInstance;
};

export const getOpenAIInstance = (): OpenAI | null => {
    return openaiInstance;
}; 