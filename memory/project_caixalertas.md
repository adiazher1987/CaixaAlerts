---
name: Project CaixAlertas
description: App interna NTT Data para gestión de guardias 24x7 e incidencias en cliente CaixaBank. Stack completo y contexto de negocio.
type: project
---

App interna de NTT Data para gestionar guardias 24x7 e incidencias en el cliente CaixaBank.

**Why:** NTT Data tiene múltiples grupos (G8-Arquitectura, G9-Data, G10-Aplicaciones...) cada uno con guardias 24x7. Problema: falta visibilidad de llamadas nocturnas a nivel grupo/cuenta, y la comunicación entre guardias de distintos grupos pasa por CaixaBank en lugar de ser directa entre equipos NTT Data.

**How to apply:** Toda decisión de diseño debe resolver estos dos problemas centrales: visibilidad de incidencias y comunicación directa inter-guardia.

## Stack tecnológico
- **Frontend:** React Native + Expo (iOS, Android, Web desde mismo código)
- **Navegación:** expo-router (file-based)
- **Estado:** Zustand + React Query (TanStack)
- **Formularios:** React Hook Form + Zod
- **Backend:** Node.js + Express + TypeScript
- **BD:** MongoDB con Mongoose
- **Push:** Firebase Cloud Messaging (FCM) vía Firebase Admin SDK
- **i18n:** i18next (es, en, ca) — fallback chain ca→es→en
- **Monorepo:** Turborepo con workspaces

## Estructura del monorepo
```
/
├── apps/backend/        Express + MongoDB
├── apps/mobile/         React Native + Expo
├── packages/types/      Tipos TypeScript compartidos
├── packages/i18n/       Traducciones es/en/ca
└── packages/api-client/ SDK tipado del backend
```

## Entidades principales
- **Group:** G8, G9, G10... con código, nombre y responsable
- **Guardia:** Turno 24x7 con miembros, fechas, estado (active/scheduled/completed)
- **Incident:** Severidad P1-P4, estado (open→acknowledged→in_progress→escalated→resolved→closed), SLA automático, timeline inmutable
- **Notification:** Centro de notificaciones en app + push FCM

## Roles (RBAC)
- `superadmin` → toda la plataforma
- `admin_grupo` → su grupo
- `responsable` → escalados N3+, reporting
- `guardia` → crear/ACK/escalar/resolver incidencias
- `readonly` → solo consulta

## Niveles de escalado
- N1: Guardia activa (mismo grupo)
- N2: Responsable de guardia
- N3: Responsable de grupo
- N4: Responsable de cliente NTT Data
- N5: Responsable de cuenta
- N6: CEO / Dirección

## SLA por severidad
- P1: 4h (auto-escala cada 10 min sin ACK)
- P2: 8h (auto-escala cada 30 min)
- P3: 24h (auto-escala cada 60 min)
- P4: 72h (auto-escala cada 120 min)

## Features clave implementadas
- Login con biometría (Face ID / Touch ID) tras primer login correcto
- Deep links para push enriquecidos: `caixalertas://incidents/:id`
- Paginación cursor-based en listados
- API versionada `/api/v1/`
- Config multi-entorno (.env.development / .env.staging / .env.production)
- Auto-escalado por timeout (job scheduler pendiente de implementar)
- Cross-group: derivar incidencia a guardia de otro grupo sin pasar por CaixaBank
- Centro de notificaciones con badge de no leídas
- Reporting por período, grupo, severidad con export PDF/Excel

## Login corporativo
Actualmente fake (email+password). Preparado para sustituir por OIDC/SAML corporativo NTT Data/CaixaBank sin romper la arquitectura de auth.

## Pendiente de implementar (próximos pasos)
- Motor de auto-escalado (Bull queue job cada X minutos)
- Módulo reports/service completo con agregaciones MongoDB
- Módulo groups/routes completo
- Módulo users/routes completo
- Pantalla create incident en mobile
- Tests unitarios e integración
- EAS Build configuration
- CI/CD pipeline (GitHub Actions)
- Pantalla de gestión de grupos y guardias
