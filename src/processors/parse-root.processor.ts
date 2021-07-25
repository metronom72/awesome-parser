import { performance } from 'perf_hooks';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { getCategories } from '../helpers/puppeteer-helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryDocument, Category } from '../models/category.model';
import { ParseCategoryProcessorName } from './parse-category.processor';
import { JOB_STATUSES } from '../interfaces';
import { defaultOptions, getJobOpts } from './options';

export const ParseRootProcessorName = 'parse-root';

@Processor(ParseRootProcessorName)
export class ParseRootProcessor {
  constructor(
    @InjectModel(Category.name)
    private category: Model<CategoryDocument>,
    @InjectQueue(ParseCategoryProcessorName) private parseCategoryQueue: Queue,
  ) {}

  @Process()
  async transcode(job: Job) {
    const { data } = job;
    try {
      const t0 = performance.now();

      const categories = await getCategories(data.url);

      for (const category of categories) {
        const dbCategory = await this.category.create({
          ...category,
          status: JOB_STATUSES.PENDING,
        });

        const job = await this.parseCategoryQueue.add(
          {
            id: dbCategory.id,
            url: category.url,
          },
          getJobOpts(),
        );

        dbCategory.jobId = job.id as string;
        await dbCategory.save();
      }

      const t1 = performance.now();

      return categories;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
