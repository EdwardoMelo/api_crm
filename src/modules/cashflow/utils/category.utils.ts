export function mergeDistinctCategories(values: (string | null | undefined)[]): string[] {
  const canonicalByKey = new Map<string, string>();

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (!canonicalByKey.has(key)) {
      canonicalByKey.set(key, trimmed);
    }
  }

  return Array.from(canonicalByKey.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
