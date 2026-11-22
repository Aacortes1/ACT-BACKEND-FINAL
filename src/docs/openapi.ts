import { env } from "../config/env.js";

const errorResponse = (description: string): Record<string, unknown> => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
});

const taskQuery = (
  name: string,
  schema: Record<string, unknown>,
  description?: string,
): Record<string, unknown> => ({
  name,
  in: "query",
  description,
  schema,
});

const jsonBody = (schema: string): Record<string, unknown> => ({
  required: true,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const jsonResponse = (
  description: string,
  schema: string,
): Record<string, unknown> => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const taskIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "ObjectId de MongoDB",
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};

const unauthorized = errorResponse("Falta un token Bearer válido.");
const badRequest = errorResponse("El identificador o el JSON no son válidos.");
const notFound = errorResponse("No se encontró el recurso solicitado.");
const unsupportedMediaType = errorResponse("Se requiere Content-Type application/json.");
const validationError = errorResponse("Los datos o parámetros no son válidos.");
const databaseUnavailable = errorResponse("El almacenamiento no está disponible.");
const payloadTooLarge = errorResponse("El cuerpo supera el límite de 20 KB.");
const internalError = errorResponse("Ocurrió un error interno.");

export const openApiDocument: Record<string, unknown> = {
  openapi: "3.1.0",
  info: {
    title: "Task API Express",
    version: env.APP_VERSION,
    description:
      "API REST de tareas con autenticación JWT, autorización por roles y respuestas de error con requestId.",
  },
  servers: [
    {
      url: env.PUBLIC_API_URL,
      description:
        env.NODE_ENV === "production" ? "Entorno de producción" : "Entorno local",
    },
  ],
  tags: [
    { name: "Health", description: "Estado del servicio y la base de datos" },
    { name: "Auth", description: "Registro, acceso e identidad autenticada" },
    { name: "Tasks", description: "CRUD protegido de tareas" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Comprobar que la API responde",
        responses: {
          "200": {
            description: "Servicio disponible",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      type: "object",
                      required: ["status", "version", "environment"],
                      properties: {
                        status: { type: "string", const: "up" },
                        version: { type: "string", example: env.APP_VERSION },
                        environment: {
                          type: "string",
                          enum: ["development", "test", "production"],
                          example: env.NODE_ENV,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          default: internalError,
        },
      },
    },
    "/health/database": {
      get: {
        tags: ["Health"],
        summary: "Comprobar la conexión con MongoDB",
        responses: {
          "200": {
            description: "Base de datos conectada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      type: "object",
                      required: ["status"],
                      properties: { status: { type: "string", const: "up" } },
                    },
                  },
                },
              },
            },
          },
          "503": {
            description: "Base de datos no disponible",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: {
                      type: "object",
                      required: ["status"],
                      properties: {
                        status: { type: "string", const: "down" },
                      },
                    },
                  },
                },
              },
            },
          },
          default: internalError,
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar una cuenta de usuario",
        description:
          "El rol se asigna en el servidor. confirmPassword se valida y no se persiste.",
        requestBody: jsonBody("RegisterInput"),
        responses: {
          "201": jsonResponse("Cuenta creada", "UserEnvelope"),
          "400": badRequest,
          "409": errorResponse("El correo ya está registrado."),
          "413": payloadTooLarge,
          "415": unsupportedMediaType,
          "422": validationError,
          "429": errorResponse("Se superó el límite de intentos de autenticación."),
          "503": databaseUnavailable,
          default: internalError,
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión y obtener un token de acceso",
        requestBody: jsonBody("LoginInput"),
        responses: {
          "200": jsonResponse("Credenciales correctas", "LoginEnvelope"),
          "401": errorResponse("Credenciales incorrectas."),
          "400": badRequest,
          "413": payloadTooLarge,
          "415": unsupportedMediaType,
          "422": validationError,
          "429": errorResponse("Se superó el límite de intentos de autenticación."),
          "503": databaseUnavailable,
          default: internalError,
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Obtener el usuario actual asociado al token",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": jsonResponse("Usuario autenticado", "UserEnvelope"),
          "401": unauthorized,
          "503": databaseUnavailable,
          default: internalError,
        },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "Listar tareas con paginación, filtros y orden",
        security: [{ bearerAuth: [] }],
        parameters: [
          taskQuery("page", { type: "integer", minimum: 1, maximum: 100000, default: 1 }),
          taskQuery("limit", { type: "integer", minimum: 1, maximum: 50, default: 10 }),
          taskQuery("status", { type: "string", enum: ["pending", "completed"] }),
          taskQuery("search", { type: "string", minLength: 1, maxLength: 60 }),
          taskQuery(
            "sortBy",
            { type: "string", enum: ["createdAt", "updatedAt", "title", "status"] },
          ),
          taskQuery("order", { type: "string", enum: ["asc", "desc"], default: "asc" }),
          taskQuery("createdFrom", { type: "string", format: "date-time" }),
          taskQuery("createdTo", { type: "string", format: "date-time" }),
        ],
        responses: {
          "200": jsonResponse("Lista paginada de tareas", "TaskListResult"),
          "401": unauthorized,
          "422": validationError,
          "503": databaseUnavailable,
          default: internalError,
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Crear una tarea como usuario autenticado",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateTaskInput"),
        responses: {
          "201": jsonResponse("Tarea creada", "TaskEnvelope"),
          "401": unauthorized,
          "400": badRequest,
          "413": payloadTooLarge,
          "415": unsupportedMediaType,
          "422": validationError,
          "503": databaseUnavailable,
          default: internalError,
        },
      },
    },
    "/api/tasks/{id}": {
      parameters: [taskIdParameter],
      get: {
        tags: ["Tasks"],
        summary: "Consultar una tarea",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": jsonResponse("Tarea encontrada", "TaskEnvelope"),
          "400": badRequest,
          "401": unauthorized,
          "404": notFound,
          "503": databaseUnavailable,
          default: internalError,
        },
      },
      patch: {
        tags: ["Tasks"],
        summary: "Actualizar título o estado de una tarea",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("UpdateTaskInput"),
        responses: {
          "200": jsonResponse("Tarea actualizada", "TaskEnvelope"),
          "400": badRequest,
          "401": unauthorized,
          "404": notFound,
          "415": unsupportedMediaType,
          "422": validationError,
          "503": databaseUnavailable,
          "413": payloadTooLarge,
          default: internalError,
        },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Eliminar una tarea (solo admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Tarea eliminada sin cuerpo" },
          "400": badRequest,
          "401": unauthorized,
          "403": errorResponse("El usuario autenticado no tiene rol admin."),
          "404": notFound,
          "503": databaseUnavailable,
          default: internalError,
        },
      },
    },
    "/api/tasks/{id}/complete": {
      patch: {
        tags: ["Tasks"],
        summary: "Marcar una tarea como completada",
        security: [{ bearerAuth: [] }],
        parameters: [taskIdParameter],
        responses: {
          "200": jsonResponse("Tarea completada", "TaskEnvelope"),
          "400": badRequest,
          "401": unauthorized,
          "404": notFound,
          "503": databaseUnavailable,
          default: internalError,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: {
        type: "object",
        required: ["id", "name", "email", "role", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", example: "67112bfe47963b2be12c43a1" },
          name: { type: "string", example: "Ana Torres" },
          email: { type: "string", format: "email", example: "ana@example.com" },
          role: { type: "string", enum: ["user", "admin"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Task: {
        type: "object",
        required: ["id", "title", "status", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
          title: { type: "string", maxLength: 120 },
          status: { type: "string", enum: ["pending", "completed"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password", "confirmPassword"],
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          email: { type: "string", format: "email", maxLength: 254 },
          password: {
            type: "string",
            minLength: 15,
            maxLength: 72,
            format: "password",
            description: "La API limita la contraseña a 72 bytes UTF-8.",
          },
          confirmPassword: { type: "string", minLength: 1, format: "password" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        additionalProperties: false,
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1, format: "password" },
        },
      },
      CreateTaskInput: {
        type: "object",
        required: ["title"],
        additionalProperties: false,
        properties: { title: { type: "string", minLength: 1, maxLength: 120 } },
      },
      UpdateTaskInput: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          title: { type: "string", minLength: 1, maxLength: 120 },
          status: { type: "string", enum: ["pending", "completed"] },
        },
      },
      ApiError: {
        type: "object",
        required: ["code", "message", "requestId"],
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { type: "array", items: { type: "object" } },
          requestId: { type: "string", format: "uuid" },
        },
      },
      ErrorEnvelope: {
        type: "object",
        required: ["error"],
        properties: { error: { $ref: "#/components/schemas/ApiError" } },
      },
      UserEnvelope: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["user"],
            properties: { user: { $ref: "#/components/schemas/User" } },
          },
        },
      },
      LoginEnvelope: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["user", "accessToken", "tokenType", "expiresIn"],
            properties: {
              user: { $ref: "#/components/schemas/User" },
              accessToken: { type: "string" },
              tokenType: { type: "string", const: "Bearer" },
              expiresIn: { type: "string", example: "1h" },
            },
          },
        },
      },
      TaskEnvelope: {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/Task" } },
      },
      PaginationMeta: {
        type: "object",
        required: ["page", "limit", "total", "totalPages", "hasNextPage", "hasPreviousPage"],
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
          hasNextPage: { type: "boolean" },
          hasPreviousPage: { type: "boolean" },
        },
      },
      TaskListResult: {
        type: "object",
        required: ["data", "meta"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Task" } },
          meta: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
    },
  },
};
