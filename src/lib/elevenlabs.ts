import { getPreferenceValues } from "@raycast/api";
import { z } from "zod";

const API_URL = "https://api.elevenlabs.io";

export class ElevenLabsError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const errorBodySchema = z.object({
  detail: z.union([z.string(), z.object({ message: z.string() }), z.array(z.object({ msg: z.string() }))]),
});

async function readErrorMessage(response: Response): Promise<string> {
  const body = errorBodySchema.safeParse(await response.json().catch(() => undefined));
  if (!body.success) return response.statusText || `Request failed (HTTP ${response.status})`;

  const { detail } = body.data;
  if (typeof detail === "string") return detail;
  return Array.isArray(detail) ? detail.map((issue) => issue.msg).join(", ") : detail.message;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const { apiKey } = getPreferenceValues<ExtensionPreferences>();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new ElevenLabsError(response.status, await readErrorMessage(response));
  return response;
}

/** Only the v2 family accepts `previous_text` / `next_text`. `eleven_v3` rejects them with a 400. */
export const supportsNeighborText = (modelId: string) => /^eleven_(flash|multilingual|turbo)_v2/.test(modelId);

type SynthesizeOptions = {
  text: string;
  voiceId: string;
  modelId: string;
  previousText?: string;
  nextText?: string;
  signal?: AbortSignal;
};

export async function synthesize({ text, voiceId, modelId, previousText, nextText, signal }: SynthesizeOptions) {
  const response = await request(`/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    signal,
    body: JSON.stringify({ text, model_id: modelId, previous_text: previousText, next_text: nextText }),
  });
  return new Uint8Array(await response.arrayBuffer());
}

const voiceSchema = z.object({
  voice_id: z.string(),
  name: z.string().default("Untitled voice"),

  description: z.string().nullish(),
  preview_url: z.string().nullish(),
  labels: z.record(z.string(), z.string()).default({}),
});

const voicesPageSchema = z.object({
  voices: z.array(voiceSchema),
  has_more: z.boolean(),
  next_page_token: z.string().nullish(),
});

export type Voice = z.infer<typeof voiceSchema>;

type SearchVoicesOptions = {
  search?: string;
  pageToken?: string;
  pageSize?: number;
  voiceType?: "default" | "personal" | "community" | "workspace";
};

export async function searchVoices({ search, pageToken, pageSize = 25, voiceType }: SearchVoicesOptions = {}) {
  const params = new URLSearchParams({ page_size: String(pageSize), include_total_count: "false" });
  if (search) params.set("search", search);
  if (pageToken) params.set("next_page_token", pageToken);
  if (voiceType) params.set("voice_type", voiceType);

  const response = await request(`/v2/voices?${params}`);
  return voicesPageSchema.parse(await response.json());
}
