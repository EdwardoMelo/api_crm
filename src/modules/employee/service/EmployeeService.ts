import { Injectable, Logger } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions';
import { CreateEmployeeDTORequest } from '../dto/request/CreateEmployeeDTORequest';
import { ListEmployeeDTOQuery } from '../dto/request/ListEmployeeDTOQuery';
import { UpdateEmployeeDTORequest } from '../dto/request/UpdateEmployeeDTORequest';
import { EmployeeDTOResponse } from '../dto/response/EmployeeDTOResponse';
import { EmployeeRepository } from '../repository/EmployeeRepository';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async create(dto: CreateEmployeeDTORequest): Promise<EmployeeDTOResponse> {
    try {
      const employee = await this.employeeRepository.create({
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        cargo: dto.cargo,
        tipoContratacao: dto.tipoContratacao,
        salarioBase: dto.salarioBase,
        ativo: dto.ativo ?? true,
      });
      return EmployeeDTOResponse.fromEntity(employee);
    } catch (error) {
      this.logger.error('Erro ao criar funcionário', (error as Error).stack);
      throw error;
    }
  }

  async findAll(query?: ListEmployeeDTOQuery): Promise<EmployeeDTOResponse[]> {
    try {
      const employees = await this.employeeRepository.findAll(query);
      return EmployeeDTOResponse.fromEntities(employees);
    } catch (error) {
      this.logger.error('Erro ao listar funcionários', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: number): Promise<EmployeeDTOResponse> {
    const employee = await this.getExistingEmployee(id);
    return EmployeeDTOResponse.fromEntity(employee);
  }

  async update(id: number, dto: UpdateEmployeeDTORequest): Promise<EmployeeDTOResponse> {
    await this.getExistingEmployee(id);
    try {
      const employee = await this.employeeRepository.update(id, {
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        cargo: dto.cargo,
        tipoContratacao: dto.tipoContratacao,
        salarioBase: dto.salarioBase,
        ativo: dto.ativo,
      });
      return EmployeeDTOResponse.fromEntity(employee);
    } catch (error) {
      this.logger.error(`Erro ao atualizar funcionário ${id}`, (error as Error).stack);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.getExistingEmployee(id);
    try {
      await this.employeeRepository.delete(id);
    } catch (error) {
      this.logger.error(`Erro ao excluir funcionário ${id}`, (error as Error).stack);
      throw error;
    }
  }

  private async getExistingEmployee(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new EntityNotFoundException('Funcionário', id);
    }
    return employee;
  }
}
