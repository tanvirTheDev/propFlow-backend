import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('tickets')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user, dto);
  }

  @Get('tickets')
  findAll(@CurrentUser() user: JwtPayload, @Query() dto: ListTicketsDto) {
    return this.ticketsService.findAll(user, dto);
  }

  @Get('tickets/:id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ticketsService.findOne(user, id);
  }

  @Patch('tickets/:id/status')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateStatus(user, id, dto);
  }

  @Post('tickets/:id/notes')
  createNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.ticketsService.createNote(user, id, dto);
  }

  @Get('tickets/:id/notes')
  findNotes(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ticketsService.findNotes(user, id);
  }

  @Get('units/:unitId/ticket-history')
  findUnitHistory(@CurrentUser() user: JwtPayload, @Param('unitId') unitId: string) {
    return this.ticketsService.findUnitHistory(user, unitId);
  }
}
