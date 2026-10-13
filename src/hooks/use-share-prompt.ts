import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'frogups.share-prompt';
const MIN_SESSIONS = 3;
const REPROMPT_DAYS = 14;

interface SharePromptState {
  optedOut: boolean;
  lastShownAt: string | null;
}

async function loadState(): Promise<SharePromptState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const saved = raw ? (JSON.parse(raw) as Partial<SharePromptState>) : {};

  return {
    optedOut: saved.optedOut === true,
    lastShownAt: typeof saved.lastShownAt === 'string' ? saved.lastShownAt : null,
  };
}

function save(state: SharePromptState): void {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) =>
    console.error('Failed to save share prompt state:', error),
  );
}

// Asks once the user has some sessions behind them, then at most every two weeks unless opted out.
// `blocked` holds the prompt back while another modal is showing.
export function useSharePrompt(sessionCount: number, ready: boolean, blocked: boolean) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!ready || checked || blocked || sessionCount < MIN_SESSIONS) {
      return;
    }

    let active = true;

    loadState()
      .then((state) => {
        if (!active) {
          return;
        }

        setChecked(true);

        const dueAt = state.lastShownAt
          ? new Date(state.lastShownAt).getTime() + REPROMPT_DAYS * 24 * 60 * 60 * 1000
          : 0;

        if (!state.optedOut && Date.now() >= dueAt) {
          save({ ...state, lastShownAt: new Date().toISOString() });
          setVisible(true);
        }
      })
      .catch((error) => console.error('Failed to load share prompt state:', error));

    return () => {
      active = false;
    };
  }, [ready, checked, blocked, sessionCount]);

  const dismiss = useCallback(() => setVisible(false), []);

  const optOut = useCallback(() => {
    setVisible(false);
    save({ optedOut: true, lastShownAt: new Date().toISOString() });
  }, []);

  return { visible, dismiss, optOut };
}
