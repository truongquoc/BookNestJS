import { Comment } from 'src/entity/comment.entity';
import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entity/user.entity';
import { Book } from 'src/entity/book.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, User, Book]), AuthModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
