const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Введите оценку'],
    min: [1, 'Оценка должна быть минимум 1'],
    max: [5, 'Оценка не может быть больше 5']
  },
  comment: {
    type: String,
    required: [true, 'Введите комментарий'],
    trim: true,
    minlength: [10, 'Комментарий должен быть минимум 10 символов'],
    maxlength: [1000, 'Комментарий не должен превышать 1000 символов']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectedReason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Введите название товара'],
    trim: true,
    minlength: [3, 'Название товара должно быть минимум 3 символа'],
    maxlength: [200, 'Название товара не должно превышать 200 символов']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Описание не должно превышать 2000 символов'],
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Введите цену'],
    min: [0, 'Цена не может быть отрицательной']
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(data:image\/|\/uploads\/|uploads\/|\/[^/]+\.(jpg|jpeg|png|webp|gif|svg)$|https?:\/\/)/i.test(v);
      },
      message: 'Некорректная ссылка на изображение'
    }
  }],
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Количество товара не может быть отрицательным']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isWeeklySpecial: {
    type: Boolean,
    default: false
  },
  reviews: [reviewSchema],
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'Количество просмотров не может быть отрицательным']
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


productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ viewCount: -1 });
productSchema.index({ isActive: 1 });
productSchema.index({ mysqlId: 1 }, { unique: true, sparse: true });


productSchema.index({
  name: 'text',
  description: 'text'
}, {
  weights: {
    name: 10,
    description: 5
  },
  name: 'product_text_search'
});


productSchema.virtual('averageRating').get(function() {
  if (!this.reviews || this.reviews.length === 0) return 0;
  
  const approvedReviews = this.reviews.filter(review => review.status === 'approved');
  if (approvedReviews.length === 0) return 0;
  
  const sum = approvedReviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / approvedReviews.length) * 10) / 10;
});


productSchema.virtual('reviewCount').get(function() {
  if (!this.reviews) return 0;
  return this.reviews.filter(review => review.status === 'approved').length;
});


productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});


productSchema.virtual('mainImage').get(function() {
  return (this.images && this.images.length > 0) ? this.images[0] : '/uploads/default-product.jpg';
});

module.exports = mongoose.model('Product', productSchema);
