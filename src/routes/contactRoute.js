import { Router } from 'express';
import { createContactRequest } from '../controllers/contactController.js';
import { getAllContacts } from '../controllers/contactController.js';
import { resolveContact } from '../controllers/contactController.js';
import { unresolveContact } from '../controllers/contactController.js';

export const contactRouter = Router();

contactRouter.post('/', createContactRequest);
contactRouter.get('/all', getAllContacts);
contactRouter.put('/:id/resolve', resolveContact);
contactRouter.put('/:id/unresolve', unresolveContact);  