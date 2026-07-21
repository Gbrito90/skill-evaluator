export function parseFrontmatter(source: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source.trim());
  if (!match) {
    return { frontmatter: {}, body: source };
  }

  const [, rawFrontmatter, body] = match;
  const frontmatter: Record<string, string> = {};

  const lines = rawFrontmatter.split(/\r?\n/);
  let currentKey: string | null = null;
  let blockLines: string[] | null = null;
  let blockIndent: number | null = null;

  function flushBlock() {
    if (currentKey && blockLines) {
      frontmatter[currentKey] = blockLines.join(" ").trim();
    }
    currentKey = null;
    blockLines = null;
    blockIndent = null;
  }

  for (const line of lines) {
    if (blockLines) {
      if (line.trim().length === 0) {
        blockLines.push("");
        continue;
      }
      const indent = /^(\s*)/.exec(line)![1].length;
      if (blockIndent === null) blockIndent = indent;
      if (indent >= blockIndent) {
        blockLines.push(line.slice(blockIndent).trimEnd());
        continue;
      }
      flushBlock();
    }

    const fieldMatch = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line);
    if (!fieldMatch) continue;
    const [, key, rawValue] = fieldMatch;
    const trimmedKey = key.trim();

    if (rawValue.trim() === "|" || rawValue.trim() === ">") {
      currentKey = trimmedKey;
      blockLines = [];
      blockIndent = null;
      continue;
    }

    const value = rawValue.trim().replace(/^["']|["']$/g, "");
    frontmatter[trimmedKey] = value;
  }
  flushBlock();

  return { frontmatter, body };
}
