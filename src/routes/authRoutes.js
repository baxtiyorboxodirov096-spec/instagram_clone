
const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  me,
  updateProfile,
  searchUsers,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.put('/me', auth, updateProfile);
router.get('/users', auth, searchUsers);

module.exports = router;
