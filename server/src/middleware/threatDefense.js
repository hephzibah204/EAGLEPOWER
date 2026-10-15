import { logAudit } from './audit.js';

/**
 * High-Performance In-Memory Threat Defense & Probe Blocker
 * Automatically detects and blocks malicious vulnerability scanners,
 * directory traversal attacks, exploit payloads, and probes.
 */

// In-memory threat tracking: ip -> { strikes: number, bannedUntil: number }
const ipThreatStore = new Map();

// Periodic cleanup of expired bans and records every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipThreatStore.entries()) {
    if (record.bannedUntil && record.bannedUntil < now) {
      ipThreatStore.delete(ip);
    } else if (!record.bannedUntil && now - record.lastSeen > 3600000) {
      ipThreatStore.delete(ip);
    }
  }
}, 15 * 60 * 1000);

// Known attack signatures and exploit probes
const MALICIOUS_PATH_PATTERNS = [
  /\/\.(?:env|git|svn|hg|bzr|htaccess|htpasswd|ssh|aws|docker)/i,
  /\b(?:wp-admin|wp-login|wp-content|xmlrpc\.php|phpmyadmin|pma|padmin|adminer)\b/i,
  /\b(?:eval-stdin|shell\.php|c99\.php|r57\.php|alfa\.php|wso\.php|cmd\.exe|\/bin\/sh|\/bin\/bash)\b/i,
  /(?:\/etc\/(?:passwd|shadow|hosts|issue)|\/proc\/self\/environ|\/windows\/win\.ini)/i,
  /(?:\.\.[\/\\]|\.\.%2f|\.\.%5c)/i, // Path traversal sequences in URL
  /\0|%00/i // Null byte injection
];

const MALICIOUS_QUERY_PATTERNS = [
  /(?:union\s+(?:all\s+)?select)/i,
  /(?:information_schema|performance_schema)/i,
  /(?:benchmark\s*\(|sleep\s*\(\s*\d+\s*\))/i,
  /<script\b[^>]*>/i,
  /\0|%00/i
];

export function threatDefense(req, res, next) {
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();

  // 1. Check if IP is currently banned
  const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost' || clientIp.includes('127.0.0.1');
  const ipRecord = ipThreatStore.get(clientIp);
  if (!isLocal && ipRecord && ipRecord.bannedUntil && ipRecord.bannedUntil > now) {
    const remainingMinutes = Math.ceil((ipRecord.bannedUntil - now) / 60000);
    return res.status(403).json({
      success: false,
      message: `Access denied. Your IP address has been temporarily blocked for security policy violations. Try again in ${remainingMinutes} minutes.`
    });
  }

  // 2. Scan URL path against known malicious probes
  const rawUrl = decodeURIComponent(req.originalUrl || req.url || '');
  let isThreat = false;
  let threatReason = '';

  for (const pattern of MALICIOUS_PATH_PATTERNS) {
    if (pattern.test(rawUrl)) {
      isThreat = true;
      threatReason = `Malicious URL path pattern detected: ${pattern.toString()}`;
      break;
    }
  }

  // 3. Scan query parameters
  if (!isThreat && req.query) {
    const queryStr = JSON.stringify(req.query);
    for (const pattern of MALICIOUS_QUERY_PATTERNS) {
      if (pattern.test(queryStr)) {
        isThreat = true;
        threatReason = `Malicious query payload pattern detected: ${pattern.toString()}`;
        break;
      }
    }
  }

  // 4. Handle detected threat
  if (isThreat) {
    const current = ipThreatStore.get(clientIp) || { strikes: 0, lastSeen: now };
    current.strikes = (current.strikes || 0) + 1;
    current.lastSeen = now;

    // After 3 strikes, ban external IP for 24 hours
    if (current.strikes >= 3 && !isLocal) {
      current.bannedUntil = now + 24 * 60 * 60 * 1000;
    }
    ipThreatStore.set(clientIp, current);

    // Audit log
    try {
      logAudit(
        req.user?.id || null,
        'SECURITY_THREAT_BLOCKED',
        'WAF',
        `Blocked probe from IP ${clientIp}: ${threatReason} [URL: ${req.originalUrl}]`,
        clientIp
      );
    } catch (_) {}

    return res.status(403).json({
      success: false,
      message: 'Forbidden. Your request violated institutional security firewalls.'
    });
  }

  next();
}

/**
 * SuperAdmin WAF Telemetry API
 */
export function getThreatTelemetry() {
  const now = Date.now();
  const banned = [];
  const tracked = [];

  for (const [ip, record] of ipThreatStore.entries()) {
    const isBanned = record.bannedUntil && record.bannedUntil > now;
    const item = {
      ip,
      strikes: record.strikes || 0,
      lastSeen: record.lastSeen,
      isBanned: Boolean(isBanned),
      bannedUntil: record.bannedUntil || null,
      minutesRemaining: isBanned ? Math.ceil((record.bannedUntil - now) / 60000) : 0
    };
    if (isBanned) {
      banned.push(item);
    } else {
      tracked.push(item);
    }
  }

  return {
    totalTracked: ipThreatStore.size,
    totalTrackedIps: ipThreatStore.size,
    totalBanned: banned.length,
    totalBannedIps: banned.length,
    bannedIps: banned,
    monitoredIps: tracked.slice(0, 50)
  };
}

export function unbanIp(ip) {
  if (!ip) return false;
  const record = ipThreatStore.get(ip);
  if (record) {
    record.bannedUntil = null;
    record.strikes = 0;
    ipThreatStore.set(ip, record);
    return true;
  }
  return false;
}

