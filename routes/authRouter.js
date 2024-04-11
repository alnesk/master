import express from 'express';
import authControllers from '../controllers/authControllers.js';
import { userSingupSinginSchema } from '../schemas/userSchema.js';
import validateBody from '../decorators/validateBody.js';
import authenticate from '../middlewars/authenticate.js';
import upload from '../middlewars/upload.js';

const authRouter = express.Router();

authRouter.post('/register', validateBody(userSingupSinginSchema), authControllers.singup);
authRouter.post('/login', validateBody(userSingupSinginSchema), authControllers.singin);
authRouter.patch('/avatars', authenticate, upload.single('avatar'), authControllers.updateAvatar);
authRouter.get('/current', authenticate, authControllers.getCurrent);
authRouter.post('/logout', authenticate, authControllers.logout);

export default authRouter;