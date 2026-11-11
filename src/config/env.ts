import "dotenv/config";

const requireEnvironmentVariable = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
};

const readPort = (): number => {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT debe ser un número entero entre 1 y 65535.");
  }
  return port;
};

const readJwtSecret = (): string => {
  const secret = requireEnvironmentVariable("JWT_SECRET");
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET debe contener al menos 32 bytes.");
  }
  return secret;
};

const readJwtExpiration = (): string => {
  const value = process.env.JWT_EXPIRES_IN?.trim() || "1h";
  if (!/^\d+[smhd]$/.test(value)) {
    throw new Error("JWT_EXPIRES_IN debe usar un formato como 15m, 1h o 7d.");
  }
  return value;
};

const readPositiveInteger = (name: string, fallback: string): number => {
  const rawValue = process.env[name] ?? fallback;
  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${name} debe ser un número entero mayor que cero.`);
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} debe ser un número entero mayor que cero.`);
  }
  return value;
};

const readCorsOrigin = (): string => {
  const value = requireEnvironmentVariable("CORS_ORIGIN");
  let origin: URL;
  try {
    origin = new URL(value);
  } catch {
    throw new Error("CORS_ORIGIN debe ser un origen HTTP o HTTPS válido.");
  }

  if (
    (origin.protocol !== "http:" && origin.protocol !== "https:") ||
    origin.origin !== value
  ) {
    throw new Error(
      "CORS_ORIGIN debe contener solo esquema, host y puerto, sin ruta.",
    );
  }
  return value;
};

export const env = Object.freeze({
  PORT: readPort(),
  MONGODB_URI: requireEnvironmentVariable("MONGODB_URI"),
  MONGODB_DB_NAME: requireEnvironmentVariable("MONGODB_DB_NAME"),
  JWT_SECRET: readJwtSecret(),
  JWT_EXPIRES_IN: readJwtExpiration(),
  JWT_ISSUER: process.env.JWT_ISSUER?.trim() || "task-api-express",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE?.trim() || "task-api-client",
  CORS_ORIGIN: readCorsOrigin(),
  AUTH_RATE_LIMIT_WINDOW_MS: readPositiveInteger(
    "AUTH_RATE_LIMIT_WINDOW_MS",
    "900000",
  ),
  AUTH_RATE_LIMIT_MAX: readPositiveInteger("AUTH_RATE_LIMIT_MAX", "10"),
});
