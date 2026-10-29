import { createRequire as __piBundleCreateRequire } from 'node:module'; const require = __piBundleCreateRequire(import.meta.url);
import {
  APP_NAME,
  closeOwnedSessionWorkerOwnerWatch,
  installOwnedSessionWorkerOwnerWatch,
  isOwnedSessionWorkerProcess,
  maybeRunOwnedSessionWorkerFrontend,
  maybeStartDaemonEarly
} from "./chunk-NDX7OULL.js";
import "./chunk-5QCJ5DQU.js";
import "./chunk-CRBVRZBV.js";
import "./chunk-2T7M7VJ4.js";
import "./chunk-UIRUOAIQ.js";
import "./chunk-HXOBFFJX.js";
import "./chunk-6GUVYK6P.js";
import "./chunk-UPDAFKL5.js";
import "./chunk-MK52NEXK.js";
import "./chunk-BAWSWWEU.js";

// dist/cli-main.js
import { enableCompileCache } from "node:module";
async function runCli() {
  try {
    enableCompileCache?.();
  } catch {
  }
  process.title = APP_NAME;
  process.env.PI_CODING_AGENT = "true";
  process.emitWarning = (() => {
  });
  installOwnedSessionWorkerOwnerWatch();
  const args = process.argv.slice(2);
  const handledByOwnedWorker = await maybeRunOwnedSessionWorkerFrontend(args);
  if (!handledByOwnedWorker) {
    if (!isOwnedSessionWorkerProcess()) {
      maybeStartDaemonEarly(process.argv.slice(2));
    }
    const [{ EnvHttpProxyAgent, setGlobalDispatcher }, { main }] = await Promise.all([
      import("undici"),
      import("./main-KNTXS6RB.js")
    ]);
    setGlobalDispatcher(new EnvHttpProxyAgent({ bodyTimeout: 0, headersTimeout: 0 }));
    try {
      await main(process.argv.slice(2));
    } finally {
      closeOwnedSessionWorkerOwnerWatch();
    }
  }
}
export {
  runCli
};
