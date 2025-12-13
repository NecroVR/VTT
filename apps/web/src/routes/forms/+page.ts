import type { PageLoad } from './$types';
import { API_BASE_URL } from '$lib/config/api';
import type { FormDefinition } from '@vtt/shared';

interface GameSystem {
  systemId: string;
  name: string;
  version: string;
  publisher: string;
  description: string;
  type: string;
}

export const load: PageLoad = async ({ fetch }) => {
  try {
    const sessionId = typeof window !== 'undefined'
      ? localStorage.getItem('vtt_session_id')
      : null;

    if (!sessionId) {
      return {
        forms: [],
        gameSystems: [],
        error: 'Not authenticated'
      };
    }

    // Fetch game systems
    const systemsResponse = await fetch(`${API_BASE_URL}/api/v1/game-systems`, {
      headers: {
        'Authorization': `Bearer ${sessionId}`
      }
    });

    if (!systemsResponse.ok) {
      throw new Error('Failed to fetch game systems');
    }

    const systemsData = await systemsResponse.json();
    const gameSystems: GameSystem[] = systemsData.gameSystems || [];

    // Fetch forms for all game systems
    const formsPromises = gameSystems.map(async (system) => {
      const formsResponse = await fetch(
        `${API_BASE_URL}/api/v1/game-systems/${system.systemId}/forms`,
        {
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        }
      );

      if (formsResponse.ok) {
        const formsData = await formsResponse.json();
        return formsData.forms || [];
      }
      return [];
    });

    const formsArrays = await Promise.all(formsPromises);
    const forms: FormDefinition[] = formsArrays.flat();

    return {
      forms,
      gameSystems,
      error: null
    };
  } catch (err) {
    console.error('Failed to load forms:', err);
    return {
      forms: [],
      gameSystems: [],
      error: err instanceof Error ? err.message : 'Failed to load forms'
    };
  }
};
