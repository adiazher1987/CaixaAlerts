import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.middleware'
import { UserController } from './user.controller'
import { UserService } from './user.service'

const router = Router()
const controller = new UserController(new UserService())

router.use(authenticate)
router.use(authorize('superadmin', 'responsable_grupo'))

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.post('/:id/unlock', controller.unlock)
router.delete('/:id', controller.deactivate)

export default router
