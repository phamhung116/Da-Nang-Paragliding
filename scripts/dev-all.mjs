import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "apps", "backend");
const bootstrapMode = process.argv.includes("--bootstrap");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const pythonPath = process.platform === "win32"
  ? path.join(rootDir, ".venv", "Scripts", "python.exe")
  : path.join(rootDir, ".venv", "bin", "python");

const envTemplates = [
  ["apps/customer-web/.env.example", "apps/customer-web/.env"],
  ["apps/admin-web/.env.example", "apps/admin-web/.env"],
  ["apps/pilot-web/.env.example", "apps/pilot-web/.env"]
];

const runningChildren = [];
let shuttingDown = false;

const colorMap = {
  backend: "\u001b[35m",
  customer: "\u001b[36m",
  admin: "\u001b[33m",
  pilot: "\u001b[32m",
  bootstrap: "\u001b[34m"
};

const resetColor = "\u001b[0m";

function prefixLine(name, line) {
  const color = colorMap[name] ?? "";
  return `${color}[${name}]${resetColor} ${line}`;
}

function ensureFrontendEnvFiles() {
  for (const [exampleRelative, targetRelative] of envTemplates) {
    const examplePath = path.join(rootDir, exampleRelative);
    const targetPath = path.join(rootDir, targetRelative);
    if (!existsSync(targetPath) && existsSync(examplePath)) {
      copyFileSync(examplePath, targetPath);
      console.log(prefixLine("bootstrap", `Created ${targetRelative} from template.`));
    }
  }
}

function assertBackendReady() {
  const backendEnvPath = path.join(rootDir, "apps", "backend", ".env");
  if (!existsSync(backendEnvPath)) {
    console.error(prefixLine("bootstrap", "Missing apps/backend/.env. Create it before running dev:all."));
    process.exit(1);
  }

  if (!existsSync(pythonPath)) {
    console.error(prefixLine("bootstrap", "Missing .venv Python interpreter. Create .venv and install backend requirements first."));
    process.exit(1);
  }
}

function wireOutput(name, stream) {
  const reader = createInterface({ input: stream });
  reader.on("line", (line) => {
    if (line.trim().length > 0) {
      console.log(prefixLine(name, line));
    }
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of runningChildren) {
    killProcessTree(child);
  }

  setTimeout(() => {
    for (const child of runningChildren) {
      killProcessTree(child, true);
    }
    process.exit(exitCode);
  }, 400);
}

function killProcessTree(child, force = false) {
  if (!child?.pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore"
    });
    return;
  }

  child.kill(force ? "SIGTERM" : "SIGINT");
}

function spawnManagedProcess({ name, command, args, cwd }) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  runningChildren.push(child);
  wireOutput(name, child.stdout);
  wireOutput(name, child.stderr);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }
    const exitCode = typeof code === "number" ? code : 0;
    const reason = signal ? `signal ${signal}` : `code ${exitCode}`;
    console.log(prefixLine(name, `Exited with ${reason}. Stopping the remaining processes.`));
    shutdown(exitCode === 0 ? 0 : exitCode);
  });

  return child;
}

function runStep(name, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, args, {
      cwd,
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"]
    });

    wireOutput(name, child.stdout);
    wireOutput(name, child.stderr);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`${name} failed with exit code ${code ?? 1}.`));
    });
  });
}

async function main() {
  ensureFrontendEnvFiles();
  assertBackendReady();

  if (bootstrapMode) {
    console.log(prefixLine("bootstrap", "Running backend migrate before starting all apps."));
    await runStep("bootstrap", ["manage.py", "migrate"], backendDir);
    console.log(prefixLine("bootstrap", "Running backend seed_demo_data before starting all apps."));
    await runStep("bootstrap", ["manage.py", "seed_demo_data"], backendDir);
  }

  console.log(prefixLine("bootstrap", "Starting backend, customer, admin and pilot in one terminal."));

  spawnManagedProcess({
    name: "backend",
    command: pythonPath,
    args: ["manage.py", "runserver"],
    cwd: backendDir
  });
  spawnManagedProcess({
    name: "customer",
    command: npmCommand,
    args: ["run", "dev:customer"],
    cwd: rootDir
  });
  spawnManagedProcess({
    name: "admin",
    command: npmCommand,
    args: ["run", "dev:admin"],
    cwd: rootDir
  });
  spawnManagedProcess({
    name: "pilot",
    command: npmCommand,
    args: ["run", "dev:pilot"],
    cwd: rootDir
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error(prefixLine("bootstrap", error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
