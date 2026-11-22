# Reflexión EC3 F3 A12

1. **Diferencia entre build, deploy y release.** El build transforma el código en artefactos ejecutables; el deploy instala y pone esos artefactos en un servicio; la release identifica una versión que además pasó las verificaciones y pruebas de aceptación. En este proyecto `pnpm build` genera el backend y `pnpm client:build` genera los archivos estáticos; Render ejecuta ambos despliegues.

2. **Por qué `PUBLIC_API_URL` puede ser pública y `JWT_SECRET` no.** La URL pública solo indica a qué servidor enviar solicitudes. `JWT_SECRET` permite firmar y verificar identidad: si se filtra, alguien podría fabricar tokens aceptados por la API.

3. **Riesgo de `trust proxy: true`.** Express confiaría en encabezados reenviados sin limitar el número de proxies confiables. Un cliente podría falsificar su IP reportada y afectar el rate limiting o la interpretación de HTTPS. La configuración A12 usa cero saltos en local y un salto en la topología descrita para Render.

4. **Por qué ocultar Eliminar en React no autoriza.** El navegador lo controla el usuario y puede enviar un DELETE manual. La API debe autenticar cada solicitud y exigir el rol `admin`; ocultar el botón solo facilita la interfaz.

5. **Por qué cambiar `VITE_API_URL` requiere un build.** Vite inserta las variables `VITE_` en el JavaScript del navegador durante la compilación. Cambiar la variable en Render sin reconstruir el sitio conserva la URL anterior dentro del bundle.

6. **Qué comprueba `/health/database`.** `/health` confirma que Express puede responder. `/health/database` además hace ping a MongoDB y responde `200` con `up` o `503` con `down`.

7. **Qué cubren los dobles y qué debe verificarse en Atlas.** SuperTest y los dobles cubren rutas, middleware, validación, roles y formato HTTP sin conectarse a la base. Atlas debe comprobarse aparte con conexión real, persistencia de altas y cambios, permisos del usuario de base y allowlist de red.

8. **Por qué tratar `204` de forma especial.** Un `204 No Content` confirma una operación exitosa sin cuerpo. El cliente debe devolver `undefined` y no intentar interpretar JSON.

9. **Cómo confirmar la etiqueta `v1.0.0`.** Compararía el commit indicado por la etiqueta en Git (`git show v1.0.0`) con el commit que Render reporta en el deploy exitoso. Solo crearía y enviaría la etiqueta después de la aceptación.

10. **Qué evidencia redactaría.** Ocultaría URI de MongoDB, contraseñas, `JWT_SECRET`, valores privados de Render y tokens. Conservaría códigos HTTP, estados, nombres de rutas y capturas de la interfaz sin datos personales innecesarios.

> Esta reflexión describe la configuración preparada en el repositorio. Las respuestas sobre el despliegue real deben actualizarse después de completar las pruebas de aceptación en Render y Atlas.
