import { performance } from 'perf_hooks';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { getCategories } from '../helpers/puppeteer-helpers';
import {
  ParserPlanDocument,
  ParserPlanModel,
  ParserPlanStatuses,
} from '../models/parser-plan.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryDocument, CategoryModel } from '../models/category.model';
import { ParseCategoryProcessorName } from './parse-category.processor';

export const ParseRootProcessorName = 'parse-root';

@Processor(ParseRootProcessorName)
export class ParseRootProcessor {
  constructor(
    @InjectModel(ParserPlanModel.name)
    private parserPlan: Model<ParserPlanDocument>,
    @InjectModel(CategoryModel.name)
    private category: Model<CategoryDocument>,
    @InjectQueue(ParseCategoryProcessorName) private parseCategoryQueue: Queue,
  ) {}

  @Process()
  async transcode(job: Job) {
    const { data } = job;
    try {
      const t0 = performance.now();

      const parserPlan = await this.parserPlan.create({
        jobId: job.id,
        status: ParserPlanStatuses.IN_PROGRESS,
        categories: [],
        products: [],
      });

      const categories = await getCategories(data.url);

      parserPlan.categories = categories.map(
        (category) => new this.category(category),
      );

      await parserPlan.save();

      for (const category of categories) {
        await this.parseCategoryQueue.add({
          url: category.url,
          parserPlanId: parserPlan.id,
        });
      }

      await parserPlan.save();

      const t1 = performance.now();

      return parserPlan.toJSON();
    } catch (err) {
      console.log(err);
    }
  }
}
