# Historial de cambios

## [1.0.0] - 2026-11-22 (candidata)

Esta candidata requiere despliegue y aceptación en Render antes de etiquetarse como liberación.

### Agregado

- Cliente React con registro, inicio y cierre de sesión.
- CRUD de tareas con búsqueda, filtros, ordenamiento y paginación.
- Blueprint de Render para el backend Node y el sitio estático.
- Prueba de humo de solo lectura para la API publicada.
- Variables de entorno y proxy de confianza configurables por ambiente.

### Conservado

- Persistencia en MongoDB Atlas y esquema existente de tareas.
- JWT, roles `user` y `admin`, validaciones HTTP y contrato uniforme de errores.
- OpenAPI 3.1, Swagger UI, rate limiting y cabeceras Helmet.

### Seguridad

- Secretos limitados a variables locales ignoradas por Git y al panel de Render.
- CORS configurado con el origen exacto del frontend.
- Proxy Express configurado mediante una cantidad explícita de saltos.
