import { getSelectedText } from "@raycast/api";
import { runReadCommand } from "./lib/read-command";

async function getSelection() {
  const selection = await getSelectedText().catch(() => "");
  if (!selection.trim()) throw new Error("Select some text in the front app, then run this command again.");
  return selection;
}

export default function Command() {
  return runReadCommand(getSelection);
}
