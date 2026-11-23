# Task API: autenticación, OpenAPI y cliente React

API REST para la gestión de tareas y cuentas de usuario con **Express 5**, **TypeScript**, **Mongoose 8.24.4** y MongoDB Atlas. El backend incluye registro y login con JWT, permisos por rol, controles HTTP, pruebas automatizadas, documentación OpenAPI y un cliente inicial en React.

## Arquitectura

```text
Cliente (Postman / Frontend)
         |
         v
    requestContext -> X-Request-Id y res.locals.requestId
         |
         +--> /api-docs.json -> openApiDocument
         +--> /api-docs -> Swagger UI
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
         |      +--> GET / -> data.status, version y environment
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

Cliente React (client/) -> login -> sessionStorage -> /api/auth/me y /api/tasks
```

## Variables de Entorno

Copie `.env.example` a `.env` y complete valores reales sin versionarlos:

| Variable | Uso |
|---|---|
| `NODE_ENV` | Ambiente `development`, `test` o `production`. |
| `APP_VERSION` | Versión que reporta la salud y OpenAPI; por defecto `1.0.0`. |
| `PORT` | Puerto local de Express. |
| `PUBLIC_API_URL` | URL base pública o local de la API; alimenta OpenAPI y el log de arranque. |
| `TRUST_PROXY_HOPS` | Saltos de proxy confiables; `0` en local y `1` en el Blueprint de Render. |
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
| `GET` | `/api-docs.json` | `200` | - |
| `GET` | `/api-docs/` | `200` | - |
| `POST` | `/api/tasks` | `201` | `400`, `401`, `415`, `422`, `503` |
| `GET` | `/api/tasks` | `200` | `401`, `422`, `503` |
| `GET` | `/api/tasks/:id` | `200` | `400`, `401`, `404`, `503` |
| `PATCH` | `/api/tasks/:id` | `200` | `400`, `401`, `404`, `415`, `422`, `503` |
| `PATCH` | `/api/tasks/:id/complete` | `200` | `400`, `401`, `404`, `503` |
| `DELETE` | `/api/tasks/:id` | `204` | `400`, `401`, `403`, `404`, `503` |
| `POST` | `/api/auth/register` | `201` | `409`, `415`, `422`, `429`, `503` |
| `POST` | `/api/auth/login` | `200` | `401`, `415`, `422`, `429`, `503` |
| `GET` | `/api/auth/me` | `200` | `401`, `503` |

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

Envía el token como `Authorization: Bearer <accessToken>`. Todas las rutas bajo `/api/tasks` requieren un token vigente. El rol `user` puede listar, consultar, crear y modificar tareas; `DELETE /api/tasks/:id` requiere `admin`. `GET /api/auth/me` busca el usuario actual por el id del JWT y devuelve su perfil público sin `passwordHash`.

Para cambiar un rol, ejecuta `pnpm role:set <correo> <user|admin>` después de registrar la cuenta. El cambio no modifica tokens que ya fueron emitidos; vuelve a iniciar sesión para obtener el token actualizado. No existe una ruta pública para asignar roles.

Helmet agrega cabeceras de seguridad. CORS permite el origen configurado y solicitudes sin `Origin` (por ejemplo Postman); no autentica clientes. El limitador de frecuencia cubre registro y login y responde `429 AUTH_RATE_LIMIT_EXCEEDED` al superar el máximo. Su almacén es local al proceso.

OpenAPI 3.1 se sirve en `/api-docs.json` y Swagger UI en `/api-docs/`. La documentación usa las respuestas reales de esta API, incluido `confirmPassword` en registro y el sobre de error con `requestId`.

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
| `pnpm test` | Ejecuta seis pruebas HTTP con SuperTest y servicios simulados. |
| `pnpm test:watch` | Ejecuta Vitest en modo observación. |
| `pnpm client:dev` | Inicia Vite en `http://localhost:5173`. |
| `pnpm client:check` | Verifica los tipos del cliente React. |
| `pnpm client:test` | Ejecuta las tres pruebas del adaptador HTTP del cliente. |
| `pnpm client:build` | Construye el cliente en `client/dist`. |
| `pnpm smoke:release` | Ejecuta comprobaciones de solo lectura a una API desplegada. |
| `pnpm verify` | Ejecuta tipos, seis pruebas backend, tres pruebas cliente y ambos builds. |

## Verificación y evidencias

Ejecuta `pnpm verify` antes de entregar. Las pruebas automatizadas sustituyen los servicios de negocio y no requieren Atlas. Para validar persistencia y el cliente en navegador, configura Atlas, ejecuta `pnpm dev` y `pnpm client:dev`, e inicia sesión en Vite. Importa `postman/A10-local.postman_environment.json` y `postman/task-api-ec3-f2-a11.postman_collection.json` para las pruebas de A11; registra resultados observados en `evidencias/ec3-a11.md`. La colección A10 original se conserva en `postman/task-api-ec3-f2-a10.postman_collection.json`.

Para A12, importa `postman/A12-local.postman_environment.json` y `postman/task-api-ec3-f3-a12.postman_collection.json`. Antes de registrar una cuenta, configura `password` solo en el entorno local de Postman. La colección comprueba `/health`, `/health/database`, CORS, autenticación y roles, CRUD y OpenAPI. Si la ejecutas contra Render, cambia `baseUrl`, `expectedVersion` y `expectedEnvironment` por los valores del despliegue; `/health/database` requiere que Atlas esté accesible.

## Evidencias

- Pruebas CRUD persistente: `docs/pruebas-crud-mongodb.md`
- Reflexión CRUD persistente: `docs/reflexion-crud-mongodb.md`
- Colección Postman sugerida: `postman/task-api-ec2-f2-a7.postman_collection.json`

## Despliegue y liberación A12

`render.yaml` declara un servicio Node para la API y un sitio estático para React. Los nombres actuales son `aarat-task-api-ec3-f3-a12` y `aarat-task-client-ec3-f3-a12`; verifica que estén disponibles en tu workspace Render. El Blueprint solicita `PUBLIC_API_URL`, `CORS_ORIGIN`, `MONGODB_URI` y `VITE_API_URL` durante la creación y genera `JWT_SECRET`. Nunca subas `.env` ni copies secretos al Blueprint.

La configuración de producción usa `TRUST_PROXY_HOPS=1`, el backend escucha `PORT` en `0.0.0.0` y el sitio estático reescribe las rutas SPA a `index.html`. En Atlas, limita Network Access a las direcciones de salida que Render muestre para el servicio; no mantengas `0.0.0.0/0`.

Antes de liberar, ejecuta `pnpm install --frozen-lockfile` y `pnpm verify`, completa `docs/release-checklist.md`, captura resultados sin secretos y ejecuta `pnpm smoke:release` con `API_URL`, `USER_EMAIL` y `USER_PASSWORD` definidos localmente. Crea y sube la etiqueta `v1.0.0` únicamente cuando Render, Atlas y la prueba de humo hayan aprobado el mismo commit desplegado. La evidencia de esta branch separa los resultados locales de los pasos de producción aún no comprobados.
