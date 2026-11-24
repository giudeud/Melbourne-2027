/**
 * Fetch AUD→BRL from Frankfurter (European Central Bank reference rates, free, no key).
 * Returns null-safe errors so the UI can fall back to manual entry.
 */
export async function fetchAudBrl(): Promise<{ brlPerAud: number; refDate: string }> {
  const endpoints = [
    'https://api.frankfurter.dev/v1/latest?base=AUD&symbols=BRL',
    'https://api.frankfurter.app/latest?from=AUD&to=BRL',
  ];
  let lastErr: unknown = null;
  for (const url of endpoints) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const v = Number(j?.rates?.BRL);
      if (!Number.isFinite(v) || v <= 0) throw new Error('Resposta inválida');
      return { brlPerAud: v, refDate: String(j.date ?? '') };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Não foi possível obter a cotação automaticamente (${lastErr instanceof Error ? lastErr.message : 'erro'}). Informe a cotação manualmente.`);
}
