const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Введите имя пользователя'],
    unique: true,
    trim: true,
    minlength: [3, 'Имя пользователя должно быть минимум 3 символа'],
    maxlength: [30, 'Имя пользователя не может быть больше 30 символов']
  },
  email: {
    type: String,
    required: [true, 'Введите email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Введите корректный email']
  },
  password: {
    type: String,
    required: [true, 'Введите пароль'],
    minlength: [8, 'Пароль должен быть минимум 8 символов'],
    match: [/[A-Z]/, 'Пароль должен содержать минимум одну заглавную букву'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: {
    type: Date,
    default: null
  },
  tokenInvalidBefore: {
    type: Date,
    default: null
  },
  profile: {
    yearBirth: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear()
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mysqlId: {
    type: Number,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});


userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ tokenInvalidBefore: 1 });
userSchema.index({ mysqlId: 1 }, { unique: true, sparse: true });


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};


userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

module.exports = mongoose.model('User', userSchema);
