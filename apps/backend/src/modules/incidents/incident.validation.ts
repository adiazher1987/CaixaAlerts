import Joi from 'joi'
import type { CreateIncidentDto, EscalateIncidentDto, ResolveIncidentDto } from '@caixalertas/types'

export const validateCreateIncident = (data: unknown) =>
  Joi.object<CreateIncidentDto>({
    title: Joi.string().trim().min(5).max(200).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    application: Joi.string().trim().min(1).max(100).required(),
    severity: Joi.string().valid('P1', 'P2', 'P3', 'P4').required(),
    originGroupId: Joi.string().hex().length(24).required(),
    externalCallerId: Joi.string().trim().max(100).optional(),
    externalCallerPhone: Joi.string().trim().max(20).optional(),
  }).validate(data, { abortEarly: false })

export const validateEscalate = (data: unknown) =>
  Joi.object<Omit<EscalateIncidentDto, 'incidentId'>>({
    targetLevel: Joi.number().integer().min(1).max(6).required(),
    reason: Joi.string().trim().min(5).max(500).required(),
    targetGroupId: Joi.string().hex().length(24).optional(),
  }).validate(data, { abortEarly: false })

export const validateResolve = (data: unknown) =>
  Joi.object<Omit<ResolveIncidentDto, 'incidentId'>>({
    resolutionSummary: Joi.string().trim().min(10).max(2000).required(),
    rootCause: Joi.string().trim().max(1000).optional(),
    preventiveActions: Joi.string().trim().max(1000).optional(),
  }).validate(data, { abortEarly: false })
