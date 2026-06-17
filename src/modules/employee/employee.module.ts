import { Module } from '@nestjs/common';
import { EmployeeController } from './controller/EmployeeController';
import { EmployeeRepository } from './repository/EmployeeRepository';
import { EmployeeService } from './service/EmployeeService';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository],
  exports: [EmployeeService],
})
export class EmployeeModule {}
