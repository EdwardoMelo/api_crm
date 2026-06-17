import { Module } from '@nestjs/common';
import { ClientController } from './controller/ClientController';
import { ClientRepository } from './repository/ClientRepository';
import { ClientService } from './service/ClientService';

@Module({
  controllers: [ClientController],
  providers: [ClientService, ClientRepository],
  exports: [ClientService],
})
export class ClientModule {}
