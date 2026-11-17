import { Router, type Request, type Response, type NextFunction } from 'express'
import { authenticate, authorize } from '../../middleware/auth.middleware'
import { EstructuraService } from './estructura.service'
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/responses'

const router = Router()
const service = new EstructuraService()

router.use(authenticate)

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await service.getTree()) } catch (e) { next(e) }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await service.getById(req.params['id'] ?? '')) } catch (e) { next(e) }
})

router.post('/', authorize('superadmin', 'responsable_grupo'), async (req: Request, res: Response, next: NextFunction) => {
  try { sendCreated(res, await service.create(req.body)) } catch (e) { next(e) }
})

router.patch('/:id', authorize('superadmin', 'responsable_grupo'), async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await service.update(req.params['id'] ?? '', req.body)) } catch (e) { next(e) }
})

router.delete('/:id', authorize('superadmin'), async (req: Request, res: Response, next: NextFunction) => {
  try { await service.delete(req.params['id'] ?? ''); sendNoContent(res) } catch (e) { next(e) }
})

export default router
