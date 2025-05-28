// server.js
const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const createDefaultAdmin = require('./utils/createDefaultAdmin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    // Create default admin if needed
    await createDefaultAdmin();
    
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error(err));
