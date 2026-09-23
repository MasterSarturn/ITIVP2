require('dotenv').config();

const express = require('express');
const productRoutes = require('./routes/productRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
module.exports = app;