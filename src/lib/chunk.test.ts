import { expect, test } from "vitest";
import { splitIntoChunks } from "./chunk";

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

test("keeps short text in one chunk", () => {
  expect(splitIntoChunks("Hello there. How are you?")).toEqual(["Hello there. How are you?"]);
});

test("starts with a small chunk, then packs sentences up to the max", () => {
  const sentence = "This is a sentence of moderate length. ";
  const text = sentence.repeat(40);

  const chunks = splitIntoChunks(text, { firstMax: 100, max: 400 });

  expect(chunks[0].length).toBeLessThanOrEqual(100);
  expect(chunks.slice(1).every((chunk) => chunk.length <= 400)).toBe(true);
  expect(squash(chunks.join(" "))).toBe(squash(text));
});

test("breaks a sentence that is longer than the limit on word boundaries", () => {
  const text = "word ".repeat(200).trim();

  const chunks = splitIntoChunks(text, { firstMax: 50, max: 50 });

  expect(chunks.every((chunk) => chunk.length <= 50)).toBe(true);
  expect(squash(chunks.join(" "))).toBe(text);
});

test("returns nothing for whitespace", () => {
  expect(splitIntoChunks("  \n ")).toEqual([]);
});
