const segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });

type ChunkLimits = {
  /** Keep the first chunk short so audio starts quickly. */
  firstMax?: number;
  max?: number;
};

export function splitIntoChunks(text: string, { firstMax = 300, max = 1500 }: ChunkLimits = {}): string[] {
  const chunks: string[] = [];
  let current = "";
  const limit = () => (chunks.length === 0 ? firstMax : max);

  for (const { segment } of segmenter.segment(text)) {
    const pieces = segment.length <= limit() ? [segment] : segment.split(/(?<=\s)/);
    for (const piece of pieces) {
      if (current && current.length + piece.length > limit()) {
        chunks.push(current.trim());
        current = "";
      }
      current += piece;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
