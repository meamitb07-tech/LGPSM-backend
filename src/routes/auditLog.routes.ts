import { Router } from 'express';
import { auditLogController } from '../controllers/auditLog.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { Role } from '../models/User';

const router = Router();

router.use(authenticate);

// View audit logs - ADMIN and ORGANIZER
router.get('/', authorizeRoles(Role.ADMIN, Role.ORGANIZER), auditLogController.getLogs);

export default router;
