import { BadRequestException, Injectable } from '@nestjs/common';
import { ParseProductProcessorName } from '../processors/parse-product.processor';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../models/product.model';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { mapToDTO } from '../mappers/product.mapper';

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
}
