// llama.cpp Types

export interface LlamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlamaChatRequest {
  model: string;
  messages: LlamaMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string[];
}

export interface LlamaChatResponse {
  model: string;
  choices: LlamaChoice[];
  usage: LlamaUsage;
}

export interface LlamaChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface LlamaUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LlamaModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  meta: {
    vocab_type: number;
    n_vocab: number;
    n_ctx_train: number;
    n_embd: number;
    n_params: number;
    size: number;
  };
}

export interface LlamaModelsResponse {
  models: LlamaModelInfo[];
  object: string;
  data: LlamaModelInfo[];
}

export interface LlamaHealthResponse {
  status: string;
  uptime: number;
  backend: string;
}
