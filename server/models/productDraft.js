const mongoose = require('mongoose');

const DRAFT_CATEGORIES = ['books', 'music', 'software'];

// Черновик карточки товара продавца. Живёт только в MongoDB: категорийные характеристики
// (attributes) у книги, музыки и софта разные, поэтому схема у них гибкая
const productDraftSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, default: '', maxlength: 100000 },
    price: { type: Number, min: 0, default: null },
    category: { type: String, enum: DRAFT_CATEGORIES, default: null },
    authorIds: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

productDraftSchema.index({ sellerId: 1, updatedAt: -1 });

module.exports = mongoose.model('ProductDraft', productDraftSchema);
module.exports.DRAFT_CATEGORIES = DRAFT_CATEGORIES;
