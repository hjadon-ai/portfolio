const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { sendVerificationEmail } = require('../services/email');

const router = express.Router();
const cookieName = 'astitva_session';
const sessionDuration = 24 * 60 * 60 * 1000;
const verificationDuration = 60 * 60 * 1000;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt)
  };
}

async function createVerificationToken(user) {
  const token = crypto.randomBytes(32).toString('hex');

  await EmailVerificationToken.deleteMany({ userId: user._id });
  await EmailVerificationToken.create({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + verificationDuration)
  });

  return token;
}

async function authenticatedUser(request, response) {
  const token = request.cookies[cookieName];
  if (!token) return null;

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() }
  }).populate('userId');

  if (!session || !session.userId) {
    clearSessionCookie(response);
    return null;
  }

  return session.userId;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function clearSessionCookie(response) {
  response.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax' });
}

router.post('/signup', async (request, response) => {
  const name = typeof request.body.name === 'string' ? request.body.name.trim() : '';
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';

  if (!name || !email || password.length < 8) {
    return response.status(400).json({
      error: 'Name, email, and a password of at least 8 characters are required.'
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = await createVerificationToken(user);
    let emailDelivered = true;

    try {
      await sendVerificationEmail(user, token);
    } catch (error) {
      emailDelivered = false;
      console.error('Unable to send verification email:', error.message);
    }

    return response.status(201).json({
      user: publicUser(user),
      message: emailDelivered
        ? 'Account created. Check your email to verify your address.'
        : 'Account created, but the verification email could not be sent.',
      emailDelivered
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ error: 'An account with this email already exists.' });
    }
    return response.status(500).json({ error: 'Unable to create the account.' });
  }
});

router.post('/login', async (request, response) => {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return response.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  await Session.create({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + sessionDuration)
  });

  response.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sessionDuration
  });
  return response.status(200).json({ user: publicUser(user) });
});

router.get('/me', async (request, response) => {
  const user = await authenticatedUser(request, response);
  if (!user) {
    return response.status(401).json({ error: 'Session is invalid or expired.' });
  }

  return response.status(200).json({ user: publicUser(user) });
});

router.post('/verify-email', async (request, response) => {
  const token = typeof request.body.token === 'string' ? request.body.token.trim() : '';
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return response.status(400).json({ error: 'A valid verification token is required.' });
  }

  const tokenHash = hashToken(token);
  const verification = await EmailVerificationToken.findOneAndDelete({
    tokenHash,
    expiresAt: { $gt: new Date() }
  }).populate('userId');

  if (!verification || !verification.userId) {
    await EmailVerificationToken.deleteOne({ tokenHash });
    return response.status(410).json({ error: 'This verification link is invalid, expired, or already used.' });
  }

  if (verification.userId.emailVerifiedAt) {
    await EmailVerificationToken.deleteMany({ userId: verification.userId._id });
    return response.status(409).json({ error: 'This email address is already verified.' });
  }

  verification.userId.emailVerifiedAt = new Date();
  await verification.userId.save();
  await EmailVerificationToken.deleteMany({ userId: verification.userId._id });

  return response.status(200).json({
    message: 'Email verified successfully.',
    user: publicUser(verification.userId)
  });
});

router.post('/resend-verification', async (request, response) => {
  const user = await authenticatedUser(request, response);
  if (!user) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  if (user.emailVerifiedAt) {
    return response.status(409).json({ error: 'This email address is already verified.' });
  }

  const token = await createVerificationToken(user);
  try {
    await sendVerificationEmail(user, token);
  } catch (error) {
    console.error('Unable to resend verification email:', error.message);
    return response.status(503).json({
      error: 'The verification email could not be sent. Your account remains unverified.'
    });
  }

  return response.status(202).json({
    message: 'A new verification email was sent. It expires in one hour.'
  });
});

router.post('/logout', async (request, response) => {
  const token = request.cookies[cookieName];
  if (token) {
    await Session.deleteOne({ tokenHash: hashToken(token) });
  }
  clearSessionCookie(response);
  return response.status(204).send();
});

module.exports = router;
