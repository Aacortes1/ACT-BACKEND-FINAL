# Lista de liberación 1.0.0

## Calidad local

- [x] `pnpm install --frozen-lockfile` termina correctamente.
- [x] `pnpm verify` termina sin errores.
- [ ] La API y el cliente funcionan en desarrollo contra MongoDB Atlas.

## Producción

- [ ] Los nombres de los servicios en `render.yaml` están disponibles en Render.
- [ ] Los secretos se registraron en Render y no en Git.
- [ ] Atlas permite solo las direcciones de salida indicadas por Render.
- [ ] `PUBLIC_API_URL`, `VITE_API_URL` y `CORS_ORIGIN` coinciden con los orígenes HTTPS publicados.
- [ ] `/health/database` informa estado `up`.
- [ ] Swagger UI utiliza la URL HTTPS pública de la API.

## Aceptación

- [ ] Registro e inicio de sesión funcionan desde el sitio publicado.
- [ ] Un usuario puede crear, listar, buscar, editar y completar tareas.
- [ ] El rol `user` no ve la acción Eliminar y un DELETE manual responde `403`.
- [ ] Un administrador puede eliminar tareas y recibe `204`.
- [ ] Un token ausente o alterado produce `401` sin stack trace.
- [ ] Un origen no permitido no recibe encabezado CORS.
- [ ] `pnpm smoke:release` termina correctamente sin imprimir credenciales.

## Liberación

- [ ] Las evidencias no incluyen URI, contraseñas ni tokens completos.
- [ ] `CHANGELOG.md` describe la versión y fecha reales de liberación.
- [ ] El commit desplegado está publicado en GitHub.
- [ ] `v1.0.0` señala el mismo commit que Render desplegó.
