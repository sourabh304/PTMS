import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/** Translates well-known Prisma errors into meaningful HTTP responses. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const mapping: Record<string, { status: number; message: string }> = {
      P2002: { status: HttpStatus.CONFLICT, message: this.uniqueMessage(exception) },
      P2003: { status: HttpStatus.CONFLICT, message: 'The record is referenced by other data and cannot be changed' },
      P2025: { status: HttpStatus.NOT_FOUND, message: 'The requested record was not found' },
    };

    const mapped = mapping[exception.code];
    if (!mapped) {
      this.logger.error(`Unhandled Prisma error ${exception.code}: ${exception.message}`);
    }

    const status = mapped?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      message: mapped?.message ?? 'An unexpected database error occurred',
      error: exception.code,
    });
  }

  private uniqueMessage(exception: Prisma.PrismaClientKnownRequestError): string {
    const target = exception.meta?.target;
    const fields = Array.isArray(target) ? target.join(', ') : typeof target === 'string' ? target : 'field';
    return `A record with the same ${fields} already exists`;
  }
}
