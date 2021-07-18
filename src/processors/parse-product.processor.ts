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
      if (!data.isCustom) {
        const parserPlan = await this.parserPlan.findById(data.parserPlanId);

        if (
          !parserPlan ||
          parserPlan.status !== ParserPlanStatuses.IN_PROGRESS
        ) {
          return;
        }
      }

      const product = await getProduct(data.url);

      await this.product.create(product);

      if (!product) {
        console.log("product wasn't found");
        await getProduct(data.url, false);
      }
    } catch (err) {
      console.log(err);
    }
  }
}
