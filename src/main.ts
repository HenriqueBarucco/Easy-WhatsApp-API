import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { version } from '../package.json';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { InstanceService } from './services/instance.service';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Easy WhatsApp Bot API')
    .setDescription('The simplest API for WhatsApp bots.')
    .setContact(
      'Henrique Barucco',
      'https://github.com/henriquebarucco',
      'contato@henriquebarucco.com.br',
    )
    .setVersion(version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);

  app.enableCors();
  app.get(InstanceService).restoreSessions();

  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(8080);
}
bootstrap();
