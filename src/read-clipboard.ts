import { Clipboard } from "@raycast/api";
import { runReadCommand } from "./lib/read-command";

async function getClipboardText() {
  const text = await Clipboard.readText();
  if (!text?.trim()) throw new Error("Copy some text first, then run this command again.");
  return text;
}

export default function Command() {
  return runReadCommand(getClipboardText);
}
