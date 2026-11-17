# CaixaAlerts — Documentación Técnica Completa

> Este fichero es la fuente de verdad del proyecto. Se actualiza con cada cambio de requisitos, arquitectura o funcionalidad.
>
> **Última actualización:** 2026-04-16

---

## Índice

1. [Visión General](#1-visión-general)
2. [Estructura del Monorepo](#2-estructura-del-monorepo)
3. [Backend](#3-backend)
4. [Mobile](#4-mobile)
5. [Paquetes Compartidos](#5-paquetes-compartidos)
6. [Infraestructura y Servicios Externos](#6-infraestructura-y-servicios-externos)
7. [Flujos Clave](#7-flujos-clave)
8. [Comandos de Desarrollo y Build](#8-comandos-de-desarrollo-y-build)

---

## 1. Visión General

**CaixaAlerts** es una plataforma de gestión de incidentes y guardias de on-call. Permite crear, escalar, resolver y reportar incidentes con control SLA, notificaciones push en tiempo real y acceso por roles jerarquizados.

### Stack tecnológico global

| Capa | Tecnología |
|------|-----------|
| Lenguaje | TypeScript 5.4+ |
| Node.js | ≥20.0.0 |
| Package manager | npm 10.9.7 |
| Monorepo | Turborepo 2.x |
| Base de datos | MongoDB (Mongoose 8.3) |
| Caché / Cola | Redis (ioredis 5.3) |
| Push notifications | Firebase Cloud Messaging (firebase-admin 12.0) |
| Email | Nodemailer 6.9 (SMTP) |
| App móvil | React Native 0.79.6 + Expo 53 |

---

## 2. Estructura del Monorepo

```
CaixaAlerts/
├── apps/
│   ├── backend/          # API REST — Express.js
│   └── mobile/           # App móvil — React Native / Expo
├── packages/
│   ├── types/            # Tipos TypeScript compartidos
│   ├── api-client/       # SDK Axios con interceptores
│   └── i18n/             # Traducciones (ES, EN, CA)
├── package.json          # Workspace root
├── turbo.json            # Pipeline Turbo
├── tsconfig.base.json    # TS config base
└── .env.example          # Ejemplo de variables de entorno
```

### Scripts raíz

```bash
npm run dev:backend    # Levanta solo el backend (turbo filter)
npm run dev:mobile     # Levanta solo la app móvil (turbo filter)
npm run build          # Build de todos los paquetes
npm run test           # Tests de todos los paquetes
npm run lint           # Lint de todos los paquetes
npm run typecheck      # Type check global
npm run clean          # Limpia dist/ y node_modules
```

---

## 3. Backend

**Ruta:** `apps/backend/`
**Framework:** Express.js 4.19
**Arranque dev:** `tsx watch src/server.ts`

### 3.1 Estructura de directorios

```
apps/backend/src/
├── app.ts                          # Configuración de Express
├── server.ts                       # Bootstrap del servidor
├── config/
│   └── index.ts                    # Carga de variables de entorno
├── database/
│   └── connection.ts               # Conexión MongoDB
├── middleware/
│   ├── auth.middleware.ts          # JWT + autorización por rol
│   ├── errorHandler.middleware.ts  # Manejo global de errores
│   └── rateLimiter.middleware.ts   # Rate limiting global y por login
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   └── auth.service.ts
│   ├── incidents/
│   │   ├── incident.routes.ts
│   │   ├── incident.controller.ts
│   │   ├── incident.service.ts
│   │   ├── incident.model.ts
│   │   └── incident.validation.ts
│   ├── users/
│   │   ├── user.routes.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.model.ts
│   ├── estructura/
│   │   ├── estructura.routes.ts
│   │   ├── estructura.service.ts
│   │   └── estructura.model.ts
│   ├── groups/
│   │   └── guardia.model.ts
│   └── notifications/
│       ├── notification.service.ts
│       ├── notification.model.ts
│       └── firebase.service.ts
└── utils/
    ├── jwt.ts                      # Firma y verificación JWT
    ├── logger.ts                   # Winston logger
    └── responses.ts                # Helpers de respuesta estándar
```

### 3.2 Variables de entorno

```bash
# Entorno
APP_ENV=development|staging|production
NODE_ENV=development|production
BACKEND_PORT=3000
BACKEND_API_PREFIX=/api/v1

# Base de datos
MONGODB_URI=mongodb://localhost:27017/caixalertas_dev
MONGODB_DB_NAME=caixalertas_dev

# Caché
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=<mínimo 32 caracteres>
JWT_REFRESH_SECRET=<mínimo 32 caracteres>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:8081,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Firebase Admin SDK
FIREBASE_PROJECT_ID=<proyecto>
FIREBASE_CLIENT_EMAIL=<sa>@<proyecto>.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=<password>
EMAIL_FROM="CaixAlertas <alerts@example.com>"

# Logging
LOG_LEVEL=debug|info|warn|error
```

### 3.3 Seguridad

| Parámetro | Valor |
|-----------|-------|
| Bcrypt rounds | 12 |
| Max intentos de login | 5 |
| Duración bloqueo de cuenta | 30 minutos |
| Rate limit global | 100 req / 15 min |
| Rate limit login | 10 req / 15 min (más estricto en producción) |

### 3.4 Roles y jerarquía

```typescript
type UserRole =
  | 'superadmin'           // Admin completo de la plataforma (nivel 5)
  | 'responsable_cliente'  // Visibilidad global del cliente     (nivel 4)
  | 'responsable_grupo'    // Gestiona su grupo                  (nivel 3)
  | 'responsable_guardia'  // Jefe del turno de guardia          (nivel 2)
  | 'miembro_guardia'      // Miembro del equipo de guardia      (nivel 1)
  | 'readonly'             // Solo lectura                       (nivel 0)
```

### 3.5 API Endpoints

**Prefijo base:** `/api/v1`

#### Health Check

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Estado del servidor |

#### Autenticación — `/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login con email/password + fcmToken opcional |
| POST | `/auth/refresh` | No | Renovar access token con refresh token |
| POST | `/auth/logout` | JWT | Logout (elimina FCM token de sesión) |
| GET | `/auth/me` | JWT | Perfil del usuario autenticado |

**Login request:** `{ email, password, fcmToken? }`
**Login response:** `{ user, accessToken, refreshToken, expiresIn }`
**Refresh request:** `{ refreshToken }`
**Refresh response:** `{ accessToken, expiresIn }`

#### Incidentes — `/incidents`

| Método | Ruta | Auth | Roles mínimos | Descripción |
|--------|------|------|---------------|-------------|
| GET | `/incidents` | JWT | Todos | Listar con filtros y paginación |
| GET | `/incidents/:id` | JWT | Todos | Detalle del incidente |
| POST | `/incidents` | JWT | miembro_guardia+ | Crear incidente |
| POST | `/incidents/:id/acknowledge` | JWT | miembro_guardia+ | Marcar como reconocido |
| POST | `/incidents/:id/escalate` | JWT | miembro_guardia+ | Escalar a nivel/grupo |
| POST | `/incidents/:id/resolve` | JWT | miembro_guardia+ | Resolver incidente |
| POST | `/incidents/:id/comments` | JWT | miembro_guardia+ | Añadir comentario al timeline |

**Filtros de listado:** `{ status?, severity?, groupId?, page?, limit? }`

#### Usuarios — `/users`

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/users` | JWT | Admin | Listar usuarios |
| GET | `/users/:id` | JWT | Admin | Detalle de usuario |
| POST | `/users` | JWT | Admin | Crear usuario |
| PATCH | `/users/:id` | JWT | Admin | Actualizar usuario |
| POST | `/users/:id/unlock` | JWT | Admin | Desbloquear cuenta |
| DELETE | `/users/:id` | JWT | Admin | Desactivar usuario (soft delete) |

#### Estructura — `/estructura`

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | `/estructura` | JWT | Todos | Árbol completo de la estructura |
| GET | `/estructura/:id` | JWT | Todos | Detalle de nodo |
| POST | `/estructura` | JWT | Admin | Crear nodo |
| PATCH | `/estructura/:id` | JWT | Admin | Actualizar nodo |
| DELETE | `/estructura/:id` | JWT | Superadmin | Eliminar nodo |

### 3.6 Modelos MongoDB

#### User

```typescript
{
  email: String          // unique, lowercase, indexed
  passwordHash: String   // bcrypt hash
  name: String
  phone?: String
  role: UserRole
  groupId?: ObjectId
  fcmTokens: String[]    // tokens para push notifications
  biometricEnabled: Boolean
  isActive: Boolean      // indexed
  loginAttempts: Number
  lockedUntil?: Date
  lastLoginAt?: Date
  timestamps: true
}
```

**Índices:** `{ email: 1 }` (unique), `{ isActive: 1 }`

#### Incident

```typescript
{
  title: String
  description: String
  application?: String
  severity: 'P1'|'P2'|'P3'|'P4'        // indexed
  status: 'open'|'acknowledged'|'in_progress'|'escalated'|'resolved'|'closed'  // indexed
  currentEscalationLevel: 1-6
  originGroupId: ObjectId                // indexed
  involvedGroupIds: ObjectId[]
  createdById: ObjectId
  acknowledgedById?: ObjectId
  acknowledgedAt?: Date
  resolvedById?: ObjectId
  resolvedAt?: Date
  resolutionSummary?: String
  rootCause?: String
  preventiveActions?: String
  closedAt?: Date
  slaDeadline: Date                      // indexed
  slaBreached: Boolean                   // indexed
  externalCallerId?: String
  externalCallerPhone?: String
  timeline: TimelineEvent[]
  isActive: Boolean
  timestamps: true
}
```

**TimelineEvent:**
```typescript
{
  type: 'created'|'acknowledged'|'escalated'|'cross_group'|'status_changed'|'comment'|'resolved'|'closed'|'auto_escalated'
  userId: ObjectId
  userName: String
  message: String
  metadata?: {
    targetLevel?: number
    reason?: string
    targetGroupId?: string
    [key: string]: unknown
  }
  createdAt: Date
}
```

**Índices:** `severity`, `status`, `originGroupId`, `slaDeadline`, `slaBreached`

#### Notification

```typescript
{
  userId: ObjectId   // indexed
  type: NotificationType
  title: String
  body: String
  data?: NotificationData
  isRead: Boolean    // indexed
  readAt?: Date
  timestamps: { createdAt: true, updatedAt: false }
}
```

**Índices:** `{ userId: 1, createdAt: -1 }`, `{ userId: 1, isRead: 1 }`

#### Guardia (turno on-call)

```typescript
{
  groupId: ObjectId    // indexed
  name: String
  memberIds: ObjectId[]
  responsableId?: ObjectId
  startAt: Date        // indexed
  endAt: Date          // indexed
  status: 'active'|'scheduled'|'completed'|'cancelled'  // indexed
  notes?: String
  timestamps: true
}
```

**Índice compuesto:** `{ groupId: 1, status: 1, startAt: 1 }`

#### NodoEstructura (jerarquía organizativa)

```typescript
{
  nombre: String
  tipo: 'cliente'|'agrupacion'|'guardia'
  parentId?: ObjectId
  contactosAlerta: ObjectId[]
  descripcion?: String
  responsables: ObjectId[]
  miembros: ObjectId[]
  aplicaciones: [{
    idCliente: String
    nombre: String
    descripcion?: String
  }]
  timestamps: true
}
```

### 3.7 Servicios

#### AuthService
- `login()` — Valida credenciales, gestiona intentos fallidos, registra FCM token
- `refresh()` — Devuelve nuevo access token
- `logout()` — Elimina FCM token de la sesión
- `getProfile()` — Devuelve perfil público del usuario

#### IncidentService
- `create()` — Crea incidente, calcula deadline SLA, notifica guardia activa
- `acknowledge()` — Marca reconocido, añade evento al timeline
- `escalate()` — Sube nivel de escalada, añade grupos involucrados, envía notificaciones
- `resolve()` — Registra detalles de resolución
- `addComment()` — Añade comentario al timeline
- `list()` — Filtra por estado, severidad, grupo; pagina resultados

#### UserService
- `list()` — Lista usuarios (filtrable por grupo)
- `getById()` — Obtiene un usuario
- `create()` — Crea usuario (password hasheado vía pre-save hook)
- `update()` — Actualiza usuario (re-hashea password si cambia)
- `deactivate()` — Soft delete (`isActive = false`)
- `unlock()` — Limpia `loginAttempts` y `lockedUntil`

#### NotificationService
- `send()` — Crea registro en DB + envía push Firebase
- `notifyActiveGuardia()` — Busca guardia activa del grupo y notifica a todos los miembros
- `listForUser()` — Notificaciones paginadas de un usuario
- `markRead()` — Marca notificaciones como leídas
- `markAllRead()` — Marca todas como leídas
- `getUnreadCount()` — Cuenta no leídas

#### EstructuraService
- `getTree()` — Todos los nodos ordenados por tipo/nombre
- `getById()` — Un nodo específico
- `create()` — Crea nodo (valida que el padre exista y no sea tipo guardia)
- `update()` — Actualiza nodo
- `delete()` — Elimina nodo (solo si no tiene hijos)

### 3.8 SLA y Escalada automática

#### SLA por severidad

| Severidad | SLA | Escalada automática |
|-----------|-----|---------------------|
| P1 — Crítico | 4 horas | 10 minutos |
| P2 — Alto | 8 horas | 30 minutos |
| P3 — Medio | 24 horas | 60 minutos |
| P4 — Bajo | 72 horas | 120 minutos |

#### Niveles de escalada

| Nivel | Receptor |
|-------|---------|
| 1 | Equipo de guardia activo |
| 2 | Responsable de guardia |
| 3 | Responsable de grupo |
| 4 | Responsable de cliente |
| 5 | Responsable de cuenta |
| 6 | CEO / Dirección |

---

## 4. Mobile

**Ruta:** `apps/mobile/`
**Framework:** React Native 0.79.6 + Expo 53
**Arranque dev:** `EXPO_ROUTER_APP_ROOT=app expo start`

### 4.1 Stack técnico

| Librería | Versión | Uso |
|----------|---------|-----|
| Expo Router | 5.1.11 | Navegación file-based |
| Zustand | 5.0 | Estado global |
| TanStack React Query | 5.60 | Data fetching y caché |
| React Hook Form | 7.53 | Formularios |
| Zod | 3.23 | Validación |
| expo-local-authentication | 16.0.5 | Biometría |
| expo-notifications | 0.31.5 | Push notifications |
| expo-secure-store | 14.2.4 | Almacenamiento seguro |
| date-fns | 3.6 | Formateo de fechas |
| i18next | 23.11 | Internacionalización |

### 4.2 Estructura de directorios

```
apps/mobile/
├── app/
│   ├── _layout.tsx               # Layout raíz — gestiona flujo auth
│   ├── index.tsx                 # Redirección raíz
│   ├── (auth)/
│   │   ├── _layout.tsx           # Stack de autenticación
│   │   └── login.tsx             # Pantalla de login
│   └── (app)/
│       ├── _layout.tsx           # Layout de tabs principales
│       ├── index.tsx             # Dashboard
│       ├── incidents/
│       │   ├── index.tsx         # Lista de incidentes
│       │   └── [id].tsx          # Detalle de incidente
│       ├── notifications/
│       │   └── index.tsx         # Centro de notificaciones
│       ├── reports/
│       │   └── index.tsx         # Informes
│       ├── admin/
│       │   ├── index.tsx         # Gestión de usuarios
│       │   ├── new.tsx           # Crear usuario
│       │   └── [id].tsx          # Editar usuario
│       └── estructura/
│           ├── index.tsx         # Gestión de estructura
│           ├── new.tsx           # Crear nodo
│           └── [id].tsx          # Editar nodo
├── src/
│   ├── config/
│   │   └── env.ts                # Variables de entorno desde Expo Constants
│   ├── providers/
│   │   └── ApiProvider.tsx       # Inicialización del API client
│   ├── stores/
│   │   └── auth.store.ts         # Estado de autenticación (Zustand)
│   ├── hooks/
│   │   ├── useIncidents.ts       # Hooks React Query para incidentes
│   │   ├── useNotifications.ts   # Hooks para notificaciones
│   │   ├── useUsers.ts           # Hooks para usuarios
│   │   ├── useEstructura.ts      # Hooks para estructura
│   │   └── useBiometrics.ts      # Hook para autenticación biométrica
│   └── services/
│       └── notifications.service.ts  # Configuración push notifications
└── app.config.ts                 # Configuración Expo
```

### 4.3 Variables de entorno

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_APP_ENV=development|staging|production
EXPO_PUBLIC_FIREBASE_API_KEY=<key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<proyecto>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<proyecto>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<app-id>
```

### 4.4 Navegación

**Stack de autenticación `(auth)`**
- `/login` — Login con email/password y biometría opcional

**Stack principal `(app)` — requiere autenticación**

Tabs de navegación inferior:
- `/` — Dashboard
- `/incidents` — Lista de incidentes
- `/notifications` — Centro de notificaciones
- `/reports` — Informes

Pantallas adicionales (acceso desde header, solo roles con permisos):
- `/admin` — Gestión de usuarios
- `/admin/new` — Crear usuario
- `/admin/[id]` — Editar usuario
- `/estructura` — Gestión de estructura organizativa
- `/estructura/new` — Crear nodo
- `/estructura/[id]` — Editar nodo

**Deep linking:** `caixalertas://incidents/:id` (desde push notifications)

### 4.5 Auth Store (Zustand)

```typescript
// Estado
{
  user: UserPublic | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Acciones
login(email, password, fcmToken?) → Promise<void>
logout() → Promise<void>
setTokens(accessToken, refreshToken) → Promise<void>
loadFromStorage() → Promise<void>
updateAccessToken(token) → void
```

**Almacenamiento (según plataforma):**
- iOS/Android: `expo-secure-store` (cifrado)
- Web: `localStorage`
- Claves: `ca_access_token`, `ca_refresh_token`, `ca_user`

### 4.6 Hooks React Query

#### Incidentes
```typescript
useIncidents(filters?)      // Lista con filtros
useIncident(id)             // Detalle por ID
useCreateIncident()         // Mutación crear
useAcknowledge()            // Mutación reconocer
useEscalate()               // Mutación escalar
useResolve()                // Mutación resolver
```

#### Notificaciones
```typescript
useNotifications(filters?)  // Lista paginada
useUnreadCount()            // Contador no leídas
useMarkRead()               // Marcar leídas
useMarkAllRead()            // Marcar todas leídas
```

#### Usuarios
```typescript
useUsers(groupId?)          // Lista (filtrable)
useUser(id)                 // Detalle
useCreateUser()             // Crear
useUpdateUser()             // Actualizar
useDeleteUser()             // Desactivar
useUnlockUser()             // Desbloquear
```

#### Estructura
```typescript
useEstructuraTree()         // Árbol completo
useNodo(id)                 // Nodo por ID
useCreateNodo()             // Crear nodo
useUpdateNodo()             // Actualizar nodo
useDeleteNodo()             // Eliminar nodo
```

### 4.7 Pantallas

| Pantalla | Ruta | Descripción |
|----------|------|-------------|
| Login | `/login` | Email/password + biometría. Registra FCM token al autenticar |
| Dashboard | `/` | Estadísticas resumen, incidentes recientes, estado SLA, acciones rápidas |
| Lista incidentes | `/incidents` | Filtros por estado (Activos/Todos), severidad, SLA breach, pull-to-refresh |
| Detalle incidente | `/incidents/[id]` | Info completa, timeline, acciones (reconocer/escalar/resolver), comentarios, progreso SLA |
| Notificaciones | `/notifications` | Lista paginada, filtro leído/no leído, deep link al incidente |
| Gestión usuarios | `/admin` | CRUD completo, desbloquear, desactivar |
| Gestión estructura | `/estructura` | Jerarquía cliente → agrupación → guardia |
| Informes | `/reports` | Visualización de métricas e informes de incidentes |

### 4.8 Autenticación biométrica

```typescript
useBiometrics() → {
  isAvailable: boolean,
  isEnrolled: boolean,
  biometricType: 'fingerprint' | 'facial' | 'iris' | null,
  authenticate() → Promise<boolean>,
  saveCredentials(email, password) → Promise<void>,
  getCredentials() → Promise<{ email, password }>,
  clearCredentials() → Promise<void>,
  isEnabled: boolean
}
```

- Credenciales en SecureStore con `requireAuthentication: true`
- Auto-login al abrir la app si está habilitado
- Registro explícito de credenciales tras primer login manual

### 4.9 Push Notifications

**Flujo de configuración:**
1. Solicitar permiso al usuario
2. Crear canales Android (`incidents`, `escalations`)
3. Registrar Expo push token
4. Configurar listeners foreground/background

**Canales Android:**

| Canal | Importancia | Características |
|-------|-------------|-----------------|
| `incidents` | MAX | Vibración, luz roja |
| `escalations` | HIGH | Vibración, luz naranja |

**Datos de notificación:**
```typescript
{
  incidentId?: string
  groupId?: string
  severity?: IncidentSeverity
  escalationLevel?: EscalationLevel
  deepLink?: string
}
```

---

## 5. Paquetes Compartidos

### 5.1 `@caixalertas/types`

Tipos TypeScript compartidos entre backend y mobile.

**Módulos:**

| Fichero | Contenido |
|---------|-----------|
| `auth.types.ts` | LoginDto, LoginResponse, RefreshTokenResponse, JwtPayload |
| `user.types.ts` | UserRole, User, UserPublic, CreateUserDto, UpdateUserDto |
| `incident.types.ts` | IncidentSeverity, IncidentStatus, EscalationLevel, Incident, DTOs |
| `notification.types.ts` | NotificationType, Notification, NotificationData, FcmPayload |
| `group.types.ts` | Group, Guardia, GuardiaStatus |
| `estructura.types.ts` | NodoEstructura, NodoTipo, CreateNodoDto, UpdateNodoDto |
| `report.types.ts` | IncidentReport, GroupReport, EscalationStats, ReportFilters |

**Tipos clave:**
```typescript
type UserRole = 'superadmin' | 'responsable_cliente' | 'responsable_grupo' | 'responsable_guardia' | 'miembro_guardia' | 'readonly'
type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'
type IncidentStatus = 'open' | 'acknowledged' | 'in_progress' | 'escalated' | 'resolved' | 'closed'
type EscalationLevel = 1 | 2 | 3 | 4 | 5 | 6

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  statusCode: number
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}
```

### 5.2 `@caixalertas/api-client`

SDK Axios con interceptores de autenticación automática.

**Ficheros:**
- `client.ts` — Factoría del cliente Axios
- `endpoints/` — Clases de servicio por dominio

**Características:**
- Auto-refresh de token en respuestas 401
- Cola de requests durante el refresco
- `ApiError` tipado
- Timeout: 15 segundos

**Inicialización:**
```typescript
initApiClient({
  baseURL: ENV.apiUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokenRefreshed: (token) => updateAccessToken(token),
  onAuthFailure: () => logout()
})
```

**Métodos disponibles:**
```typescript
const client = getApiClient()

// Auth
client.auth.login(dto)
client.auth.logout(refreshToken)
client.auth.refresh(dto)
client.auth.changePassword(dto)
client.auth.me()

// Incidentes
client.incidents.list(filters)
client.incidents.getById(id)
client.incidents.create(dto)
client.incidents.acknowledge(dto)
client.incidents.escalate(dto)
client.incidents.resolve(dto)
client.incidents.close(id)
client.incidents.addComment(dto)

// Notificaciones
client.notifications.list(filters)
client.notifications.markRead(dto)
client.notifications.markAllRead()
client.notifications.getUnreadCount()
client.notifications.registerFcmToken(token, platform)

// Usuarios
client.users.list(groupId?)
client.users.getById(id)
client.users.create(dto)
client.users.update(id, dto)
client.users.unlock(id)
client.users.deactivate(id)

// Estructura
client.estructura.getTree()
client.estructura.getById(id)
client.estructura.create(dto)
client.estructura.update(id, dto)
client.estructura.delete(id)

// Grupos
client.groups.list()
client.groups.create(dto)
client.groups.update(id, dto)

// Informes
client.reports.getIncidentReport(filters)
client.reports.exportReport(filters, format)
```

### 5.3 `@caixalertas/i18n`

Internacionalización con i18next para 3 idiomas.

**Idiomas:** Español (es), Inglés (en), Catalán (ca)

**Namespaces:**

| Namespace | Contenido |
|-----------|-----------|
| `common.json` | Navegación, acciones comunes (guardar, cancelar, editar), estados, errores generales |
| `auth.json` | Formulario de login, prompts biométricos, validaciones |
| `incidents.json` | Estados, severidades, acciones, etiquetas de timeline |

**Uso:**
```typescript
const i18n = initI18n(deviceLanguage) // 'es' | 'en' | 'ca'
const { t } = useTranslation('incidents')
```

---

## 6. Infraestructura y Servicios Externos

| Servicio | Propósito | Variables de configuración |
|----------|-----------|---------------------------|
| **MongoDB** | Base de datos principal | `MONGODB_URI`, `MONGODB_DB_NAME` |
| **Redis** | Caché de sesiones, rate limiting | `REDIS_URL` |
| **Firebase Cloud Messaging** | Push notifications | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| **SMTP** | Emails transaccionales | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |
| **Expo EAS** | Builds y OTA updates | Configurado en `app.config.ts` |

---

## 7. Flujos Clave

### 7.1 Ciclo de vida de un incidente

```
Crear → open
  → Acknowledge → acknowledged
  → Escalar → escalated
  → Resolver → resolved
  → Cerrar (post-mortem) → closed
```

1. **Crear:** Operador crea incidente → Backend calcula SLA deadline → Notifica guardia activa
2. **Reconocer:** Miembro confirma recepción → `open` → `acknowledged`
3. **Escalar:** Sube a nivel/grupo superior → `escalated` → Notifica grupo destino
4. **Resolver:** Registra detalles (`resolutionSummary`, `rootCause`, `preventiveActions`) → `resolved`
5. **Cerrar:** Post-mortem completado → `closed`

### 7.2 Flujo de autenticación (Mobile)

1. **Arranque de app:**
   - Auth store carga tokens desde SecureStore
   - Si autenticado → navega a app
   - Si no → muestra login

2. **Login:**
   - Usuario introduce email/password (o usa biometría)
   - Se solicita FCM token del dispositivo
   - Backend valida credenciales → devuelve access + refresh tokens
   - Tokens guardados en SecureStore
   - Navega al Dashboard

3. **Renovación automática de token:**
   - Access token expira (15 min)
   - API client intercepta respuesta 401
   - Solicita nuevo access token con refresh token
   - Reintenta la request original
   - Si falla el refresh → logout forzado

4. **Logout:**
   - Limpia SecureStore
   - Resetea estado Zustand
   - Redirige a `/login`

### 7.3 Flujo de push notifications

1. **Registro:** App obtiene FCM token → lo envía al backend en el login
2. **Evento:** Backend crea incidente / escala → `NotificationService.notifyActiveGuardia()`
3. **Envío:** Backend consulta guardia activa del grupo → envía Firebase Cloud Message a todos los miembros
4. **Recepción:** Dispositivo muestra notificación (foreground: alerta en app, background: notificación del sistema)
5. **Tap:** Deep link abre `caixalertas://incidents/:id` → pantalla de detalle

---

## 8. Comandos de Desarrollo y Build

### Desarrollo local

```bash
# Desde la raíz (con Turbo)
npm run dev:backend    # Solo backend
npm run dev:mobile     # Solo mobile

# Directamente en cada app
cd apps/backend && npm run dev     # tsx watch
cd apps/mobile && npm run dev      # expo start
```

### Mobile — plataformas

```bash
npm run android        # Dispositivo Android físico
npm run ios            # iOS
npm run web            # Web (expo start --web)
```

### Build

```bash
# Desde raíz
npm run build          # Build de todos los paquetes

# Backend
cd apps/backend && npm run build   # tsc → dist/
cd apps/backend && npm run start   # node dist/server.js

# Mobile (EAS)
cd apps/mobile
npm run build:android  # eas build --platform android
npm run build:ios      # eas build --platform ios
npm run build:web      # expo export --platform web
```

### Calidad de código

```bash
npm run lint           # ESLint en todos los paquetes
npm run typecheck      # TypeScript type check global
npm run test           # Jest en todos los paquetes
npm run clean          # Limpia dist/ y node_modules
```
