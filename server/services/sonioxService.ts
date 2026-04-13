import axios from 'axios';

const SONIOX_API_URL = 'https://api.soniox.com';

/**
 * Create a temporary API key for the browser to connect directly
 * to the Soniox WebSocket endpoint.
 *
 * Docs: https://soniox.com/docs/stt/api-reference/auth/create_temporary_api_key
 */
export async function createTemporaryApiKey(apiKey: string): Promise<{
  api_key: string;
  expires_at: string;
}> {
  const response = await axios.post(
    `${SONIOX_API_URL}/v1/auth/temporary-api-key`,
    {
      usage_type: 'transcribe_websocket',
      expires_in_seconds: 3600, // 1 hour
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
