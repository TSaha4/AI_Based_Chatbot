// In dev, use same-origin requests so Vite proxies /api to the backend (avoids CORS).
// Set VITE_API_BASE_URL in production to your deployed backend URL.
const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8000");

export type AdminOverviewResponse = {
  health: {
    status: string;
    database: string;
    services: {
      nlp: string;
      embedding_model: string;
      gemini_configured: boolean;
      vector_index: string;
    };
  };
  collections: Record<string, number>;
  total_tickets: number;
  pending_tickets: number;
  resolved_tickets: number;
  knowledge_base_count: number;
  analytics_count: number;
  recent_queries: Array<{
    query: string;
    mapped_topic: string | null;
    similarity_score: number;
    frequency: number;
    timestamp: string;
  }>;
  recent_tickets: Array<{
    ticket_id: string;
    question: string;
    email: string | null;
    status: string;
    created_at: string;
    session_id: string | null;
    answer?: string | null;
    resolved_by?: string | null;
  }>;
};

export type AdminLoginResponse = {
  authenticated: boolean;
  admin_id: string | null;
  name: string | null;
  email: string | null;
  department?: string | null;
  employee_id?: string | null;
};

export type TicketRecord = {
  ticket_id: string;
  question: string;
  email: string | null;
  status: string;
  created_at: string;
  resolved_at?: string | null;
  session_id: string | null;
  answer?: string | null;
  resolved_by?: string | null;
};

export type AnalyticsRecord = {
  query: string;
  mapped_topic: string | null;
  similarity_score: number;
  frequency: number;
  timestamp: string;
};

export type ResolveTicketResponse = {
  ticket_id: string;
  status: string;
  email_sent: boolean;
  stored_in_admin_resolutions: boolean;
  resolved_at: string;
};

export type UploadKnowledgeResponse = {
  message: string;
  source_document: string;
  chunks_stored: number;
  collection: string;
};

export class BackendApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

async function readJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${DEFAULT_BASE_URL}${path}`);
  } catch {
    throw new BackendApiError(
      "Cannot reach backend. Start the API server on port 8000.",
      0,
    );
  }
  if (!response.ok) {
    throw new BackendApiError(`Request failed: ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

export async function fetchAdminOverview() {
  return readJson<AdminOverviewResponse>("/api/chat/admin/overview");
}

export async function fetchAnalytics(limit = 20) {
  return readJson<AnalyticsRecord[]>(`/api/chat/analytics?limit=${limit}`);
}

export async function fetchTickets(limit = 20, status?: string) {
  const query = status ? `?status=${status}&limit=${limit}` : `?limit=${limit}`;
  return readJson<TicketRecord[]>(`/api/chat/tickets${query}`);
}

export async function fetchPendingTickets(limit = 50) {
  return readJson<TicketRecord[]>(`/api/chat/tickets?status=pending&limit=${limit}`);
}

export async function loginAdmin(username: string, password: string) {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/chat/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new BackendApiError(`Login failed: ${response.status}`, response.status);
  }
  return response.json() as Promise<AdminLoginResponse>;
}

export async function signupAdmin(adminData: {
  name: string;
  department: string;
  employee_id: string;
  email: string;
  password: string;
}) {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/chat/admin/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(adminData),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new BackendApiError(errData.detail || `Signup failed: ${response.status}`, response.status);
  }
  return response.json();
}

export async function resolveTicket(ticketId: string, answer: string, resolvedBy = "admin") {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/chat/tickets/${ticketId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      answer,
      resolved_by: resolvedBy,
    }),
  });
  if (!response.ok) {
    throw new BackendApiError(`Resolve failed: ${response.status}`, response.status);
  }
  return response.json() as Promise<ResolveTicketResponse>;
}

export async function uploadKnowledgePdf(file: File, topic?: string) {
  const formData = new FormData();
  formData.append("file", file);
  const query = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  const response = await fetch(`${DEFAULT_BASE_URL}/api/chat/upload${query}`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new BackendApiError(`Upload failed: ${response.status}`, response.status);
  }
  return response.json() as Promise<UploadKnowledgeResponse>;
}
