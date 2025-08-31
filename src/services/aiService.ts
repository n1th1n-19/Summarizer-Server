import { model } from '../config/gemini';
import { openai } from '../config/openrouter';

export class AIService { 
  private async tryGemini(prompt: string, maxTokens: number = 1000): Promise<string> {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    });
    const response = await result.response;
    return response.text() || "";
  }

  private async tryOpenRouter(prompt: string, maxTokens: number = 1000): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || "";
  }

  async summarizeText(text: string, maxTokens: number = 1000): Promise<string> {
    const prompt = `You are an expert research paper summarizer. Provide concise, accurate summaries that capture the main findings, methodology, and conclusions.

Please summarize the following research paper text:

${text}`;

    try {
      console.log('Attempting summarization with Gemini...');
      const geminiResult = await this.tryGemini(prompt, maxTokens);
      if (geminiResult.trim()) {
        console.log('Summarization successful with Gemini');
        return geminiResult;
      }
    } catch (error) {
      console.warn('Gemini summarization failed:', error);
    }

    try {
      console.log('Attempting summarization with OpenRouter/DeepSeek...');
      const openRouterResult = await this.tryOpenRouter(prompt, maxTokens);
      if (openRouterResult.trim()) {
        console.log('Summarization successful with OpenRouter');
        return openRouterResult;
      }
    } catch (error) {
      console.error('OpenRouter summarization failed:', error);
    }

    throw new Error('Failed to generate summary with both providers');
  }

  async chatWithDocument(documentText: string, userMessage: string): Promise<string> {
    const prompt = `You are an AI assistant that helps users understand research papers. Use the following document content to answer questions accurately:

Document content:
${documentText.slice(0, 3000)}...

User question: ${userMessage}`;

    try {
      console.log('Attempting chat with Gemini...');
      const geminiResult = await this.tryGemini(prompt, 800);
      if (geminiResult.trim()) {
        console.log('Chat successful with Gemini');
        return geminiResult;
      }
    } catch (error) {
      console.warn('Gemini chat failed:', error);
    }

    try {
      console.log('Attempting chat with OpenRouter/DeepSeek...');
      const openRouterResult = await this.tryOpenRouter(prompt, 800);
      if (openRouterResult.trim()) {
        console.log('Chat successful with OpenRouter');
        return openRouterResult;
      }
    } catch (error) {
      console.error('OpenRouter chat failed:', error);
    }

    throw new Error('Failed to process chat message with both providers');
  }

  async generateKeywords(text: string): Promise<string[]> {
    const prompt = `Extract 5-10 key terms and phrases from the following research paper text. Return them as a comma-separated list.

${text.slice(0, 2000)}`;

    try {
      console.log('Attempting keyword extraction with Gemini...');
      const geminiResult = await this.tryGemini(prompt, 200);
      if (geminiResult.trim()) {
        console.log('Keyword extraction successful with Gemini');
        return geminiResult.split(',').map(keyword => keyword.trim()).filter(Boolean);
      }
    } catch (error) {
      console.warn('Gemini keyword extraction failed:', error);
    }

    try {
      console.log('Attempting keyword extraction with OpenRouter/DeepSeek...');
      const openRouterResult = await this.tryOpenRouter(prompt, 200);
      if (openRouterResult.trim()) {
        console.log('Keyword extraction successful with OpenRouter');
        return openRouterResult.split(',').map(keyword => keyword.trim()).filter(Boolean);
      }
    } catch (error) {
      console.error('OpenRouter keyword extraction failed:', error);
    }

    console.warn('Both providers failed for keyword extraction, returning empty array');
    return [];
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Attempting embedding generation with OpenRouter...');
      // Try OpenRouter first for embeddings as Gemini doesn't support embeddings directly
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000), // Limit text length
      });
      
      if (embedding.data && embedding.data[0] && embedding.data[0].embedding) {
        console.log('Embedding generation successful with OpenRouter');
        return embedding.data[0].embedding;
      }
    } catch (error) {
      console.error('OpenRouter embedding generation failed:', error);
    }

    console.warn('Embedding generation failed, returning empty array');
    return [];
  }
}

export default new AIService();