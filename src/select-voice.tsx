import { Action, ActionPanel, Icon, List, showHUD, showToast, Toast } from "@raycast/api";
import { useCachedPromise, useLocalStorage } from "@raycast/utils";
import { startCase } from "es-toolkit";
import { useState } from "react";
import { searchVoices } from "./lib/elevenlabs";
import { showFailure } from "./lib/failure";
import { startPlayback, stopPlayback } from "./lib/playback";
import { VOICE_STORAGE_KEY } from "./lib/voice";

async function previewVoice(name: string, previewUrl: string) {
  const toast = await showToast({ style: Toast.Style.Animated, title: `Playing ${name}` });
  const playback = await startPlayback();
  try {
    const response = await fetch(previewUrl);
    if (!response.ok) throw new Error(`Couldn't load the preview (HTTP ${response.status}).`);
    await playback.play(new Uint8Array(await response.arrayBuffer()));
    await toast.hide();
  } catch (error) {
    await showFailure(error, toast);
  } finally {
    await playback.end();
  }
}

export default function Command() {
  const [search, setSearch] = useState("");
  const { value: selectedId, setValue: setSelectedId } = useLocalStorage<string>(VOICE_STORAGE_KEY);

  const { data, isLoading, pagination } = useCachedPromise(
    (query: string) =>
      async ({ cursor }: { cursor?: string }) => {
        const page = await searchVoices({ search: query, pageToken: cursor });
        return { data: page.voices, hasMore: page.has_more, cursor: page.next_page_token ?? undefined };
      },
    [search],
    { keepPreviousData: true },
  );

  async function chooseVoice(voiceId: string, name: string) {
    stopPlayback();
    await setSelectedId(voiceId);
    await showHUD(`Reading voice set to ${name}`);
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      throttle
      pagination={pagination}
      onSearchTextChange={setSearch}
      searchBarPlaceholder="Search voices by name, accent, or style…"
    >
      <List.EmptyView title="No voices found" description="Try a different search." />
      {data?.map((voice) => {
        const { preview_url: previewUrl } = voice;
        return (
          <List.Item
            key={voice.voice_id}
            title={voice.name}
            icon={voice.voice_id === selectedId ? Icon.CheckCircle : Icon.Circle}
            detail={
              <List.Item.Detail
                markdown={voice.description ?? undefined}
                metadata={
                  <List.Item.Detail.Metadata>
                    {Object.entries(voice.labels).map(([key, value]) => (
                      <List.Item.Detail.Metadata.Label key={key} title={startCase(key)} text={startCase(value)} />
                    ))}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action
                  title="Use This Voice"
                  icon={Icon.Check}
                  onAction={() => chooseVoice(voice.voice_id, voice.name)}
                />
                {previewUrl && (
                  <Action
                    title="Play Preview"
                    icon={Icon.SpeakerOn}
                    shortcut={{ modifiers: ["cmd"], key: "return" }}
                    onAction={() => previewVoice(voice.name, previewUrl)}
                  />
                )}
                <Action
                  title="Stop Playback"
                  icon={Icon.Stop}
                  shortcut={{ modifiers: ["cmd", "opt"], key: "s" }}
                  onAction={() => stopPlayback()}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
