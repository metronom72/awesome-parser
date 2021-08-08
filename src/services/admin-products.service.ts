import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { ParseProductProcessorName } from '../processors/parse-product.processor';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../models/product.model';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { mapToDTO } from '../mappers/product.mapper';
import { INewProduct, IProduct } from '../controllers/products.controller';
import { ParserPlanService, ParsingTaskEnum } from './parser-plan.service';
import { GetProductsDTO } from '../dtos/admin-products.dto';
import { ReqData } from '../helpers/req-data';

const FIRST_PAGE = 1;
const DEFAULT_PER_PAGE = 30;

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectQueue(ParseProductProcessorName) private parseProductQueue: Queue,
    @InjectModel(Product.name)
    private product: Model<ProductDocument>,
    private parserPlan: ParserPlanService,
  ) {}

  public async getProduct(id: string) {
    try {
      const product = await this.product.findById(id);
      return mapToDTO(product);
    } catch (err) {
      throw new BadRequestException(`Can't find product with id: ${id}`);
    }
  }

  public async getProducts(@Query() query: GetProductsDTO) {
    try {
      const {
        page = FIRST_PAGE,
        perPage = DEFAULT_PER_PAGE,
        includeErrors,
      } = query;
      const products = await this.product
        .find()
        .skip(page > 0 ? (page - 1) * perPage : 0)
        .limit(perPage);

      return {
        products: products.map((product) => mapToDTO(product, includeErrors)),
        query,
      };
    } catch (err) {
      throw new BadRequestException(
        `Can't find products by ${JSON.stringify(query)}`,
      );
    }
  }

  public async updateProduct(data: IProduct) {
    try {
      const product = await this.product.findById(data.id);

      delete data.id;
      Object.entries(data).reduce((res, [key, value]) => {
        res[key] = value;
        return res;
      }, product);
      await product.save();

      return mapToDTO(product);
    } catch (err) {
      throw new BadRequestException(`Can't upldate product by id ${data.id}`);
    }
  }

  public async createProduct(data: INewProduct) {
    try {
      const product = new this.product(data);
      await product.save();

      return mapToDTO(product);
    } catch (err) {
      throw new BadRequestException(
        `Can't create products for ${JSON.stringify(data)}`,
      );
    }
  }

  public async syncProduct(id: string) {
    try {
      const product = await this.product.findById(id);

      if (!product.scope) {
        throw new BadRequestException(
          `Can't sync product without scope. Product id: ${id}`,
        );
      }

      if (!product.url) {
        throw new BadRequestException(
          `Can't sync product without url. Product id: ${id}`,
        );
      }

      await this.parserPlan.addParsingTask(
        product.url,
        ParsingTaskEnum.PARSE_PRODUCT,
      );

      return mapToDTO(product);
    } catch (err) {
      throw new BadRequestException(`Can't sync product for id ${id}`);
    }
  }
}
