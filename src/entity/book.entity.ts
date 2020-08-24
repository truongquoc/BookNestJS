import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Base } from './base.entity';
import {
  IsOptional,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsNotBlank } from '../Helper/validation/validation';
import { Author } from './author.entity';
import { Category } from './category.entity';
import { Price } from './price.entity';
import { Tag } from './tag.entity';
import { OrderItem } from './order_item.entity';
import { Rank } from './rank.entity';
import { Comment } from './comment.entity';
import { User } from './user.entity';
const { CREATE, UPDATE } = CrudValidationGroups;
@Entity('books')
export class Book extends Base {
  @PrimaryGeneratedColumn()
  id: number;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsString({ always: true, message: 'Book name required String type' })
  @Column({ type: 'text' })
  name: string;

  authorName: string;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @Column({ type: 'int' })
  quantity: number;

  @IsOptional({ groups: [UPDATE] })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'int' })
  categoryId: number;

  @Column({ type: 'int', nullable: true })
  viewer: number;

  @ManyToOne(
    type => Author,
    author => author.books,
    {
      eager: true,
    },
  )
  author: Author;
  @ManyToOne(
    type => Category,
    cate => cate.books,
    { cascade: true, eager: true },
  )
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @IsOptional({ groups: [UPDATE] })
  @OneToMany(
    type => Price,
    Price => Price.book,
    { cascade: true, eager: true },
  )
  prices: Price[];

  @IsOptional({ groups: [CREATE, UPDATE] })
  @Column({ type: 'float', nullable: true })
  discount: number;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  description: string;

  @IsOptional({ groups: [UPDATE] })
  @IsBoolean({ always: true })
  @Column({ type: 'bool' })
  available: boolean;

  // @Column({type: 'array'})
  @IsOptional({ groups: [UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  dimension: string;

  @IsOptional({ groups: [UPDATE, CREATE] })
  @IsDateString()
  @Column({ type: 'date', nullable: true })
  publication: Date;

  @IsOptional({ groups: [UPDATE, CREATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  language: string;

  @IsOptional({ groups: [UPDATE, CREATE] })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: true })
  publisher: string;

  @IsOptional({ groups: [UPDATE, CREATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  edition: string;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  isbn: string;

  selectedTag: Array<string>;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @Column({ type: 'text', nullable: true })
  format: Array<string>;

  @IsOptional({ groups: [UPDATE] })
  @IsNotEmpty({ groups: [CREATE] })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: false })
  image: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  orderNumber: number;

  @ManyToMany(
    type => Tag,
    tag => tag.book,
  )
  @JoinTable({
    joinColumn: {
      name: 'bookId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tagId',
      referencedColumnName: 'id',
    },
  })
  tags: Tag[];

  @OneToMany(
    type => Rank,
    rank => rank.book,
  )
  ranks: Rank[];

  @Column({ type: 'float', nullable: true })
  avgRank: number;

  @OneToMany(
    type => OrderItem,
    order => order.book,
  )
  orderItems: OrderItem[];

  @OneToMany(
    type => Comment,
    comment => comment.book,
  )
  comments: Comment[];

  @ManyToMany(
    type => User,
    user => user.favorites,
  )
  @JoinTable({
    name: 'favorite_user',
    joinColumn: {
      name: 'bookid',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userid',
      referencedColumnName: 'id',
    },
  })
  favoritesBy: User[];

  @ManyToMany(
    type => User,
    user => user.recentView,
  )
  @JoinTable({
    name: 'recent_book',
    joinColumn: {
      name: 'bookid',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userid',
      referencedColumnName: 'id',
    },
  })
  items: Book[];
}
