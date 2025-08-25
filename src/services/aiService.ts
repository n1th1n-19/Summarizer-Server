import { openai } from '../config/openrouter';

export class AIService {
  async summarizeText(text: string, maxTokens: number = 1000): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "system",
            content: "You are an expert research paper summarizer. Provide concise, accurate summaries that capture the main findings, methodology, and conclusions."
          },
          {
            role: "user",
            content: `Please summarize the following research paper text:\n\n${text}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || "Summary not available";
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async chatWithDocument(documentText: string, userMessage: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users understand research papers. Use the following document content to answer questions accurately:\n\n${documentText.slice(0, 3000)}...`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 800,
        temperature: 0.8
      });

      return completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Chat error:', error);
      throw new Error('Failed to process chat message');
    }
  }

  async generateKeywords(text: string): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "system",
            content: "Extract 5-10 key terms and phrases from the following research paper text. Return them as a comma-separated list."
          },
          {
            role: "user",
            content: text.slice(0, 2000)
          }
        ],
        max_tokens: 200,
        temperature: 0.5
      });

      const response = completion.choices[0]?.message?.content || "";
      return response.split(',').map(keyword => keyword.trim()).filter(Boolean);
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return [];
    }
  }
}

export default new AIService();