import {
  Controller,
  Response,
  HttpStatus,
  HttpException,
  Param,
  HttpCode,
  InternalServerErrorException,
  Get,
  UseGuards,
  Put,
  Body,
} from '@nestjs/common';
import {
  CrudController,
  CrudService,
  CrudRequest,
  CreateManyDto,
  Crud,
  Override,
  ParsedRequest,
  ParsedBody,
} from '@nestjsx/crud';
import { SCondition } from '@nestjsx/crud-request';
import { User } from '../../entity/user.entity';
import { UserService } from './users.service';
import { UserRepository } from './user.repository';
import { BaseController } from 'src/common/Base/base.controller';
import { Not, IsNull } from 'typeorm';
import {
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ACGuard, UseRoles } from 'nest-access-control';
import { AuthGuard } from '../auth/auth.guard';

@Crud({
  model: {
    type: User,
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
    username: {
      field: 'username',
      type: 'string',
      primary: true,
    },
  },
  query: {
    filter: [],
    exclude: ['password'],
    join: {
      role: {
        eager: true,
        allow: ['role'],
      },
      'role.permissions': {
        alias: 'pr',
      },
      profile: {
        exclude: ['updatedAt'],
        eager: true,
      },
    },
  },
})
@ApiTags('v1/users')
@Controller('/api/v1/users')
export class UserController extends BaseController<User> {
  constructor(
    public service: UserService,
    private readonly repository: UserRepository,
  ) {
    super(repository);
  }

  // get base(): CrudController<User> {
  //   return this;
  // }
  @Override('getManyBase')
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'user',
    action: 'read',
    possession: 'any',
  })
  async getAll(@ParsedRequest() req: CrudRequest) {
    req.parsed.search.$and = [{ isActive: { $eq: true } }];
    try {
      return await this.base.getManyBase(req);
    } catch (error) {
      console.log(error);
    }
    try {
      return await this.base.getManyBase(req);
    } catch (error) {}
  }

  @Override('deleteOneBase')
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'user',
    action: 'delete',
    possession: 'any',
  })
  async softDelete(@ParsedRequest() req: CrudRequest): Promise<void> {
    const id = req.parsed.paramsFilter.find(
      f => f.field === 'id' && f.operator === '$eq',
    ).value;

    const data = this.repository.findOne({ where: { id } });
    if (!data) {
      throw new HttpException(
        {
          message: 'Not Found',
          status: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    try {
      await this.repository.softDelete({ id });
    } catch (error) {
      throw new InternalServerErrorException('Incomplete CrudRequest');
    }
  }

  @Override('updateOneBase')
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'user',
    action: 'update',
    possession: 'any',
  })
  async restore(@ParsedRequest() req: CrudRequest): Promise<void> {
    const id = req.parsed.paramsFilter.find(
      f => f.field === 'id' && f.operator === '$eq',
    ).value;

    const data = await this.repository.findOne({
      withDeleted: true,
      where: { id, deletedAt: Not(IsNull()) },
    });
    if (!data) {
      throw new HttpException(
        {
          message: 'Not Found',
          status: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    await this.repository.restore({ id });
  }
  @Override('createOneBase')
  @ApiOkResponse({ description: 'User login' })
  @ApiUnauthorizedResponse({ description: 'Invalid credential' })
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'user',
    action: 'create',
    possession: 'any',
  })
  async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: User) {
    try {
      console.log('here');
      const data = await this.base.createOneBase(req, dto);
      return data;
    } catch (error) {
      console.log('err', error);

      if (error.code === '23505') {
        throw new HttpException(
          {
            message: 'User or Email already exists',
            status: HttpStatus.CONFLICT,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          {
            message: 'Internal Server error',
            status: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  @Get('inActive/:id')
  async Inactive(@ParsedRequest() req: CrudRequest): Promise<void> {
    try {
      const deletedUser = await this.repository.find({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
      });
      console.log(deletedUser);

      // const data = this.repository.findOne({ where: { id } });
      // console.log(data);
    } catch (error) {
      //console.log(error);
      console.log('error', error);
    }
  }

  /** Get All user Inactive status */
  @Get('inactive')
  async getInactive(@ParsedRequest() req: CrudRequest) {
    try {
      const data = this.repository.find({
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
        relations: ['role'],
        select: ['id', 'email', 'gender', 'createdAt', 'role'],
      });
      return data;
    } catch (error) {
      throw new InternalServerErrorException('Error: Internal Server');
    }
  }

  @Override('createManyBase')
  async createMany(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateManyDto<User>,
  ) {
    try {
      return await this.base.createManyBase(req, dto);
    } catch (error) {
      console.log(error);
      if (error.code === '23505') {
        throw new HttpException(
          {
            message: 'User or Email already exists',
            status: HttpStatus.CONFLICT,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          {
            message: 'Internal Server error',
            status: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
  @Override('getOneBase')
  async getOne(@ParsedRequest() req: CrudRequest, @ParsedRequest() dto: User) {
    try {
      const data = await this.base.getOneBase(req);
      return data;
    } catch (error) {
      throw new HttpException(
        {
          message: 'User not found',
          error: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
  @Put('updateOne/:id')
  @UseGuards(AuthGuard, ACGuard)
  @UseRoles({
    resource: 'user',
    action: 'update',
    possession: 'any',
  })
  async updateUser(@Body() dto: Partial<User>, @Param('id') id: string) {
    try {
      const result = await this.repository.findOne({ id });
      if (!result) {
        throw new HttpException(
          {
            message: 'Not Found',
            status: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return await this.repository.update({ id }, dto);
    } catch (error) {
      throw new HttpException(
        {
          message: 'Internal Server Error',
          status: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
