import { DocumentBuilder } from '@nestjs/swagger';

const swaggerConfig = new DocumentBuilder()
  .setTitle('Chat App Backend')
  .setDescription('')
  .setVersion('1.0')
  .build();

export default swaggerConfig;
