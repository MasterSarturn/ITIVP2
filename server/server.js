require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const { categories: categoryRoutes, authors: authorRoutes } = require('./routes/catalog');
const { cart: cartRoutes, wishlist: wishlistRoutes } = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const downloadRoutes = require('./routes/downloads');
const { reviews: reviewRoutes, seller: sellerRoutes } = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { connectMongo } = require('./services/mongo');
const app = express();
const port = process.env.PORT || 3000;
// сырое тело нужно для проверки подписи webhook платёжного провайдера
app.use(express.json({ verify: (req, res, buffer) => { req.rawBody = buffer; } }));
app.use(cookieParser());
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', paymentRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectMongo();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Swagger UI: http://localhost:${port}/api-docs`);
  });
}

if (require.main === module) {
  start();
}
module.exports = app;
