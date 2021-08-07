import { Controller, Post } from '@nestjs/common';
import {
  ParserPlanService,
  ParsingTaskEnum,
} from '../services/parser-plan.service';
import { ReqData } from '../helpers/req-data';

@Controller('/api/v1/parser-plan')
export class ParserPlanController {
  constructor(private parserPlanService: ParserPlanService) {}

  @Post('/generate')
  public async generatePlan() {
    await this.parserPlanService.generatePlan();
  }

  @Post('/add-category')
  public async parseCategory(@ReqData() data) {
    await this.parserPlanService.addParsingTask(
      data.url,
      ParsingTaskEnum.PARSE_CATEGORY,
    );
  }

  @Post('/add-product')
  public async parseProduct(@ReqData() data) {
    await this.parserPlanService.addParsingTask(
      data.url,
      ParsingTaskEnum.PARSE_PRODUCT,
    );
  }
}
