export type Answer = {
  id: string;
  tool:
    | 'recap_recent'
    | 'who_is_on_screen'
    | 'ask_about_show'
    | 'whats_playing';
  question?: string;
  text: string;
  ageMs: number;
};

type Server = {
  apiUrl: string;
  deviceKey: string;
  householdId: string;
};

const REQUEST_TIMEOUT_MS = 4000;

// Asks the server for the last answer Alexa gave in this household. Throws when
// the server can't be reached or turns down the device key.
export async function fetchAnswer({
  apiUrl,
  deviceKey,
  householdId,
}: Server): Promise<Answer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${apiUrl}/v1/playback/${householdId}/answer`,
      {
        headers: {Authorization: `Bearer ${deviceKey}`},
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new Error(`The server answered ${response.status}`);
    }
    const body: {answer: Answer | null} = await response.json();
    return body.answer;
  } finally {
    clearTimeout(timeout);
  }
}
