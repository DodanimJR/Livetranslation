import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

let wss: WebSocketServer;

/**
 * Initialise a WebSocket server that broadcasts transcript entries
 * to every connected viewer (the "Miembros" tab on any device).
 *
 * Protocol (server → client):
 *   { type: "entry",  data: TranscriptEntry }
 *   { type: "status", data: { isLive: boolean } }
 *   { type: "clear" }
 */
export function initBroadcastServer(server: http.Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log(`[broadcast] viewer connected  (total: ${wss.clients.size})`);

    // Tell the new client whether a session is currently live
    ws.send(JSON.stringify({ type: 'status', data: { isLive } }));

    // Send the full transcript history so late-joiners see everything
    for (const entry of entryHistory) {
      ws.send(JSON.stringify({ type: 'entry', data: entry }));
    }

    ws.on('close', () => {
      console.log(`[broadcast] viewer disconnected (total: ${wss.clients.size})`);
    });
  });

  console.log('[broadcast] WebSocket server ready on /ws');
  return wss;
}

// ── state kept in memory ────────────────────────────────────

let isLive = false;
const entryHistory: any[] = [];

/**
 * Called by the admin route when a new transcript entry arrives.
 * Stores it in history and broadcasts to every connected viewer.
 */
export function broadcastEntry(entry: any): void {
  entryHistory.push(entry);
  broadcast({ type: 'entry', data: entry });
}

/**
 * Called when the admin starts or stops the broadcast session.
 */
export function broadcastStatus(live: boolean): void {
  isLive = live;
  if (!live) {
    // Clear history when session ends so next session starts fresh
    entryHistory.length = 0;
  }
  broadcast({ type: 'status', data: { isLive: live } });
}

/**
 * Clear all entries (e.g. admin pressed clear).
 */
export function broadcastClear(): void {
  entryHistory.length = 0;
  broadcast({ type: 'clear' });
}

// ── helpers ─────────────────────────────────────────────────

function broadcast(msg: any): void {
  if (!wss) return;
  const payload = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
