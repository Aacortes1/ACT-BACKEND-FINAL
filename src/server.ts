import type { Server } from "node:http";

import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

let server: Server | null = null;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\nSeñal ${signal} recibida. Cerrando servidor de forma ordenada...`);

  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        console.log("Servidor HTTP cerrado.");
        resolve();
      });
    });
  }

  try {
    await disconnectDatabase();
  } catch (error: unknown) {
    console.error("Error al cerrar la conexión con MongoDB:", error);
  }

  process.exit(0);
};

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase({
      uri: env.MONGODB_URI,
      dbName: env.MONGODB_DB_NAME,
    });
    server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(
        `API ${env.APP_VERSION} disponible en ${env.PUBLIC_API_URL}`,
      );
    });
  } catch (error: unknown) {
    console.error(
      "No fue posible iniciar la API. Revise MONGODB_URI, " +
        "el usuario y la lista de acceso de red.",
    );
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const safeErrorMessage = errorMessage.replace(
      /(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi,
      "$1[credenciales ocultas]@",
    );
    console.error("Detalle de la conexión:", safeErrorMessage);
    process.exitCode = 1;
  }
};

void startServer();
