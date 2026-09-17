import app from './app';
import connectDatabase from './config/database';
import { env } from './config/env';

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error: any) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

startServer();
