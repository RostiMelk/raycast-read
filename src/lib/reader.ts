import { getPreferenceValues } from "@raycast/api";
import { splitIntoChunks } from "./chunk";
import { supportsNeighborText, synthesize } from "./elevenlabs";
import { startPlayback } from "./playback";
import { resolveVoiceId } from "./voice";

type ReadOptions = {
  /** Called right before each chunk starts playing. */
  onChunk?: (index: number, total: number) => void;
};

/**
 * Splits the text into chunks and plays them in order. The next chunk is generated while the current
 * one plays, so audio starts after the first short chunk and never waits on the rest of the text.
 */
export async function readAloud(text: string, { onChunk }: ReadOptions = {}) {
  const { model, speed } = getPreferenceValues<ExtensionPreferences>();
  const voiceId = await resolveVoiceId();
  const chunks = splitIntoChunks(text);
  const playback = await startPlayback();
  const abort = new AbortController();

  const generate = (index: number) =>
    synthesize({
      text: chunks[index],
      voiceId,
      modelId: model,
      signal: abort.signal,
      ...(supportsNeighborText(model) && { previousText: chunks[index - 1], nextText: chunks[index + 1] }),
    });

  try {
    let pending = generate(0);
    for (let index = 0; index < chunks.length; index++) {
      const audio = await pending;
      if (!playback.isActive()) return;

      if (index + 1 < chunks.length) {
        pending = generate(index + 1);
        // Stops an "unhandled rejection" if playback ends before we await this. Awaiting it still throws.
        pending.catch(() => undefined);
      }

      onChunk?.(index, chunks.length);
      await playback.play(audio, Number(speed));
      if (!playback.isActive()) return;
    }
  } finally {
    abort.abort();
    await playback.end();
  }
}
