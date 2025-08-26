export interface Document {
  id: number;
  userId: number;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string | null;
  extractedText?: string | null;
  summary?: string | null;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface DocumentEmbedding {
  id: number;
  documentId: number;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: number;
  userId: number;
  documentId?: number | null;
  sessionName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  message: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentData {
  userId: number;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string | null;
  extractedText?: string | null;
}

export interface UpdateDocumentData {
  title?: string | null;
  extractedText?: string | null;
  summary?: string | null;
  status?: DocumentStatus | null;
}