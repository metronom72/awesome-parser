import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import {
  ParserPlanDocument,
  ParserPlanModel,
  ParserPlanStatuses,
} from '../models/parser-plan.model';
import { Model } from 'mongoose';
import { Job, Queue } from 'bull';
import { getProductUrls } from '../helpers/puppeteer-helpers';
import { ParseProductProcessorName } from './parse-product.processor';

export const ParseCategoryProcessorName = 'parse-category';

const MAX_PAGE = 5;

@Processor({ name: ParseCategoryProcessorName })
export class ParseCategoryProcessor {
  constructor(
    @InjectModel(ParserPlanModel.name)
    private parserPlan: Model<ParserPlanDocument>,
    @InjectQueue(ParseCategoryProcessorName) private parseCategoryQueue: Queue,
    @InjectQueue(ParseProductProcessorName) private parseProductQueue: Queue,
  ) {}

  @Process({ concurrency: 3 })
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
      const urls = await getProductUrls(data.url);

      if (urls.length > 0) {
        urls.forEach(url => {
          this.parseProductQueue.add({
            url,
            isCustom: !!data.isCustom,
          })
        })

        const nextUrl = generateNextCategoryUrl(data.url);
        if (nextUrl) {
          await this.parseCategoryQueue.add({
            url: nextUrl,
            parserPlanId: data.parserPlanId,
            parentJobId: job.id,
            isCustom: !!data.isCustom,
          });
        }
      }

      return;
    } catch (err) {
      console.log(err);
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
