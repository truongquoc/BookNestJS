import {
  Controller,
  UseGuards,
  HttpException,
  HttpStatus,
  Get,
  Post,
  Body,
} from '@nestjs/common';
import { BaseController } from 'src/common/Base/base.controller';
import { Order } from 'src/entity/order.entity';
import { OrderService } from './order.service';
import { UserRepository } from '../users/user.repository';
import { OrderRepository } from './order.repository';
import {
  Crud,
  Override,
  ParsedRequest,
  CrudRequest,
  ParsedBody,
} from '@nestjsx/crud';
import { AuthGuard } from '../auth/auth.guard';
import { ACGuard } from 'nest-access-control';
import { User } from 'src/common/decorators/user.decorator';
import { BookRepository } from '../books/book.repository';
import { getManager, Repository, getRepository } from 'typeorm';
import { OrderDTO } from './order.dto';
import { ApiTags } from '@nestjs/swagger';
import { OrderItemRepository } from './orderItem.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/entity/address.entity';
import { OrderItem } from 'src/entity/order_item.entity';

@Crud({
  model: {
    type: Order,
  },
  params: {
    id: {
      type: 'number',
      field: 'id',
      primary: true,
    },
  },
  query: {
    join: {
      orderItems: {
        eager: true,
      },
      'orderItems.order': {
        eager: true,
      },
      user: {
        eager: true,
        exclude: ['password', 'createdAt', 'updatedAt', 'isActive'],
      },
      billingAdress: {
        eager: true,
      },
    },
  },
})
@ApiTags('v1/orders')
@Controller('api/v1/order')
export class OrderController extends BaseController<Order> {
  constructor(
    public service: OrderService,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly repository: OrderRepository,
    private readonly authorRepository: UserRepository,
    private readonly bookRepository: BookRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {
    super(repository);
  }

  @Override('createOneBase')
  @UseGuards(AuthGuard, ACGuard)
  async createOne(
    @ParsedRequest() crud: CrudRequest,
    @ParsedBody() dto: Order,
    @User() user,
  ) {
    const manager = getManager();
    const mapId = [];
    const author = await this.authorRepository.findOne({
      where: { id: user.users.id },
    });
    dto.orderItems.forEach(item => {
      mapId.push(item['id']);
    });

    const orderItem = await this.bookRepository.findByIds(mapId);
    if (!orderItem) {
      throw new HttpException(
        {
          message: 'Item Not Found',
          status: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    dto.orderItems.forEach((order, index) => {
      const data = orderItem.find(item => item.id == order['id']);

      const found = data.prices.find(
        element => element.format == order['format'],
      );
      order['price'] = found.price;
    });

    let total = 0;
    dto.orderItems.forEach(order => {
      total += order['price'] * order['quantity'];
    });
    dto['total'] = total;

    const address = this.addressRepository.create(dto.billingAdress);
    const saveAddress = await this.addressRepository.save(address);
    dto.billingAdress = saveAddress;

    const order = this.repository.create({ ...dto, user: author });
    await this.repository.save(order);
    const orderdata = await this.repository.find({
      take: 1,
      order: { createdAt: 'DESC' },
    });

    dto.orderItems.forEach(async item => {
      const orderOne = await this.bookRepository.findOne({
        where: { id: item['id'] },
      });

      await manager.query(
        `INSERT INTO order_item values(${item['quantity']}, ${orderOne.prices[0].price},${orderdata[0].id},${orderOne.id})`,
      );
      await this.bookRepository.update(
        { id: item['id'] },
        { orderNumber: orderOne.orderNumber + 1 },
      );
    });
  }

  @Post('price')
  async getPriceByQuantiy(@Body() dto: OrderDTO) {
    const book = await this.bookRepository.findOne({
      where: { id: dto.id },
      relations: ['prices'],
    });
    if (book.prices[0].format == dto.format) {
      return book.prices[0].price * dto.quantity;
    }
    if (book.prices[1].format == dto.format) {
      return book.prices[1].price * dto.quantity;
    }
    if (book.prices[2].format == dto.format) {
      return book.prices[2].price * dto.quantity;
    }
  }

  @Get('bestseller')
  async getBestSeller() {
    const bestorder = await getRepository(OrderItem)
      .createQueryBuilder('order_item')
      .groupBy('order.bookId')
      .getRawMany();
  }

  @Override('getManyBase')
  async getMany(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: Order) {
    return this.base.getManyBase(req);
  }

  @Override('getOneBase')
  async getOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: Order) {
    return this.base.getOneBase(req);
  }
}
