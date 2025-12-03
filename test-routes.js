const express = require('express');
const app = express();

// Test route loading
const bookRoutes = require('./src/routes/bookRoutes');
const authorRoutes = require('./src/routes/authorRoutes');
const loanRoutes = require('./src/routes/loanRoutes');

app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/loans', loanRoutes);

// List all registered routes
console.log('Registered routes:');
app._router.stack.forEach((middleware, index) => {
  if (middleware.route) {
    console.log(`${index}: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler, subIndex) => {
      if (handler.route) {
        const route = handler.route;
        const methods = Object.keys(route.methods).join(', ').toUpperCase();
        console.log(`${index}.${subIndex}: ${methods} ${middleware.regexp.source}${route.path}`);
      }
    });
  }
});

process.exit(0);