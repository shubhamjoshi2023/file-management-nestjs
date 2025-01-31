import { Injectable } from '@nestjs/common';
import { DataSource, InsertResult, Repository } from 'typeorm';
import { StoreAccessLogDAO } from '../dao/access-log.dao';
import { AccessLog } from '../entities/access-log.entity';

@Injectable()
export class AccessLogRepository extends Repository<AccessLog> {
  constructor(dataSource: DataSource) {
    super(AccessLog, dataSource.manager);
  }

  /**
   * creates new record
   */
  store(data: StoreAccessLogDAO): Promise<AccessLog> {
    return this.save(data);
  }

  async bulkStore(data: StoreAccessLogDAO[]): Promise<InsertResult> {
    return this.createQueryBuilder()
      .insert()
      .into(AccessLog)
      .values(data)
      .execute();
  }
}
