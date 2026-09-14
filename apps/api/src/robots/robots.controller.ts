import { Controller, Get, NotImplementedException } from '@nestjs/common';

@Controller('robots')
export class RobotsController {
  @Get()
  listAll(): never {
    throw new NotImplementedException();
  }
}
