import { env } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { isUserRole } from "../models/user.js";
import { setUserRoleByEmail } from "../repositories/user.repository.js";

const usage = "Uso: pnpm role:set <correo> <user|admin>";

const run = async (): Promise<void> => {
  const email = process.argv[2]?.trim().toLowerCase();
  const role = process.argv[3]?.trim();
  if (!email || !role || !isUserRole(role)) throw new Error(usage);

  await connectDatabase({ uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME });
  const user = await setUserRoleByEmail(email, role);
  if (!user) throw new Error(`No existe un usuario con el correo ${email}.`);
  console.log(`Rol actualizado: ${user.email} ahora es ${user.role}.`);
};

try {
  await run();
} catch (error: unknown) {
  if (
    error instanceof Error &&
    (error.message === usage || error.message.startsWith("No existe un usuario"))
  ) {
    console.error(`No fue posible actualizar el rol. ${error.message}`);
  } else {
    console.error(
      "No fue posible actualizar el rol. Verifica MongoDB, la red y el correo del usuario.",
    );
  }
  process.exitCode = 1;
} finally {
  try {
    await disconnectDatabase();
  } catch {
    // No imprimir errores de conexión que podrían incluir datos sensibles.
  }
}
