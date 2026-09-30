import { LocalStorage } from "@raycast/api";
import { searchVoices } from "./elevenlabs";

export const VOICE_STORAGE_KEY = "voiceId";

/** The voice picked in "Select Voice", or the first built-in voice so the very first run just works. */
export async function resolveVoiceId(): Promise<string> {
  const stored = await LocalStorage.getItem<string>(VOICE_STORAGE_KEY);
  if (stored) return stored;

  const { voices } = await searchVoices({ voiceType: "default", pageSize: 1 });
  if (!voices[0]) throw new Error("No voices available. Run Select Voice to pick one.");
  return voices[0].voice_id;
}
