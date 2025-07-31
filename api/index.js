import { createServer } from '../server/index.js';

const app = createServer();

// Export the Express app as a serverless function
export default (req, res) => {
  return app(req, res);
};
