import mongoose from 'mongoose'
import type {
  CreateIncidentDto,
  AcknowledgeIncidentDto,
  EscalateIncidentDto,
  ResolveIncidentDto,
  AddCommentDto,
  IncidentFilters,
  PaginatedResult,
  EscalationLevel,
  UserRole,
} from '@caixalertas/types'
import { IncidentModel, type IIncidentDocument } from './incident.model'
import { NotificationService } from '../notifications/notification.service'
import { AppError } from '../../middleware/errorHandler.middleware'
import { NodoModel } from '../estructura/estructura.model'

export class IncidentService {
  constructor(private readonly notificationService: NotificationService) {}

  async create(
    dto: CreateIncidentDto,
    createdById: string,
    createdByName: string,
    createdByRole: UserRole,
    createdByGroupId?: string,
  ): Promise<IIncidentDocument> {
    await this.ensureCanCreateForGuardia(
      dto.originGroupId,
      createdById,
      createdByRole,
      createdByGroupId,
    )

    const incident = await IncidentModel.create({
      ...dto,
      originGroupId: new mongoose.Types.ObjectId(dto.originGroupId),
      involvedGroupIds: [new mongoose.Types.ObjectId(dto.originGroupId)],
      createdById: new mongoose.Types.ObjectId(createdById),
      timeline: [
        {
          type: 'created',
          userId: new mongoose.Types.ObjectId(createdById),
          userName: createdByName,
          message: `Incidencia creada por ${createdByName}`,
        },
      ],
    })

    // Notifica a la guardia activa del grupo origen
    await this.notificationService.notifyActiveGuardia(
      dto.originGroupId,
      'incident_created',
      `Nueva incidencia ${dto.severity}`,
      dto.title,
      { incidentId: incident.id as string, severity: dto.severity },
    )

    return incident
  }

  async acknowledge(
    dto: AcknowledgeIncidentDto,
    userId: string,
    userName: string,
  ): Promise<IIncidentDocument> {
    const incident = await this.findActiveOrThrow(dto.incidentId)

    if (incident.status !== 'open') {
      throw new AppError(409, 'CONFLICT', 'Incident is already acknowledged')
    }

    incident.status = 'acknowledged'
    incident.acknowledgedById = new mongoose.Types.ObjectId(userId)
    incident.acknowledgedAt = new Date()
    incident.timeline.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'acknowledged',
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      message: dto.message ?? `${userName} confirmó la recepción`,
      createdAt: new Date(),
    })

    return incident.save()
  }

  async escalate(
    dto: EscalateIncidentDto,
    userId: string,
    userName: string,
  ): Promise<IIncidentDocument> {
    const incident = await this.findActiveOrThrow(dto.incidentId)
    const isCrossGroup = !!dto.targetGroupId

    const availableLevels = await this.getEscalationLevels(incident.originGroupId.toString())
    if (!availableLevels.includes(dto.targetLevel as EscalationLevel)) {
      throw new AppError(
        400,
        'BAD_REQUEST',
        'El nivel indicado no existe en la jerarquía de esta guardia',
      )
    }
    if (dto.targetLevel <= incident.currentEscalationLevel) {
      throw new AppError(409, 'CONFLICT', 'La incidencia ya está en ese nivel o en uno superior')
    }

    if (dto.targetGroupId) {
      const targetGuardia = await NodoModel.exists({ _id: dto.targetGroupId, tipo: 'guardia' })
      if (!targetGuardia) {
        throw new AppError(404, 'NOT_FOUND', 'Guardia de destino no encontrada')
      }
      if (dto.targetGroupId === incident.originGroupId.toString()) {
        throw new AppError(
          400,
          'BAD_REQUEST',
          'La guardia de destino debe ser distinta de la guardia de origen',
        )
      }
    }

    incident.currentEscalationLevel = dto.targetLevel as EscalationLevel
    incident.status = 'escalated'

    if (isCrossGroup && dto.targetGroupId) {
      const targetGroupObjectId = new mongoose.Types.ObjectId(dto.targetGroupId)
      if (!incident.involvedGroupIds.some((id) => id.equals(targetGroupObjectId))) {
        incident.involvedGroupIds.push(targetGroupObjectId)
      }
    }

    incident.timeline.push({
      _id: new mongoose.Types.ObjectId(),
      type: isCrossGroup ? 'cross_group' : 'escalated',
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      message: `${userName} escaló al nivel ${dto.targetLevel}: ${dto.reason}`,
      metadata: {
        targetLevel: dto.targetLevel,
        reason: dto.reason,
        targetGroupId: dto.targetGroupId,
      },
      createdAt: new Date(),
    })

    await incident.save()

    // Notifica al siguiente nivel
    if (isCrossGroup && dto.targetGroupId) {
      await this.notificationService.notifyActiveGuardia(
        dto.targetGroupId,
        'incident_cross_group',
        `Incidencia derivada de ${incident.originGroupId.toString()}`,
        incident.title,
        {
          incidentId: incident.id as string,
          severity: incident.severity,
          escalationLevel: dto.targetLevel,
        },
      )
    }

    return incident
  }

  async resolve(
    dto: ResolveIncidentDto,
    userId: string,
    userName: string,
  ): Promise<IIncidentDocument> {
    const incident = await this.findActiveOrThrow(dto.incidentId)

    incident.status = 'resolved'
    incident.resolvedById = new mongoose.Types.ObjectId(userId)
    incident.resolvedAt = new Date()
    incident.resolutionSummary = dto.resolutionSummary
    incident.rootCause = dto.rootCause
    incident.preventiveActions = dto.preventiveActions

    incident.timeline.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'resolved',
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      message: `${userName} resolvió la incidencia: ${dto.resolutionSummary}`,
      createdAt: new Date(),
    })

    return incident.save()
  }

  async addComment(
    dto: AddCommentDto,
    userId: string,
    userName: string,
  ): Promise<IIncidentDocument> {
    const incident = await this.findActiveOrThrow(dto.incidentId)

    incident.timeline.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'comment',
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      message: dto.message,
      createdAt: new Date(),
    })

    return incident.save()
  }

  async list(filters: IncidentFilters): Promise<PaginatedResult<IIncidentDocument>> {
    const { page = 1, limit = 20, ...rest } = filters
    const query: Record<string, unknown> = {}

    if (rest.status)
      query['status'] = Array.isArray(rest.status) ? { $in: rest.status } : rest.status
    if (rest.severity)
      query['severity'] = Array.isArray(rest.severity) ? { $in: rest.severity } : rest.severity
    if (rest.groupId)
      query['$or'] = [{ originGroupId: rest.groupId }, { involvedGroupIds: rest.groupId }]
    if (rest.slaBreached !== undefined) query['slaBreached'] = rest.slaBreached
    if (rest.dateFrom || rest.dateTo) {
      query['createdAt'] = {}
      if (rest.dateFrom)
        (query['createdAt'] as Record<string, unknown>)['$gte'] = new Date(rest.dateFrom)
      if (rest.dateTo)
        (query['createdAt'] as Record<string, unknown>)['$lte'] = new Date(rest.dateTo)
    }
    if (rest.search) {
      query['$or'] = [
        { title: { $regex: rest.search, $options: 'i' } },
        { description: { $regex: rest.search, $options: 'i' } },
        { application: { $regex: rest.search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      IncidentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      IncidentModel.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / limit)
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  }

  async getById(id: string): Promise<IIncidentDocument> {
    return this.findActiveOrThrow(id)
  }

  // Método interno: comprueba SLAs y auto-escala — llamado por el job scheduler
  async checkSlaBreaches(): Promise<void> {
    const now = new Date()
    await IncidentModel.updateMany(
      { slaDeadline: { $lt: now }, slaBreached: false, status: { $nin: ['resolved', 'closed'] } },
      { $set: { slaBreached: true } },
    )
  }

  private async findActiveOrThrow(id: string): Promise<IIncidentDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid incident ID')
    }
    const incident = await IncidentModel.findOne({ _id: id, isActive: true })
    if (!incident) throw new AppError(404, 'NOT_FOUND', 'Incident not found')
    return incident
  }

  private async ensureCanCreateForGuardia(
    guardiaId: string,
    userId: string,
    role: UserRole,
    userGroupId?: string,
  ): Promise<void> {
    const isCoordinator = ['superadmin', 'responsable_cliente', 'responsable_grupo'].includes(role)
    const guardia = await NodoModel.findOne({
      _id: guardiaId,
      tipo: 'guardia',
    }).select('miembros responsables')

    if (!guardia) {
      throw new AppError(404, 'NOT_FOUND', 'Guardia no encontrada')
    }
    if (isCoordinator || userGroupId === guardiaId) {
      return
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const belongsToGuardia =
      guardia.miembros.some((id) => id.equals(userObjectId)) ||
      guardia.responsables.some((id) => id.equals(userObjectId))

    if (!belongsToGuardia) {
      throw new AppError(403, 'FORBIDDEN', 'No puedes crear una incidencia para esta guardia')
    }
  }

  private async getEscalationLevels(originGuardiaId: string): Promise<EscalationLevel[]> {
    const levels: EscalationLevel[] = []
    const visitedNodeIds = new Set<string>([originGuardiaId])
    let currentNode = await NodoModel.findOne({ _id: originGuardiaId, tipo: 'guardia' }).select(
      'parentId',
    )

    while (currentNode?.parentId && levels.length < 5) {
      const parentId = currentNode.parentId.toString()
      if (visitedNodeIds.has(parentId)) break

      const parent = await NodoModel.findById(parentId).select('parentId')
      if (!parent) break

      visitedNodeIds.add(parentId)
      levels.push((levels.length + 2) as EscalationLevel)
      currentNode = parent
    }

    return levels
  }
}
