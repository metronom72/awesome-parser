import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ParseRootProcessorName } from '../processors/parse-root.processor';
import { ParseCategoryProcessorName } from '../processors/parse-category.processor';
import { ParseProductProcessorName } from '../processors/parse-product.processor';

export enum ParsingTaskEnum {
  PARSE_CATEGORY = 'CATEGORY',
  PARSE_PRODUCT = 'PRODUCT',
}

@Injectable()
export class ParserPlanService {
  constructor(
    @InjectQueue(ParseRootProcessorName) private rootQueue: Queue,
    @InjectQueue(ParseCategoryProcessorName) private parseCategoryQueue: Queue,
    @InjectQueue(ParseProductProcessorName) private parseProductQueue: Queue,
  ) {}

  public async generatePlan() {
    const job = await this.rootQueue.add({
      url: 'https://ozon.ru',
      type: 'ozon',
    });

    return job.id;
  }

  public async addParsingTask(url: string, type: ParsingTaskEnum) {
    if (type === ParsingTaskEnum.PARSE_CATEGORY) {
      const job = await this.parseCategoryQueue.add({
        url,
        isCustom: true,
      });

      return job.id;
    } else if (type === ParsingTaskEnum.PARSE_PRODUCT) {
      const job = await this.parseProductQueue.add({
        url,
        isCustom: true,
      });
    }
    return null;
  }

  // private async getActiveTask(url: OriginTypes) {
  //   const client = new cloudTasks.CloudTasksClient();
  //   const name = client.taskPath(
  //     GCP_PROJECT,
  //     GCP_REGION,
  //     PARSER_PLAN_QUEUE,
  //     TaskNames.GENERATE_PARSER_PLAN,
  //   );
  //   const res = await client.getTask({ name });
  //   console.log(res);
  // }
}
