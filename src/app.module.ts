import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './App/users/users.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { BooksModule } from './App/books/books.module';
import { AuthModule } from './App/auth/auth.module';
import { AccessControlModule } from 'nest-access-control';
import { roles } from './app.role';
import { MulterModule } from '@nestjs/platform-express';
import { CategoriesModule } from './App/categories/categories.module';
import { TagModule } from './App/tag/tag.module';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { TypeOrmConfigService } from 'src/config/typeorm.config';
import { HttpErorFilter } from 'src/shared/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/TransformInterceptor';
@Module({
  imports: [
    AccessControlModule.forRoles(roles),
    ConfigModule.forRoot(),
    UsersModule,
    BooksModule,
    AuthModule,
    CategoriesModule,
    TagModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpErorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    AppService,
  ],
})
export class AppModule {}
