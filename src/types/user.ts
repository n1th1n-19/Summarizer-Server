// User type definitions (replacing Prisma types)

export interface User {
  id: number;
  email: string;
  passwordHash: string | null;
  googleId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  googleId: string;
  name: string;
  avatarUrl?: string | null;
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  googleId?: string;
}

export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Document {
  id: number;
  userId: number;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string | null;
  extractedText: string | null;
  summary: string | null;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: number;
  userId: number;
  documentId: number;
  sessionName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  message: string;
  response: string;
  createdAt: Date;
}