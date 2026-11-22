# Evidencias EC3 F3 A12

## Identificación

- Nombre: por completar.
- Grupo: por completar.
- Repositorio: [ACT-5-BACKEND](https://github.com/GildardoPRMX/ACT-5-BACKEND-).
- Branch de entrega: `ec3-a12-despliegue-liberacion`.
- Commit desplegado: pendiente de despliegue.
- Etiqueta: pendiente de aceptación; no creada.
- URL prevista del frontend: `https://aarat-task-client-ec3-f3-a12.onrender.com` (sin confirmar).
- URL prevista de la API: `https://aarat-task-api-ec3-f3-a12.onrender.com` (sin confirmar).

## Calidad local

- Resultado de `pnpm install --frozen-lockfile`: aprobado con Node 24.22.3 y PNPM 11.25.0.
- Resultado de `pnpm verify`: aprobado en la branch A12.
- Pruebas backend aprobadas: 6 de 6.
- Pruebas cliente aprobadas: 3 de 3.
- TypeScript backend y cliente: aprobados.
- Builds de backend y cliente: aprobados; Vite generó `client/dist`.

## Despliegue

- Estado de `/health`: pendiente.
- Estado de `/health/database`: pendiente.
- OpenAPI usa la URL pública: pendiente.
- Atlas restringido a IP de salida de Render: pendiente.
- Blueprint versionado en `render.yaml`; no desplegado desde esta sesión.

## Aceptación

| Caso | Código o resultado | Evidencia | Observación |
|---|---|---|---|
| Registro | Pendiente | Pendiente | Requiere Atlas y API desplegada. |
| Login y `/me` | Pendiente | Pendiente | No guardar ni pegar el token en la evidencia. |
| Crear tarea | Pendiente | Pendiente | Confirmar persistencia en Atlas. |
| Filtrar y paginar | Pendiente | Pendiente | Probar desde React publicado. |
| Editar y completar | Pendiente | Pendiente | Probar desde React publicado. |
| DELETE con `user` | Pendiente | Pendiente | Debe responder `403 FORBIDDEN`. |
| DELETE con `admin` | Pendiente | Pendiente | Debe responder `204` sin cuerpo. |
| Token inválido | Pendiente | Pendiente | Debe responder `401` sin stack trace. |
| Prueba de humo | Pendiente | Pendiente | Ejecutar con cuenta de prueba válida. |

## Seguridad de la evidencia

- [x] No se copia `MONGODB_URI`.
- [x] No se copia `JWT_SECRET`.
- [x] No se incluyen contraseñas.
- [x] Los tokens no se incluyen.

## Incidencias y solución

- Incidencia: dos pruebas base de A11 mostraban que las rutas de tareas aceptaban solicitudes sin token y permitían DELETE a `user`.
- Causa: el middleware `taskRouter.use(authenticate)` estaba comentado y DELETE no aplicaba `requireRole("admin")`.
- Corrección: se restauraron ambos controles de acceso en la branch A12.
- Nueva comprobación: `pnpm verify` base pasó con 6 pruebas backend, TypeScript y builds de backend/cliente.
