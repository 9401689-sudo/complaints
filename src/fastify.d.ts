import { Pool } from 'pg';
import Redis from 'ioredis';
import { CasesService } from '../modules/cases/cases.service';
import { FilesService } from '../modules/files/files.service';
import { FsmService } from '../modules/fsm/fsm.service';

declare module 'fastify' {
  interface FastifyInstance {
    di: {
      pg: Pool;
      redis: Redis;
      fsmService: FsmService;
      casesService: CasesService;
      filesService: FilesService;
    };
  }
}
