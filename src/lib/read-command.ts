import { showHUD, showToast, Toast } from "@raycast/api";
import { showFailure } from "./failure";
import { isPlaying, stopPlayback } from "./playback";
import { readAloud } from "./reader";

/** Shared body of the "Read …" commands. Running one while audio plays stops it. */
export async function runReadCommand(getText: () => Promise<string>) {
  if (isPlaying()) {
    stopPlayback();
    return showHUD("Stopped reading");
  }

  const toast = await showToast({ style: Toast.Style.Animated, title: "Generating speech…" });

  try {
    const text = await getText();
    toast.primaryAction = { title: "Stop Reading", onAction: () => stopPlayback() };

    await readAloud(text, {
      onChunk: (index, total) => {
        toast.title = "Reading aloud";
        toast.message = total > 1 ? `Part ${index + 1} of ${total}` : undefined;
      },
    });
    await toast.hide();
  } catch (error) {
    await showFailure(error, toast);
  }
}
