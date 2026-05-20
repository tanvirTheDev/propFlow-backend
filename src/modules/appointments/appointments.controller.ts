import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('tickets/:ticketId/appointments')
  create(
    @CurrentUser() user: JwtPayload,
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(user, ticketId, dto);
  }

  @Get('appointments')
  findAll(@CurrentUser() user: JwtPayload, @Query() dto: ListAppointmentsDto) {
    return this.appointmentsService.findAll(user, dto);
  }

  @Get('appointments/upcoming')
  findUpcoming(@CurrentUser() user: JwtPayload) {
    return this.appointmentsService.findUpcoming(user);
  }

  @Get('appointments/:id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.appointmentsService.findOne(user, id);
  }

  @Patch('appointments/:id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user, id, dto);
  }

  @Post('appointments/:id/complete')
  complete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CompleteAppointmentDto,
  ) {
    return this.appointmentsService.complete(user, id, dto);
  }

  @Post('appointments/:id/cancel')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(user, id, dto);
  }
}
