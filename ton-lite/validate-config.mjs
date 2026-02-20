#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const candidatePaths = [
  process.env.TON_LITESERVER_CONFIG_PATH,
  '/opt/ton-config/global-config.json',
  path.resolve(process.cwd(), 'ton-lite/global-config.json')
].filter(Boolean);

function toUnsigned32(value) {
  return value >>> 0;
}

function intToIp(value) {
  const n = toUnsigned32(value);
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function isLoopback(ip) {
  return ip.startsWith('127.');
}

function isPrivate(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

const resolvedPath = candidatePaths.find((candidate) => fs.existsSync(path.resolve(candidate)));
if (!resolvedPath) {
  console.error(`[ton-lite] Config not found. Checked: ${candidatePaths.join(', ')}`);
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(resolvedPath), 'utf8');
const config = JSON.parse(raw);
const liteservers = config?.liteservers;
if (!Array.isArray(liteservers) || liteservers.length === 0) {
  console.error('[ton-lite] No liteservers found in config.global JSON.');
  process.exit(1);
}

const loopbackEntries = [];
const privateEntries = [];

for (const item of liteservers) {
  const ip = intToIp(Number(item.ip));
  if (isLoopback(ip)) {
    loopbackEntries.push(ip);
  } else if (isPrivate(ip)) {
    privateEntries.push(ip);
  }
}

if (loopbackEntries.length > 0) {
  console.error('[ton-lite] Invalid liteserver config: loopback addresses detected.');
  console.error(`  Loopback IPs: ${[...new Set(loopbackEntries)].join(', ')}`);
  console.error('  Docker containers treat 127.0.0.1 as the container itself, not the host TON node.');
  console.error('  Use a routable/public IP in your lite-server config (see toncenter/ton-http-api#87 issuecomment-3599163096).');
  process.exit(1);
}

if (privateEntries.length > 0) {
  console.warn('[ton-lite] Warning: private-network liteserver IPs detected:');
  console.warn(`  ${[...new Set(privateEntries)].join(', ')}`);
  console.warn('  Ensure the container can route to these hosts.');
}

console.log(`[ton-lite] Config check passed (${liteservers.length} liteservers loaded from ${path.resolve(resolvedPath)}).`);
