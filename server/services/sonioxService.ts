import axios from 'axios';

const SONIOX_API_KEY = process.env.SONIOX_API_KEY || '';
const SONIOX_API_URL = process.env.SONIOX_API_URL || 'https://api.soniox.com';

if (!SONIOX_API_KEY) {
  console.warn('⚠️  SONIOX_API_KEY not configured. Transcription features will not work.');
}

interface CreateSessionRequest {
  audioModel?: string;
  languageCode?: string;
  enableTranslation?: boolean;
  translationLanguageCode?: string;
}

interface CreateSessionResponse {
  sessionId: string;
  clientUuid?: string;
}

/**
 * Create a new Soniox transcription session
 */
export async function createSonioxSession(
  config: CreateSessionRequest
): Promise<CreateSessionResponse> {
  try {
    const payload = {
      ...config,
      audioModel: config.audioModel || 'default',
      languageCode: config.languageCode || 'es',
      enableTranslation: config.enableTranslation !== false,
      translationLanguageCode: config.translationLanguageCode || 'en',
    };

    const response = await axios.post<CreateSessionResponse>(
      `${SONIOX_API_URL}/v1/sessions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${SONIOX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Soniox API Error: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Get session details
 */
export async function getSonioxSession(sessionId: string) {
  try {
    const response = await axios.get(
      `${SONIOX_API_URL}/v1/sessions/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${SONIOX_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get session: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * End a transcription session
 */
export async function endSonioxSession(sessionId: string) {
  try {
    const response = await axios.post(
      `${SONIOX_API_URL}/v1/sessions/${sessionId}/end`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${SONIOX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to end session: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Get WebSocket URL for real-time streaming
 */
export function getSonioxWebSocketUrl(sessionId: string): string {
  const protocol = SONIOX_API_URL.startsWith('https') ? 'wss' : 'ws';
  const baseUrl = SONIOX_API_URL.replace(/^https?:\/\//, '');
  return `${protocol}://${baseUrl}/v1/sessions/${sessionId}/stream?key=${SONIOX_API_KEY}`;
}
