import { openExtensionPreferences, showToast, Toast } from "@raycast/api";
import { ElevenLabsError } from "./elevenlabs";

function describe(error: unknown): Toast.Options {
  const message = error instanceof Error ? error.message : String(error);

  // ElevenLabs answers bad keys and used-up quotas with 401, and the message says which one.
  if (error instanceof ElevenLabsError && error.status === 401) {
    return {
      style: Toast.Style.Failure,
      title: "ElevenLabs rejected the request",
      message,
      primaryAction: { title: "Open Extension Preferences", onAction: () => openExtensionPreferences() },
    };
  }

  return {
    style: Toast.Style.Failure,
    title: error instanceof ElevenLabsError ? "ElevenLabs error" : "Couldn't read aloud",
    message,
  };
}

/** Shows the error as a failure toast, reusing `toast` when a progress toast is already on screen. */
export async function showFailure(error: unknown, toast?: Toast) {
  const options = describe(error);
  if (!toast) return showToast(options);

  toast.style = Toast.Style.Failure;
  toast.title = options.title;
  toast.message = options.message;
  toast.primaryAction = options.primaryAction;
  return toast;
}
