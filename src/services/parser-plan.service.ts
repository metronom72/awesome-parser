import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ParseRootProcessorName } from '../processors/parse-root.processor';
import { ParseCategoryProcessorName } from '../processors/parse-category.processor';
import { ParseProductProcessorName } from '../processors/parse-product.processor';
import { InjectModel } from '@nestjs/mongoose';
import { ProductDocument, Product } from '../models/product.model';
import { Model } from 'mongoose';
import { CategoryDocument, Category } from '../models/category.model';
import { JOB_STATUSES } from '../interfaces';
import { defaultOptions, getJobOpts } from '../processors/options';

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
    @InjectModel(Product.name)
    private product: Model<ProductDocument>,
    @InjectModel(Category.name)
    private category: Model<CategoryDocument>,
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
      const dbCategory = await this.category.create({
        status: JOB_STATUSES.PENDING,
      });

      const job = await this.parseCategoryQueue.add(
        {
          url,
          id: dbCategory.id,
          isCustom: true,
        },
        getJobOpts(),
      );

      dbCategory.jobId = job.id as string;
      await dbCategory.save();
    } else if (type === ParsingTaskEnum.PARSE_PRODUCT) {
      const dbProduct = await this.product.create({
        status: JOB_STATUSES.PENDING,
      });

      const job = await this.parseProductQueue.add(
        {
          url,
          id: dbProduct.id,
          isCustom: true,
        },
        getJobOpts(),
      );

      dbProduct.jobId = job.id as string;
      await dbProduct.save();
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
