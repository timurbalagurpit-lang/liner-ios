import { initTelemetry } from "@/shared/telemetry";
import { initBackgroundStorageAnalytics } from "@/shared/utils/cacheManager";
import { initClientVisitorSession } from "@/shared/api/visitorSession";
import { initBundleStampLog } from "@/shared/utils/bundleStampLog";
// TODO(ios-debug): temporary network debug probe; remove with the settings panel
import { installNetworkDebugProbe } from "@/shared/platform";

export function initMainWindowServices() {
  initTelemetry();
  initBackgroundStorageAnalytics();
  initClientVisitorSession();
  initBundleStampLog();
  installNetworkDebugProbe();
}
