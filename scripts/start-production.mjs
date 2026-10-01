import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const port = process.env.PORT || "8080";

const child = spawn(
  process.execPath,
  [nextCli, "start", "--hostname", "0.0.0.0", "--port", port],
  { stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
