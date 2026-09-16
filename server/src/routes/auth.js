const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');

const router = express.Router();
const cookieName = 'astitva_session';
const sessionDuration = 24 * 60 * 60 * 1000;

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
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
    return response.status(201).json({ user: publicUser(user) });
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
  const token = request.cookies[cookieName];
  if (!token) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() }
  }).populate('userId');

  if (!session || !session.userId) {
    clearSessionCookie(response);
    return response.status(401).json({ error: 'Session is invalid or expired.' });
  }

  return response.status(200).json({ user: publicUser(session.userId) });
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
