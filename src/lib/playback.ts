import { environment } from "@raycast/api";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Raycast has no audio API, so we play with macOS `afplay`. Every command runs in its own process,
 * so a small state file lets "Stop Reading" (or a second "Read Selection") find and stop the audio.
 */
type State = { id: string; ownerPid: number; playerPid?: number };

const stateFile = join(environment.supportPath, "playback.json");

function readState(): State | undefined {
  try {
    // Only this module writes the file, so the shape is known.
    return JSON.parse(readFileSync(stateFile, "utf8")) as State;
  } catch {
    return undefined;
  }
}

function writeState(state: State) {
  mkdirSync(environment.supportPath, { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state));
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** A crashed command leaves its state file behind, so check that the owner process still exists. */
export function isPlaying() {
  const state = readState();
  return state !== undefined && isAlive(state.ownerPid);
}

export function stopPlayback() {
  const state = readState();
  rmSync(stateFile, { force: true });
  if (!state?.playerPid) return;
  try {
    process.kill(state.playerPid, "SIGTERM");
  } catch {
    // The player already exited.
  }
}

/** Starting a session stops whatever was playing, so only one audio source plays at a time. */
export async function startPlayback() {
  stopPlayback();
  const id = randomUUID();
  const dir = await mkdtemp(join(tmpdir(), "read-aloud-"));
  writeState({ id, ownerPid: process.pid });

  const isActive = () => readState()?.id === id;
  let fileCount = 0;

  return {
    isActive,

    async play(audio: Uint8Array, rate = 1) {
      if (!isActive()) return;
      const file = join(dir, `${fileCount++}.mp3`);
      await writeFile(file, audio);

      await new Promise<void>((resolve, reject) => {
        const player = spawn("afplay", ["--rate", String(rate), "--rQuality", "1", file], { stdio: "ignore" });
        writeState({ id, ownerPid: process.pid, playerPid: player.pid });
        player.once("error", reject);
        player.once("close", () => resolve());
      });
    },

    async end() {
      if (isActive()) rmSync(stateFile, { force: true });
      await rm(dir, { recursive: true, force: true });
    },
  };
}
