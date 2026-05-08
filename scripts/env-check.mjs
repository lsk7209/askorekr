import { existsSync, readFileSync } from "node:fs";

const REQUIRED_PUBLIC_URL = "NEXT_PUBLIC_SITE_URL";
const DATABASE_URL = "TURSO_DATABASE_URL";
const DATABASE_TOKEN = "TURSO_AUTH_TOKEN";
const PRODUCTION_FLAGS = new Set(["--production", "--prod"]);
const ENV_FILES = [".env", ".env.local"];

function loadEnvFiles() {
  for (const file of ENV_FILES) {
    if (!existsSync(file)) {
      continue;
    }

    const lines = readFileSync(file, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [name, ...valueParts] = trimmed.split("=");

      if (!process.env[name]) {
        process.env[name] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  }
}

function readEnv(name) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function isProductionCheck() {
  return (
    PRODUCTION_FLAGS.has(process.argv[2]) ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production"
  );
}

function assertValidUrl(name, value, errors) {
  if (!value) {
    errors.push(`${name} is required.`);
    return;
  }

  try {
    new URL(value);
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

function validateDatabase(errors) {
  const url = readEnv(DATABASE_URL) ?? "file:local.db";
  const token = readEnv(DATABASE_TOKEN);

  if (url.startsWith("file:")) {
    return;
  }

  if (!url.startsWith("libsql://")) {
    errors.push(`${DATABASE_URL} must start with file: or libsql://.`);
  }

  if (!token) {
    errors.push(`${DATABASE_TOKEN} is required when using libsql://.`);
  }
}

function validateProduction(errors) {
  const url = readEnv(DATABASE_URL);

  if (!url?.startsWith("libsql://")) {
    errors.push(`${DATABASE_URL} must be a libsql:// Turso URL in production.`);
  }

  if (!readEnv(DATABASE_TOKEN)) {
    errors.push(`${DATABASE_TOKEN} is required in production.`);
  }
}

const errors = [];

loadEnvFiles();
assertValidUrl(REQUIRED_PUBLIC_URL, readEnv(REQUIRED_PUBLIC_URL), errors);
validateDatabase(errors);

if (isProductionCheck()) {
  validateProduction(errors);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.info("Environment check passed.");
