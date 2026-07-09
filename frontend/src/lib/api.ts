// Typed API fetch client and SSE streaming parser

export interface RouteStep {
  instruction: string;
  distance_meters: number;
  estimated_seconds: number;
  accessible: boolean;
}

export interface RouteResponse {
  path: string[];
  steps: RouteStep[];
  total_distance_meters: number;
  total_estimated_seconds: number;
  accessible_only: boolean;
  congestion_level: 'Low' | 'Medium' | 'High';
  destination_node_id: string;
}

export interface CrowdZoneStatus {
  zone_id: string;
  zone_name: string;
  density_score: number;
  occupancy_percentage: number;
  queue_time_minutes: number;
  status: 'Normal' | 'Crowded' | 'Critical';
}

export interface CrowdStatusResponse {
  zones: CrowdZoneStatus[];
  timestamp: string;
}

export interface OpsSummaryResponse {
  summary: string;
  recommended_actions: string[];
  timestamp: string;
}

export interface TransitOption {
  mode: string;
  name: string;
  duration_minutes: number;
  co2_grams: number;
  accessibility_features: string[];
  recommendation_reason: string;
}

export interface TransitResponse {
  origin: string;
  destination: string;
  options: TransitOption[];
  sustainability_tip: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const metaEnv = (import.meta as any).env;
const API_BASE = (metaEnv?.VITE_API_URL || '').replace(/\/$/, '') || '/api';

/**
 * Custom fetch wrapper to handle errors consistently
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // Try to parse error details
      let errorDetail = 'Unknown API error';
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // ignore
      }
      throw new Error(`${res.status} ${res.statusText}: ${errorDetail}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Network offline or stadium backend server is unreachable.');
    }
    throw err;
  }
}

export const api = {
  getRoute: (currentLocation: string, destinationIntent: string, accessibleOnly: boolean): Promise<RouteResponse> => {
    return apiFetch<RouteResponse>('/navigation/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_location: currentLocation,
        destination_intent: destinationIntent,
        accessible_only: accessibleOnly
      })
    });
  },

  getCrowdStatus: (): Promise<CrowdStatusResponse> => {
    return apiFetch<CrowdStatusResponse>('/crowd/status');
  },

  getOpsSummary: (): Promise<OpsSummaryResponse> => {
    return apiFetch<OpsSummaryResponse>('/ops/summary', {
      method: 'POST'
    });
  },

  getTransitSuggestions: (origin: string): Promise<TransitResponse> => {
    return apiFetch<TransitResponse>(`/transit/suggestions?origin=${encodeURIComponent(origin)}`);
  },

  /**
   * SSE Stream Client for AI Chat Assistant
   */
  streamChat: async (
    messages: ChatMessage[],
    language: string | null,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, language })
      });

      if (!response.ok) {
        throw new Error(`SSE stream failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream reader is not available in browser.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      let active = true;
      while (active) {
        const { done, value } = await reader.read();
        if (done) {
          onDone();
          active = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.substring(6));
              if (data.chunk) {
                onChunk(data.chunk);
              }
            } catch (err) {
              console.error('Failed to parse SSE data block:', err);
            }
          }
        }
      }
    } catch (err: any) {
      onError(err instanceof Error ? err : new Error(err?.message || 'Unknown stream error'));
    }
  }
};
