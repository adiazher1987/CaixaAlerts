import type { AxiosInstance } from 'axios'
import type { IncidentReport, ReportFilters, ReportFormat, ApiResponse } from '@caixalertas/types'

export const createReportEndpoints = (client: AxiosInstance) => ({
  getIncidentReport: (filters: ReportFilters) =>
    client
      .get<ApiResponse<IncidentReport>>('/reports/incidents', { params: filters })
      .then((r) => r.data),

  exportReport: (filters: ReportFilters, format: ReportFormat) =>
    client.get('/reports/incidents/export', {
      params: { ...filters, format },
      responseType: format === 'json' ? 'json' : 'blob',
    }),
})
