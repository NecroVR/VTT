export interface ChatMessage {
  id: string;
  gameId: string;
  userId?: string | null;
  // Content
  content: string;
  messageType: string;
  speaker?: Record<string, unknown> | null;
  // Roll data (if messageType = 'roll')
  rollData?: Record<string, unknown> | null;
  // Whisper targets
  whisperTargets?: Record<string, unknown> | null;
  blind: boolean;
  // Metadata
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface CreateChatMessageRequest {
  gameId: string;
  userId?: string | null;
  content: string;
  messageType?: string;
  speaker?: Record<string, unknown> | null;
  rollData?: Record<string, unknown> | null;
  whisperTargets?: Record<string, unknown> | null;
  blind?: boolean;
  data?: Record<string, unknown>;
}

export interface ChatMessageResponse {
  chatMessage: ChatMessage;
}

export interface ChatMessagesListResponse {
  chatMessages: ChatMessage[];
}
