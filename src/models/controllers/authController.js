const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Заполните username, email и пароль' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не короче 6 символов' });
    }

    const exists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (exists) {
      return res.status(409).json({ message: 'Такой username или email уже занят' });
    }

    const user = await User.create({ username, email, password, fullName });
    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// POST /api/auth/login  (login = username или email)
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ message: 'Введите логин и пароль' });
    }

    const value = login.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: value }, { username: value }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    res.json({ token: signToken(user._id), user });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/me
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, avatar } = req.body;
    if (fullName !== undefined) req.user.fullName = fullName;
    if (bio !== undefined) req.user.bio = bio;
    if (avatar !== undefined) req.user.avatar = avatar;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/auth/users?search=...
exports.searchUsers = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = { _id: { $ne: req.user._id } };
    if (escaped) {
      filter.$or = [
        { username: { $regex: escaped, $options: 'i' } },
        { fullName: { $regex: escaped, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).limit(20).sort({ username: 1 });
    res.json({ users });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
