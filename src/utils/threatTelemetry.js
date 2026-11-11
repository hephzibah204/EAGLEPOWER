export function normalizeThreatTelemetry(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const bannedIps = Array.isArray(data.bannedIps) ? data.bannedIps : Array.isArray(data.banned_ips) ? data.banned_ips : [];
  return {
    ...data,
    bannedIps,
    totalTracked: Number(data.totalTracked ?? data.totalTrackedIps ?? 0) || 0,
    totalBanned: Number(data.totalBanned ?? data.banned_ips_count ?? bannedIps.length) || 0,
  };
}
