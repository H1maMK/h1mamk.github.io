const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  imageUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(\/uploads\/|uploads\/|https?:\/\/)/.test(v);
      },
      message: 'Invalid image URL'
    }
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  mysqlId: {
    type: Number,
    sparse: true
  },
  presentation: {
    badge: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    summary: {
      type: String,
      default: ''
    },
    takeaways: {
      type: [String],
      default: []
    },
    sections: {
      type: [
        {
          title: {
            type: String,
            default: ''
          },
          points: {
            type: [String],
            default: []
          }
        }
      ],
      default: []
    },
    highlights: {
      type: [String],
      default: []
    },
    links: {
      type: [
        {
          label: {
            type: String,
            default: ''
          },
          to: {
            type: String,
            default: ''
          }
        }
      ],
      default: []
    },
    theme: {
      type: String,
      enum: ['dark', 'contrast', 'accent', ''],
      default: 'dark'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


articleSchema.index({ title: 'text', content: 'text' }, {
  weights: {
    title: 10,
    content: 1
  },
  name: 'article_text_search'
});
articleSchema.index({ createdAt: -1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ isPublished: 1 });
articleSchema.index({ mysqlId: 1 }, { unique: true, sparse: true });


articleSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
});


articleSchema.virtual('slug').get(function() {
  return this.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
});

module.exports = mongoose.model('Article', articleSchema);
