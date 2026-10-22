// TODO(ios-debug): temporary settings panel that lists the last 20 failed
// requests captured by the network debug probe. Shown only when isNativeApp().
// Remove together with src/shared/platform/networkDebug.ts after the first iOS
// device run confirms which requests fail.
import { useEffect, useState } from "react";
import Button from "@/shared/ui/Button";
import { CopyLine, DeleteLine } from "@mingcute/react";
import {
  clearNetworkFailures,
  getNetworkFailures,
  isNetworkDebugProbeInstalled,
  type NetworkFailureRecord,
} from "./networkDebug";
import { isNativeApp } from "./index";

const font = { fontFamily: "var(--font-inter), sans-serif" } as const;
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } as const;

export default function NetworkDebugPanel() {
  const [failures, setFailures] = useState<NetworkFailureRecord[]>(() => getNetworkFailures());
  const [copied, setCopied] = useState(false);

  // records are pushed outside react; poll so the list stays fresh
  useEffect(() => {
    const id = setInterval(() => setFailures(getNetworkFailures()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!isNativeApp()) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(JSON.stringify(getNetworkFailures(), null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable: nothing to do, the list stays on screen
    }
  };

  return (
    <div
      className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-border-alpha-14 border border-border-primary/40 p-[16px] text-left"
      style={font}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-[600] text-text-primary">Network debug</span>
        <span className="text-[11px] text-text-tertiary">
          {isNetworkDebugProbeInstalled() ? "probe: on" : "probe: off"} · TODO remove
        </span>
      </div>
      <div className="mb-2 flex items-center gap-[6px]">
        <Button variant="secondary" size="sm" onClick={() => void handleCopy()} className="!h-[26px] !px-[10px] !text-[11px] gap-[5px]">
          <CopyLine size={12} />
          {copied ? "Copied" : "Copy JSON"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => { clearNetworkFailures(); setFailures([]); }} className="!h-[26px] !px-[10px] !text-[11px] gap-[5px]">
          <DeleteLine size={12} />
          Clear
        </Button>
      </div>
      {failures.length === 0 ? (
        <p className="m-0 text-[11px] text-text-tertiary" style={mono}>
          no failed fetches captured yet
        </p>
      ) : (
        <ul className="m-0 max-h-[320px] overflow-y-auto flex flex-col gap-[6px] p-0 list-none">
          {[...failures].reverse().map((f, idx) => (
            <li key={`${f.at}-${idx}`} className="rounded-md bg-bg-elevated/60 p-[8px]">
              <p className="m-0 text-[11px] text-text-primary break-all" style={mono}>
                {new Date(f.at).toLocaleTimeString([], { hour12: false })} · {f.method} ·{" "}
                <span className="text-red-400">{f.status === 0 ? "ERR" : f.status}</span>
              </p>
              <p className="m-0 mt-[2px] text-[11px] text-text-secondary break-all" style={mono}>
                {f.url}
              </p>
              <p className="m-0 mt-[2px] text-[11px] text-text-tertiary whitespace-pre-wrap break-all" style={mono}>
                {f.error}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
