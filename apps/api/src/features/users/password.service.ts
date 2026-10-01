import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class PasswordService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.config.get('auth', { infer: true }).saltRounds);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
