import type { TranscriptEntry } from '../context/transcriptStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';
const WS_BASE = BACKEND_URL.replace(/^http/, 'ws').replace(/\/api$/, '');

type BroadcastMessage =
  | { type: 'entry'; data: TranscriptEntry }
  | { type: 'status'; data: { isLive: boolean } }
  | { type: 'clear' };

interface BroadcastCallbacks {
  onEntry: (entry: TranscriptEntry) => void;
  onStatus: (isLive: boolean) => void;
  onClear: () => void;
}

/**
 * Connects to the backend WebSocket broadcast server so viewers
 * on any device receive live transcript entries in real-time.
 */
export class BroadcastClient {
  private ws: WebSocket | null = null;
  private callbacks: BroadcastCallbacks | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  connect(callbacks: BroadcastCallbacks): void {
    this.callbacks = callbacks;
    this.shouldReconnect = true;
    this.open();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private open(): void {
    if (this.ws) {
      this.ws.close();
    }

    const url = `${WS_BASE}/ws`;
    console.log('[broadcast-client] connecting to', url);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[broadcast-client] connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: BroadcastMessage = JSON.parse(event.data as string);

        switch (msg.type) {
          case 'entry':
            this.callbacks?.onEntry(msg.data);
            break;
          case 'status':
            this.callbacks?.onStatus(msg.data.isLive);
            break;
          case 'clear':
            this.callbacks?.onClear();
            break;
        }
      } catch (err) {
        console.error('[broadcast-client] failed to parse message:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[broadcast-client] disconnected');
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.open(), 2000);
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this, which triggers reconnect
    };
  }
}

export const broadcastClient = new BroadcastClient();
