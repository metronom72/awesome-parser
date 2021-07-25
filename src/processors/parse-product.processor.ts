import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  ParserPlanDocument,
  ParserPlanModel,
  ParserPlanStatuses,
} from '../models/parser-plan.model';
import { getProduct } from '../helpers/puppeteer-helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductModel } from '../models/product.model';
import { JOB_STATUSES } from '../interfaces';

export const ParseProductProcessorName = 'parse-product';

@Processor(ParseProductProcessorName)
export class ParseProductProcessor {
  constructor(
    @InjectModel(ParserPlanModel.name)
    private parserPlan: Model<ParserPlanDocument>,
    @InjectModel(ProductModel.name)
    private product: Model<ProductModel>,
  ) {}

  @Process()
  async transcode(job: Job) {
    const { data } = job;
    try {
      const dbProduct = await this.product.findById(data.id);
      if (!dbProduct) {
        throw new Error(`Product with id ${data.id} wasn't found`);
      }

      const product = await getProduct(data.url);

      Object.entries(product).forEach(([key, value]) => {
        dbProduct[key] = value;
      });

      dbProduct.jobId = null;
      dbProduct.status = JOB_STATUSES.FINISHED;

      await dbProduct.save();
      return;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
