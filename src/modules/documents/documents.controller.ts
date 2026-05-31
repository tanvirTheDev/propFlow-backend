import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

interface JwtUser {
  sub: string;
  orgId: string;
  role: Role;
}

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles('LANDLORD')
  create(@Body() dto: CreateDocumentDto, @CurrentUser() user: JwtUser) {
    return this.documentsService.create(dto, user.orgId, user.sub);
  }

  @Get()
  @Roles('LANDLORD', 'TENANT')
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('propertyId') propertyId?: string,
    @Query('unitId') unitId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('category') category?: string,
    @Query('visibility') visibility?: string,
  ) {
    return this.documentsService.findAll(user.orgId, user.sub, user.role, {
      propertyId,
      unitId,
      tenantId,
      category,
      visibility,
    });
  }

  @Get(':id')
  @Roles('LANDLORD', 'TENANT')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.documentsService.findOne(id, user.orgId, user.sub, user.role);
  }

  @Get(':id/access-logs')
  @Roles('LANDLORD')
  getAccessLogs(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.documentsService.getAccessLogs(id, user.orgId);
  }

  @Patch(':id')
  @Roles('LANDLORD')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.documentsService.update(id, dto, user.orgId);
  }

  @Delete(':id')
  @Roles('LANDLORD')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.documentsService.remove(id, user.orgId);
  }
}
