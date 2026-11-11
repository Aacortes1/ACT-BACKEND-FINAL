# Task API: CRUD persistente y autenticación con Express y MongoDB Atlas

API REST para la gestión de tareas y cuentas de usuario desarrollada con **Express 5**, **TypeScript**, **Node.js**, **Mongoose 8.24.4** y persistencia en **MongoDB Atlas**. Conserva el CRUD de tareas de A8, registro y login con JWT, y protege las rutas con autenticación, permisos por rol y controles HTTP de A10.

## Arquitectura

```text
Cliente (Postman / Frontend)
         |
         v
    requestContext -> X-Request-Id y res.locals.requestId
         |
         v
    Helmet -> CORS -> rate limit en registro/login
         |
         v
    express.json()
         |
         +--> /api/auth
         |      +--> validación de entrada
         |      +--> GET /me -> identidad verificada
         |      +--> controlador -> servicio de autenticación
         |      +--> bcryptjs -> repositorio -> UserModel
         |      +--> jose: firma y verifica JWT
         |
         +--> /health
         |      +--> GET / -> status ok
         |      +--> GET /database -> ping a MongoDB Atlas
         |
         +--> /api/tasks
                +--> authenticate -> res.locals.auth
                +--> requireRole('admin') para DELETE
                +--> middlewares de validación
                +--> controllers
                +--> services
                +--> TaskModel (Mongoose)
                +--> MongoDB Atlas: task_api.tasks
```

## Variables de Entorno

Copie `.env.example` a `.env` y complete valores reales sin versionarlos:

| Variable | Uso |
|---|---|
| `PORT` | Puerto local de Express. |
| `MONGODB_URI` | Cadena de conexión privada a MongoDB Atlas. |
| `MONGODB_DB_NAME` | Base de datos usada por la API, por defecto `task_api`. |
| `JWT_SECRET` | Clave aleatoria de al menos 32 bytes para firmar y verificar JWT. |
| `JWT_EXPIRES_IN` | Vigencia del token, como `15m`, `1h` o `7d`; por defecto `1h`. |
| `JWT_ISSUER` | Emisor validado en los tokens; por defecto `task-api-express`. |
| `JWT_AUDIENCE` | Audiencia validada en los tokens; por defecto `task-api-client`. |
| `CORS_ORIGIN` | Origen web permitido, con esquema, host y puerto; sin ruta. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Ventana del límite de registro/login en milisegundos; por defecto `900000` (15 minutos). |
| `AUTH_RATE_LIMIT_MAX` | Intentos de registro/login permitidos por IP y ventana; por defecto `10`. |

Genera `JWT_SECRET` localmente con `node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"` y guárdalo solo en `.env`. Nunca uses el marcador de `.env.example` como valor real.

## Endpoints

| Método | Ruta | Éxito | Errores previstos |
|---|---|---:|---|
| `GET` | `/health` | `200` | - |
| `GET` | `/health/database` | `200` | `503` |
| `POST` | `/api/tasks` | `201` | `400`, `401`, `415`, `422`, `503` |
| `GET` | `/api/tasks` | `200` | `401`, `422`, `503` |
| `GET` | `/api/tasks/:id` | `200` | `400`, `401`, `404`, `503` |
| `PATCH` | `/api/tasks/:id` | `200` | `400`, `401`, `404`, `415`, `422`, `503` |
| `PATCH` | `/api/tasks/:id/complete` | `200` | `400`, `401`, `404`, `503` |
| `DELETE` | `/api/tasks/:id` | `204` | `400`, `401`, `403`, `404`, `503` |
| `POST` | `/api/auth/register` | `201` | `409`, `415`, `422`, `429`, `503` |
| `POST` | `/api/auth/login` | `200` | `401`, `415`, `422`, `429`, `503` |
| `GET` | `/api/auth/me` | `200` | `401` |

## Autenticación

El registro acepta `name`, `email`, `password` y `confirmPassword`. La confirmación solo se valida en la frontera HTTP; no se guarda ni se devuelve. El usuario siempre recibe el rol `user`. La contraseña requiere al menos 15 caracteres y no más de 72 bytes UTF-8; se guarda únicamente su hash bcrypt con 12 rondas.

```json
{
  "name": "Ana Torres",
  "email": "ana.torres@example.com",
  "password": "Frase segura para clase 2026",
  "confirmPassword": "Frase segura para clase 2026"
}
```

El login devuelve `data.user`, `data.accessToken`, `data.tokenType` (`Bearer`) y `data.expiresIn`. El JWT firma solo `sub` (id del usuario) y `role`, además de los claims estándar; la verificación restringe el algoritmo a HS256 y valida emisor, audiencia y expiración. Las respuestas públicas no contienen `passwordHash`.

Envía el token como `Authorization: Bearer <accessToken>`. Todas las rutas bajo `/api/tasks` requieren un token vigente. El rol `user` puede listar, consultar, crear y modificar tareas; `DELETE /api/tasks/:id` requiere `admin`. `GET /api/auth/me` requiere token y devuelve únicamente `userId` y `role`.

Para cambiar un rol, ejecuta `pnpm role:set <correo> <user|admin>` después de registrar la cuenta. El cambio no modifica tokens que ya fueron emitidos; vuelve a iniciar sesión para obtener el token actualizado. No existe una ruta pública para asignar roles.

Helmet agrega cabeceras de seguridad. CORS permite el origen configurado y solicitudes sin `Origin` (por ejemplo Postman); no autentica clientes. El limitador de frecuencia cubre registro y login y responde `429 AUTH_RATE_LIMIT_EXCEEDED` al superar el máximo. Su almacén es local al proceso.

## Actualización Parcial

`PATCH /api/tasks/:id` permite modificar `title`, `status` o ambos campos. Rechaza cuerpos vacíos, arreglos, campos desconocidos, títulos vacíos o mayores a 120 caracteres y estados distintos de `pending` o `completed`.

```json
{
  "title": "Documentar el CRUD persistente",
  "status": "completed"
}
```

## Comandos

| Comando | Propósito |
|---|---|
| `pnpm install` | Instala dependencias declaradas en `pnpm-lock.yaml`. |
| `pnpm dev` | Inicia el servidor en desarrollo. |
| `pnpm check` | Ejecuta TypeScript sin emitir archivos. |
| `pnpm build` | Compila a `dist/`. |
| `pnpm start` | Ejecuta la versión compilada. |
| `pnpm role:set <correo> <rol>` | Cambia el rol (`user` o `admin`) desde la terminal. |

## Verificación y evidencias

Importa `postman/A10-local.postman_environment.json` y `postman/task-api-ec3-f2-a10.postman_collection.json` para recorrer los casos de autenticación, autorización, CORS, rate limiting y regresión. Los flujos de cuenta, roles y tareas requieren MongoDB Atlas; completa con resultados observados `evidencias/ec3-a10.md` antes de entregar. La colección de A9 permanece disponible en `postman/task-api-ec3-f1-a9.postman_collection.json`.

## Evidencias

- Pruebas CRUD persistente: `docs/pruebas-crud-mongodb.md`
- Reflexión CRUD persistente: `docs/reflexion-crud-mongodb.md`
- Colección Postman sugerida: `postman/task-api-ec2-f2-a7.postman_collection.json`
