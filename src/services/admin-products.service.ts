import { BadRequestException, Injectable } from '@nestjs/common';
import { ParseProductProcessorName } from '../processors/parse-product.processor';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../models/product.model';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { mapToDTO } from '../mappers/product.mapper';
import { ISearchQuery } from '../controllers/products.controller';

const FIRST_PAGE = 1;
const DEFAULT_PER_PAGE = 30;

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectQueue(ParseProductProcessorName) private parseProductQueue: Queue,
    @InjectModel(Product.name)
    private product: Model<ProductDocument>,
  ) {}

  public async getProduct(id: string) {
    try {
      const product = await this.product.findById(id);
      return mapToDTO(product);
    } catch (err) {
      throw new BadRequestException(`Can't find product with id: ${id}`);
    }
  }

  public async getProducts(query: ISearchQuery) {
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
}
