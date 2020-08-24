import {
  Controller,
  HttpException,
  HttpStatus,
  Get,
  Param,
  UsePipes,
  UseGuards,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  Crud,
  Override,
  ParsedRequest,
  CrudRequest,
  ParsedBody,
  CrudController,
} from '@nestjsx/crud';
import { Category } from '../../entity/category.entity';
import { BaseController } from 'src/common/Base/base.controller';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from './categories.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeBase } from 'src/entity/tree.entity';
import { TreeRepository, Not, IsNull, Repository } from 'typeorm';
import { identity } from 'rxjs';
import moment = require('moment');
import slugify from 'slugify';
import { ValidationPipe } from 'src/shared/validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { ACGuard, UseRoles, UserRoles } from 'nest-access-control';
import { User } from 'src/App/users/user.decorator';
import { roles } from 'src/app.role';
import { UserRepository } from '../users/user.repository';
import { CheckPossessionRole } from 'src/Helper/role';
import { ApiTags } from '@nestjs/swagger';
@Crud({
  model: {
    type: Category,
  },
  params: {
    id: {
      type: 'string',
      field: 'slug',
      primary: true,
    },
    slug: {
      type: 'string',
    },
  },
  query: {
    filter: [],
    join: {
      user: {
        eager: true,
        exclude: ['password', 'username', 'createdAt', 'updatedAt', 'gender'],
      },
    },
  },
})
@ApiTags('v1/categories')
@Controller('api/v1/categories')
export class CategoriesController extends BaseController<Category> {
  constructor(
    public service: CategoriesService,
    @InjectRepository(Category)
    private readonly repository: TreeRepository<Category>,
    private readonly authorRepository: UserRepository,
    @InjectRepository(Category)
    private readonly cateRepo: Repository<Category>,
  ) {
    super(repository);
  }

  getSlug(slug: string) {
    const now = moment();

    return slugify(slug, {
      replacement: '-', // replace spaces with replacement character, defaults to `-`
      remove: undefined, // remove characters that match regex, defaults to `undefined`
      lower: true, // convert to lower case, defaults to `false`
      strict: false, // strip special characters except replacement, defaults to `false`
      locale: 'vi',
    });
  }
  @Override('createOneBase')
  @UsePipes(new ValidationPipe())
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'category',
    action: 'create',
    possession: 'any',
  })
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Category,
    @User() user: any,
  ) {
    const author = await this.authorRepository.findOne({
      where: { id: user.users.id },
    });
    if (dto.parentId) {
      const parentObject = await this.repository.findOne({
        where: { id: dto.parentId },
      });
      if (parentObject) {
        dto.parent = parentObject;
      } else {
        throw new HttpException(
          {
            message: 'parentId must be an existed',
            status: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const data = await this.repository.findOne({ where: { name: dto.name } });
    if (data) {
      throw new HttpException(
        {
          message: 'Category already existed',
          status: HttpStatus.NOT_ACCEPTABLE,
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    dto.slug = this.getSlug(dto.name); /*test case */
    const result = this.repository.create({ ...dto, user: author });
    return await this.repository.save(result);
  }

  @Override('deleteOneBase')
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'category',
    action: 'delete',
    possession: 'own',
  })
  async deleteOne(
    @ParsedRequest() req: CrudRequest,
    @User() user,
    @UserRoles() role,
  ) {
    const slug = req.parsed.paramsFilter.find(
      f => f.field === 'slug' && f.operator === '$eq',
    ).value;

    if ((await CheckPossessionRole(role, 'DELETE')) == 'OWN') {
      const data = await this.repository.findOne({
        where: { slug },
        relations: ['user'],
      });
      console.log(user);
      if (user.users.id != data.user.id) {
        throw new HttpException(
          {
            message: 'Unauthorized Permission',
            status: HttpStatus.UNAUTHORIZED,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    return await this.repository.softDelete({ slug });
  }

  @Override('updateOneBase')
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'category',
    action: 'update',
    possession: 'own',
  })
  async updateOne(
    @ParsedRequest() req: CrudRequest,
    @User() user,
    @UserRoles() role,
    @ParsedBody() dto: Category,
  ) {
    const slug = req.parsed.paramsFilter.find(
      f => f.field === 'slug' && f.operator === '$eq',
    ).value;

    if ((await CheckPossessionRole(role, 'UPDATE')) == 'OWN') {
      const data = await this.repository.findOne({
        where: { slug },
        relations: ['user'],
      });
      if (user.users.id != data.user.id) {
        throw new HttpException(
          {
            message: 'Unauthorized Permission',
            status: HttpStatus.UNAUTHORIZED,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    return await this.repository.update({ slug: slug }, { slug: dto.slug });
  }
  @Override('getManyBase')
  async getMany(@ParsedRequest() req: CrudRequest) {
    return await this.base.getManyBase(req);
  }
  @Get('all')
  async getAll(@ParsedRequest() req: CrudRequest) {
    return await this.repository.findTrees();
  }
  @Get('/category/:userId/own')
  async getOwn(@Param('userId') userId: string) {
    const user = await this.authorRepository.findOne({ id: userId });
    return await this.cateRepo.find({ where: { user } });
  }
  @Get(':id')
  async getCategpry(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Category,
    @Param('id') id: number,
  ) {
    // console.log(dto.id);
    // console.log('here', dto.id);
    return await this.repository.findOne({
      where: { id },
      relations: ['children'],
    });
  }

  @Get('inactive/category')
  async getInactive(@ParsedRequest() req: CrudRequest) {
    try {
      return await this.repository.find({
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error: Internal Server');
    }
  }
}
