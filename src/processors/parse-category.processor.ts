import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, Queue } from 'bull';
import { getProductUrls } from '../helpers/puppeteer-helpers';
import { ParseProductProcessorName } from './parse-product.processor';
import { ProductDocument, Product } from '../models/product.model';
import { JOB_STATUSES } from '../interfaces';
import { CategoryDocument, Category } from '../models/category.model';
import { defaultOptions, getJobOpts } from './options';
import { stripQuery } from '../helpers/url-helpers';

export const ParseCategoryProcessorName = 'parse-category';

const MAX_PAGE = 5;

@Processor({ name: ParseCategoryProcessorName })
export class ParseCategoryProcessor {
  constructor(
    @InjectModel(Product.name)
    private product: Model<ProductDocument>,
    @InjectModel(Category.name)
    private category: Model<CategoryDocument>,
    @InjectQueue(ParseCategoryProcessorName) private parseCategoryQueue: Queue,
    @InjectQueue(ParseProductProcessorName) private parseProductQueue: Queue,
  ) {}

  @Process({ concurrency: 3 })
  async transcode(job: Job) {
    const { data } = job;
    try {
      const dbCategory = await this.category.findById(data.id);
      if (!dbCategory) {
        throw new Error(`Category with id ${data.id} wasn't found`);
      }

      const urls = (await getProductUrls(data.url)).map(stripQuery);

      if (urls.length > 0) {
        for (const url of urls) {
          let dbProduct = null;

          dbProduct = await this.product.findOne({
            url: url,
          });

          if (dbProduct) {
            dbProduct.status = JOB_STATUSES.PENDING;
            await dbProduct.save();
          }

          dbProduct =
            dbProduct ||
            (await this.product.create({
              categoryId: dbCategory.id,
              url: url,
              status: JOB_STATUSES.PENDING,
            }));
          const productJob = await this.parseProductQueue.add(
            {
              id: dbProduct.id,
              url,
            },
            getJobOpts(),
          );

          dbProduct.jobId = productJob.id.toString();
          await dbProduct.save();
        }

        const nextUrl = generateNextCategoryUrl(data.url);
        if (nextUrl) {
          await this.parseCategoryQueue.add(
            {
              url: nextUrl,
              id: dbCategory.id,
              parentJobId: job.id,
            },
            getJobOpts(),
          );
        } else {
          dbCategory.status = JOB_STATUSES.FINISHED;
          dbCategory.jobId = null;
          await dbCategory.save();
        }
      }

      return;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

function generateNextCategoryUrl(url: string, token = 'page') {
  const _url = new URL(url);
  const page = parseInt(new URLSearchParams(_url.search).get(token), 10) || 1;
  const nextPage = page + 1;
  if (nextPage > MAX_PAGE) return null;
  _url.search = `?page=${page + 1}`;
  return _url.toString();
}
