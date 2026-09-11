import 'dotenv/config';
import { createApp } from './app.js';
import { loadEnvironment } from './config/env.js';

const environment = loadEnvironment(process.env);
const app = createApp();

app.listen(environment.port, () => {
  console.log(`Quiz API listening on port ${environment.port}`);
});
