import express from 'express';
import contactsControllers from '../controllers/contactsControllers.js';
import { addContactSchema, updateContactSchema, updateContactStatusSchema } from '../schemas/contactsSchema.js';
import validateBody from '../decorators/validateBody.js';
import isValidId from '../middlewars/isvalidId.js';
import authenticate from '../middlewars/authenticate.js';

import upload from '../middlewars/upload.js';

const contactsRouter = express.Router();

contactsRouter.use(authenticate);

contactsRouter.get('/', contactsControllers.getAll);

contactsRouter.post('/', upload.single("poster"), validateBody(addContactSchema), contactsControllers.addContact);

contactsRouter.get('/:id', isValidId, contactsControllers.getById);

contactsRouter.put('/:id', isValidId, validateBody(updateContactSchema), contactsControllers.updateContact);

contactsRouter.delete('/:id', isValidId, contactsControllers.deleteContact);

contactsRouter.patch(
  '/:id/favorite',
  isValidId,
  validateBody(updateContactStatusSchema),
  contactsControllers.updateContactStatus
);

export default contactsRouter;
