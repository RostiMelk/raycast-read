import { showHUD } from "@raycast/api";
import { isPlaying, stopPlayback } from "./lib/playback";

export default async function Command() {
  const wasPlaying = isPlaying();
  stopPlayback();
  await showHUD(wasPlaying ? "Stopped reading" : "Nothing is playing");
}
