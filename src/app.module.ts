import { Module } from '@nestjs/common';
import { ParserPlanController } from './controllers/parser-plan.controller';
import { ParserPlanService } from './services/parser-plan.service';
import { BullModule } from '@nestjs/bull';
import {
  ParseRootProcessor,
  ParseRootProcessorName,
} from './processors/parse-root.processor';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './models/category.model';
import {
  ParseCategoryProcessor,
  ParseCategoryProcessorName,
} from './processors/parse-category.processor';
import {
  ParseProductProcessor,
  ParseProductProcessorName,
} from './processors/parse-product.processor';
import { Product, ProductSchema } from './models/product.model';
import { ConfigModule } from '@nestjs/config';
import { AdminProductsService } from './services/admin-products.service';
import { ProductsController } from './controllers/products.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: ParseRootProcessorName,
      },
      {
        name: ParseCategoryProcessorName,
      },
      {
        name: ParseProductProcessorName,
      },
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`,
    ),
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [ParserPlanController, ProductsController],
  providers: [
    ParserPlanService,
    AdminProductsService,
    ParseRootProcessor,
    ParseCategoryProcessor,
    ParseProductProcessor,
  ],
})
export class AppModule {}
