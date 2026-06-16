const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Введите название категории'],
    unique: true,
    trim: true,
    minlength: [2, 'Название категории должно быть минимум 2 символа'],
    maxlength: [50, 'Название категории не должно превышать 50 символов']
  },
  deviceType: {
    type: String,
    required: [true, 'Выберите тип устройства'],
    trim: true,
    enum: ['Игровое', 'Офисное']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Описание не должно превышать 500 символов'],
    default: ''
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  icon: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    trim: true,
    default: '#007bff'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mysqlId: {
    type: Number,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


categorySchema.index({ deviceType: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ mysqlId: 1 }, { unique: true, sparse: true });


categorySchema.virtual('slug').get(function() {
  return this.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
});

module.exports = mongoose.model('Category', categorySchema);
