import type { AppModule, OperationalProfile } from '@/types/wasteManagement';

export type LegalScope = 'estatal' | 'ue' | 'ccaa' | 'plataforma';

export type LegalRetrievalMode = 'hybrid' | 'local_fallback';

export interface LegalSourceCitation {
  chunkId: string;
  documentCode: string;
  documentTitle: string;
  articleRef: string;
  sectionTitle: string;
  excerpt: string;
  boeUrl?: string | null;
  appPath?: string | null;
  appPathLabel?: string | null;
  ambito: LegalScope;
  ccaa?: string | null;
  score: number;
}

export interface LegalChunkRecord {
  chunkId: string;
  documentCode: string;
  documentTitle: string;
  ambito: LegalScope;
  ccaa?: string | null;
  boeUrl?: string | null;
  appPath?: string | null;
  appPathLabel?: string | null;
  articleRef: string;
  sectionTitle: string;
  content: string;
  score: number;
}

export interface LegalChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface LegalAssistantRequest {
  question: string;
  history?: LegalChatHistoryItem[];
  pathname?: string;
  perfilOperativo?: OperationalProfile;
  region?: string;
  companyId?: number | null;
  activeModules?: AppModule[];
}

export interface LegalAssistantResponse {
  logId: string | null;
  answer: string;
  sources: LegalSourceCitation[];
  model: string;
  retrievalMode: LegalRetrievalMode;
  demoMode: boolean;
  disclaimer: string;
}

export interface LegalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: LegalSourceCitation[];
  logId?: string | null;
  feedback?: -1 | 1 | null;
  retrievalMode?: LegalRetrievalMode;
  demoMode?: boolean;
  createdAt: string;
}

export interface LegalFeedbackRequest {
  logId: string;
  feedback: -1 | 1;
}
