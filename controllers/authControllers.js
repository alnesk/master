import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import gravatar from 'gravatar';
import fs from 'fs/promises';
import path from 'path';
import Jimp from 'jimp';
import { nanoid } from 'nanoid';
import authServices from '../services/authService.js';
import ctrlWrapper from '../decorators/ctrlWrapper.js';
import HttpError from '../helpers/HttpError.js';
import User from '../models/User.js';
import createVerifyEmail from '../helpers/createVerifyEmail.js';
import sendMail from '../helpers/sendEmail.js';

const { JWT_SECRET } = process.env;

const singup = async (req, res) => {
  const { email, password } = req.body;
  const user = await authServices.findUser({ email });
  if (user) throw HttpError(409, 'Email in use');

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationToken = nanoid();
  const newUser = await authServices.singup({ ...req.body, password: hashPassword, avatarURL, verificationToken });

  const verifyEmail = createVerifyEmail(email, verificationToken);
  await sendMail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      avatarURL: newUser.avatarURL,
      subscription: newUser.subscription,
    },
  });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await authServices.findUser({ verificationToken });
  if (!user) {
    throw HttpError(404, 'Email not found or already verified');
  }

  await authServices.updateUser({ _id: user._id }, { verify: true, verificationToken: null });

  res.json({
    message: 'Verification successful',
  });
};

const resendVerify = async (req, res) => {
  const { email } = req.body;
  const user = await authServices.findUser({ email });
  if (!user) {
    throw HttpError(404, 'Email not found');
  }
  if (user.verify) {
    throw HttpError(400, 'Verification has already been passed');
  }

  const verifyEmail = createVerifyEmail(email, user.verificationToken);
  await sendMail(verifyEmail);

  res.json({
    message: 'Verification email sent',
  });
};

const singin = async (req, res) => {
  const { email, password } = req.body;
  const user = await authServices.findUser({ email });
  if (!user) throw HttpError(401, 'Email or password is wrong');
  if (!user.verify) throw HttpError(401, 'Email not verify');

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) throw HttpError(401, 'Email or password is wrong');

  const { _id: id } = user;
  const payload = { id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
  await authServices.updateUser({ _id: id }, { token });

  res.json({
    token,
    user: {
      email: user.email,
      avatarURL: user.avatarURL,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, avatarURL, subscription } = req.user;
  res.json({ email, avatarURL, subscription });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await authServices.updateUser({ _id }, { token: null });
  res.status(204).send();
};

const avatarsDir = path.resolve('public', 'avatars');

const updateAvatar = async (req, res) => {
  if (!req.file) throw HttpError(400, 'An avatar file was not added to your request');

  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;

  try {
    const img = await Jimp.read(tempUpload);
    await img.resize(250, 250).writeAsync(tempUpload);
  } catch (error) {
    console.error('Помилка обробки зображення:', error);
    throw HttpError(500, 'Internal Server Error');
  }

  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);
  await fs.rename(tempUpload, resultUpload);
  const avatarURL = path.join('avatars', filename);
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({
    avatarURL,
  });
};

export default {
  singup: ctrlWrapper(singup),
  verify: ctrlWrapper(verify),
  resendVerify: ctrlWrapper(resendVerify),
  singin: ctrlWrapper(singin),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
};