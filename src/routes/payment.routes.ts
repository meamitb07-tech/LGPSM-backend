import { Router, Request, Response, NextFunction } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/authenticate';
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validator';

const router = Router();

const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.format() });
  }
  req.body = result.data;
  next();
};

// Razorpay Public Webhook (unauthenticated signature verified)
router.post('/payments/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authenticate);

router.post('/payments/order', validate(createOrderSchema), paymentController.createTicketOrder);
router.post('/payments/verify', validate(verifyPaymentSchema), paymentController.verifyPayment);
router.get('/orders', paymentController.getUserOrders);
router.get('/orders/:id', paymentController.getOrderById);
router.get('/invoices/:id', paymentController.getInvoiceById);

export default router;
