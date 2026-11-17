import { Router } from 'express'
import type { UserRole } from '@caixalertas/types'
import { authenticate, authorize } from '../../middleware/auth.middleware'
import { IncidentController } from './incident.controller'
import { IncidentService } from './incident.service'
import { NotificationService } from '../notifications/notification.service'

const router = Router()
const notificationService = new NotificationService()
const service = new IncidentService(notificationService)
const controller = new IncidentController(service)

// Todas las rutas requieren autenticación
router.use(authenticate)

router.get('/', controller.list)
router.get('/:id', controller.getById)

const operators: UserRole[] = ['miembro_guardia', 'responsable_guardia', 'responsable_grupo', 'responsable_cliente', 'superadmin']
router.post('/', authorize(...operators), controller.create)
router.post('/:id/acknowledge', authorize(...operators), controller.acknowledge)
router.post('/:id/escalate', authorize(...operators), controller.escalate)
router.post('/:id/resolve', authorize(...operators), controller.resolve)
router.post('/:id/comments', authorize(...operators), controller.addComment)

export default router
