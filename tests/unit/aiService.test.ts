import aiService from '../../src/services/aiService';
import { openai } from '../../src/config/openrouter';

// Mock the OpenAI client
jest.mock('../../src/config/openrouter');
const mockOpenAI = openai as jest.Mocked<typeof openai>;

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('summarizeText', () => {
    it('should generate a summary successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'This is a test summary' } }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const text = 'This is a long text that needs to be summarized.';
      const summary = await aiService.summarizeText(text);

      expect(summary).toBe('This is a test summary');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert research paper summarizer. Provide concise, accurate summaries that capture the main findings, methodology, and conclusions.'
          },
          {
            role: 'user',
            content: `Please summarize the following research paper text:\n\n${text}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const text = 'Test text';
      
      await expect(aiService.summarizeText(text)).rejects.toThrow('Failed to generate summary');
    });

    it('should return default message when no content is returned', async () => {
      const mockResponse = {
        choices: [{ message: { content: null } }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const text = 'Test text';
      const summary = await aiService.summarizeText(text);

      expect(summary).toBe('Summary not available');
    });
  });

  describe('chatWithDocument', () => {
    it('should generate chat response successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'This is a chat response' } }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const documentText = 'Document content for chat';
      const userMessage = 'What is this document about?';
      const response = await aiService.chatWithDocument(documentText, userMessage);

      expect(response).toBe('This is a chat response');
    });

    it('should handle long document text by truncating', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const longText = 'a'.repeat(5000);
      const userMessage = 'Question';
      
      await aiService.chatWithDocument(longText, userMessage);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining(longText.slice(0, 3000))
            })
          ])
        })
      );
    });
  });

  describe('generateKeywords', () => {
    it('should extract keywords successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'keyword1, keyword2, keyword3' } }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const text = 'This is text with various important keywords and concepts.';
      const keywords = await aiService.generateKeywords(text);

      expect(keywords).toEqual(['keyword1', 'keyword2', 'keyword3']);
    });

    it('should handle empty response gracefully', async () => {
      const mockResponse = {
        choices: [{ message: { content: '' } }]
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const text = 'Test text';
      const keywords = await aiService.generateKeywords(text);

      expect(keywords).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const text = 'Test text';
      const keywords = await aiService.generateKeywords(text);

      expect(keywords).toEqual([]);
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding successfully', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      const mockResponse = {
        data: [{ embedding: mockEmbedding }]
      };
      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse as any);

      const text = 'Text to embed';
      const embedding = await aiService.generateEmbedding(text);

      expect(embedding).toEqual(mockEmbedding);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: text
      });
    });

    it('should handle long text by truncating', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      const mockResponse = {
        data: [{ embedding: mockEmbedding }]
      };
      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse as any);

      const longText = 'a'.repeat(10000);
      await aiService.generateEmbedding(longText);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: longText.slice(0, 8000)
      });
    });

    it('should handle API errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));

      const text = 'Test text';
      
      await expect(aiService.generateEmbedding(text)).rejects.toThrow('Failed to generate embedding');
    });
  });
});