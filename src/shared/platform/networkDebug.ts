// TODO(ios-debug): temporary network failure capture for the Capacitor iOS
// build. Only active when isNativeApp() is true (fetch on desktop/web stays
// untouched). Remove this file and the NetworkDebugPanel once the first iOS
// device run confirms which requests fail.
import { isNativeApp } from "./index";

export interface NetworkFailureRecord {
  at: number;
  method: string;
  url: string;
  status: number;
  error: string;
}

const MAX_RECORDS = 20;
const MAX_URL_LENGTH = 200;
const MAX_ERROR_LENGTH = 240;

const records: NetworkFailureRecord[] = [];
let installed = false;
let observers: (() => void)[] = [];

export function getNetworkFailures(): NetworkFailureRecord[] {
  return [...records];
}

export function clearNetworkFailures(): void {
  records.length = 0;
  notify();
}

export function isNetworkDebugProbeInstalled(): boolean {
  return installed;
}

export function subscribeToNetworkFailures(listener: () => void): () => void {
  observers = [...observers, listener];
  return () => {
    observers = observers.filter((o) => o !== listener);
  };
}

function notify(): void {
  for (const notifyListener of observers) {
    try {
      notifyListener();
    } catch {
      // a dead listener must never break request handling
    }
  }
}

function clamp(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function push(entry: Omit<NetworkFailureRecord, "at">): void {
  records.push({ ...entry, at: Date.now() });
  if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
  notify();
}

async function probeBody(res: Response): Promise<string> {
  try {
    const text = await res.clone().text();
    return `${res.status} ${res.statusText}${text ? ` :: ${text}` : ""}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

function describeInput(input: Request | URL | string): { url: string; method: string } | null {
  try {
    if (typeof input === "string") {
      const url = new URL(input, globalThis.location?.href);
      return { url: url.toString(), method: "GET" };
    }
    if (input instanceof URL) {
      return { url: input.toString(), method: "GET" };
    }
    return { url: input.url, method: input.method ?? "GET" };
  } catch {
    return null;
  }
}

export function installNetworkDebugProbe(): void {
  if (installed) return;
  if (!isNativeApp()) return;
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: Request | URL | string, init?: RequestInit): Promise<Response> => {
    const from = describeInput(input);
    const url = clamp(from?.url ?? String(input), MAX_URL_LENGTH);
    const method = (init?.method ?? from?.method ?? "GET").toUpperCase();
    try {
      const res = await originalFetch(input as RequestInfo, init);
      if (!res.ok) {
        push({
          method,
          url,
          status: res.status,
          error: clamp(await probeBody(res), MAX_ERROR_LENGTH),
        });
      }
      return res;
    } catch (err) {
      push({
        method,
        url,
        status: 0,
        error: clamp(
          `throw: ${err instanceof Error ? err.message : String(err)}`,
          MAX_ERROR_LENGTH,
        ),
      });
      throw err;
    }
  };
  installed = true;
}
