import { registerAs } from '@nestjs/config';

const alias = 'mongodb';

export const mongodbConfig = registerAs(alias, () => ({
  uri: process.env.MONGODB_URI || 'mongodb://gen_user:Ie%5C%5C6C%3BA%2C-F*%7CV@147.45.144.220:27017/default_db?authSource=admin&directConnection=true',
}));

export const mongodbTestConfig = registerAs(alias, () => ({
  uri: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/chatapp_test',
}));
