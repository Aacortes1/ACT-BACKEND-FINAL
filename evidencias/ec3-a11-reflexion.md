# Reflexión EC3 F2 A11

Respuestas sugeridas para revisar y personalizar antes de entregar.

1. En `api.test.ts` se sustituyen los servicios de autenticación y tareas. Express, el enrutamiento, los middlewares, validaciones, controladores, `token.service`, la firma/verificación JWT y los cuerpos HTTP siguen ejecutándose realmente.
2. La suite no abre conexión a MongoDB; por eso no prueba la URI, permisos, red, índices ni lectura/escritura en Atlas.
3. OpenAPI es el documento que describe el contrato de la API. Swagger UI presenta ese documento y permite explorar o enviar solicitudes.
4. El id se toma del JWT verificado para que el navegador no pueda elegir la cuenta consultada mediante un parámetro o un campo del body. El servicio consulta el perfil actual en la base.
5. El límite protege intentos de credenciales en registro y login. `/me` valida una sesión ya iniciada y no debe gastar ese límite.
6. `401` indica que la solicitud no está autenticada; `403` indica que el token es válido, pero el rol no permite la acción. React puede pedir que el usuario inicie sesión de nuevo en el primer caso y mostrar el permiso faltante en el segundo.
7. Postman envía HTTP directamente y no aplica la política CORS del navegador. Por eso una solicitud puede funcionar en Postman y estar bloqueada para JavaScript desde otro origen.
8. `sessionStorage` se puede leer desde JavaScript; un XSS podría robar el token. Se usa aquí para mostrar Bearer JWT, no como recomendación de producción. Cookies `HttpOnly`, `Secure` y `SameSite`, junto con una estrategia CSRF adecuada, requieren un diseño posterior.
9. OpenAPI describe los cuerpos y respuestas, `types.ts` representa las estructuras que usa React durante la compilación, y las pruebas comprueban parte del contrato en ejecución. Mantenerlos alineados evita que el cliente asuma propiedades que el backend no envía.
10. Antes de desplegar agregaría una prueba de integración contra una base de datos de prueba aislada para confirmar registro, lectura de `/me` y CRUD persistente, además de verificar que el entorno no comparta datos con producción.
