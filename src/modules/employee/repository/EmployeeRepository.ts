import { Injectable } from '@nestjs/common';

import { Employee, Prisma } from '@prisma/client';

import { TenantContextService } from '../../../common/tenant';
import { ActorContextService, auditCreateFields, auditUpdateFields } from '../../../common/audit';

import { PrismaService } from '../../../prisma/prisma.service';
import { ListEmployeeDTOQuery } from '../dto/request/ListEmployeeDTOQuery';
import { employeeListSort } from '../utils/employee-sort.utils';

@Injectable()
export class EmployeeRepository {
  constructor(
    private readonly prisma: PrismaService,

    private readonly tenantContext: TenantContextService,

    private readonly actorContext: ActorContextService,
  ) {}

  create(data: Omit<Prisma.EmployeeCreateInput, 'tenants'>): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        ...data,
        ...auditCreateFields(this.actorContext.getActorId()),
        tenants: { connect: { id: this.tenantContext.getTenantId() } },
      },
    });
  }

  findAll(query?: ListEmployeeDTOQuery): Promise<Employee[]> {
    const sort = employeeListSort.resolve(query);
    return this.prisma.employee.findMany({
      where: { tenantId: this.tenantContext.getTenantId() },
      orderBy: employeeListSort.buildPrismaOrderBy(sort),
    });
  }

  findById(id: number): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: { id, tenantId: this.tenantContext.getTenantId() },
    });
  }

  update(id: number, data: Prisma.EmployeeUpdateInput): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data: { ...data, ...auditUpdateFields(this.actorContext.getActorId()) },
    });
  }

  delete(id: number): Promise<Employee> {
    return this.prisma.employee.delete({ where: { id } });
  }
}
