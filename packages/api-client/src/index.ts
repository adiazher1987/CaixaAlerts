import type { AxiosInstance } from 'axios'
import { createApiClient, type ApiClientConfig } from './client'
import { createAuthEndpoints } from './endpoints/auth.endpoints'
import { createIncidentEndpoints } from './endpoints/incidents.endpoints'
import { createNotificationEndpoints } from './endpoints/notifications.endpoints'
import { createGroupEndpoints } from './endpoints/groups.endpoints'
import { createReportEndpoints } from './endpoints/reports.endpoints'
import { createUserEndpoints } from './endpoints/users.endpoints'
import { createEstructuraEndpoints } from './endpoints/estructura.endpoints'

export type { ApiClientConfig }
export { createApiClient }

// ─── SDK principal ────────────────────────────────────────────────────────────
export class CaixAlertasApiClient {
  private readonly http: AxiosInstance

  readonly auth: ReturnType<typeof createAuthEndpoints>
  readonly incidents: ReturnType<typeof createIncidentEndpoints>
  readonly notifications: ReturnType<typeof createNotificationEndpoints>
  readonly groups: ReturnType<typeof createGroupEndpoints>
  readonly reports: ReturnType<typeof createReportEndpoints>
  readonly users: ReturnType<typeof createUserEndpoints>
  readonly estructura: ReturnType<typeof createEstructuraEndpoints>

  constructor(config: ApiClientConfig) {
    this.http = createApiClient(config)
    this.auth = createAuthEndpoints(this.http)
    this.incidents = createIncidentEndpoints(this.http)
    this.notifications = createNotificationEndpoints(this.http)
    this.groups = createGroupEndpoints(this.http)
    this.reports = createReportEndpoints(this.http)
    this.users = createUserEndpoints(this.http)
    this.estructura = createEstructuraEndpoints(this.http)
  }
}

// Singleton lazy — se inicializa desde la app con la config del entorno
let _instance: CaixAlertasApiClient | null = null

export const initApiClient = (config: ApiClientConfig): CaixAlertasApiClient => {
  _instance = new CaixAlertasApiClient(config)
  return _instance
}

export const getApiClient = (): CaixAlertasApiClient => {
  if (!_instance) throw new Error('API client not initialized. Call initApiClient() first.')
  return _instance
}
