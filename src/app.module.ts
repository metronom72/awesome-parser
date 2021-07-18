import { Module } from '@nestjs/common';
import { ParserPlanController } from './controllers/parser-plan.controller';
import { ParserPlanService } from './services/parser-plan.service';
import { BullModule } from '@nestjs/bull';
import {
  ParseRootProcessor,
  ParseRootProcessorName,
} from './processors/parse-root.processor';
import { MongooseModule } from '@nestjs/mongoose';
import { ParserPlanModel, ParserPlanSchema } from './models/parser-plan.model';
import { CategoryModel, CategorySchema } from './models/category.model';
import {
  ParseCategoryProcessor,
  ParseCategoryProcessorName,
} from './processors/parse-category.processor';
import {
  ParseProductProcessor,
  ParseProductProcessorName,
} from './processors/parse-product.processor';
import { ProductModel, ProductSchema } from './models/product.model';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: ParseRootProcessorName,
        redis: {
          host: 'redis',
          port: 6379,
        },
      },
      {
        name: ParseCategoryProcessorName,
        redis: {
          host: 'redis',
          port: 6379,
        },
      },
      {
        name: ParseProductProcessorName,
        redis: {
          host: 'redis',
          port: 6379,
        },
      },
    ),
    MongooseModule.forRoot(
      'mongodb+srv://robot:9Xs4wDkLSMozwxWU@cluster0.y2sjv.mongodb.net/parser_db?retryWrites=true&w=majority',
    ),
    MongooseModule.forFeature([
      {
        name: ParserPlanModel.name,
        schema: ParserPlanSchema,
      },
      {
        name: CategoryModel.name,
        schema: CategorySchema,
      },
      {
        name: ProductModel.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [ParserPlanController],
  providers: [
    ParserPlanService,
    ParseRootProcessor,
    ParseCategoryProcessor,
    ParseProductProcessor,
  ],
})
export class AppModule {}
