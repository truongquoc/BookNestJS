import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  UseGuards,
  Put,
  ExecutionContext,
  Inject,
  Req,
} from '@nestjs/common';
import { AuthServices } from './auth.service';
import { LoginDTO, RegisterDTO, ChangePwdDTO } from 'src/App/auth/auth.dto';
import { ValidationPipe } from 'src/shared/validation.pipe';
import { AuthGuard } from './auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
@ApiTags('v1/auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthServices) {}

  @Get()
  // @UseGuards(AuthGuard)
  getRoleByUser(id: string) {
    return this.authService.getRolesPermission(id);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async Login(@Body() data: LoginDTO) {
    const result = await this.authService.login(data);
    return result;
  }

  @Post('register')
  @UsePipes(new ValidationPipe())
  async Register(@Body() data: RegisterDTO) {
    return this.authService.register(data);
  }

  @Put('me/password')
  @UseGuards(AuthGuard)
  async changePwd(@Body() body: ChangePwdDTO, @User() user) {
    return this.authService.changePwd(user, body);
  }
}
