import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ReqData } from '../helpers/req-data';
import { AdminProductsService } from '../services/admin-products.service';

@Controller('/api/v1/admin/products')
export class ProductsController {
  constructor(private productsService: AdminProductsService) {}

  @Get()
  public getProducts(@ReqData() data: ISearchQuery) {
    return this.productsService.getProducts(data);
  }

  @Get('/:id')
  public getProduct(@ReqData() data: { id: string }) {
    return this.productsService.getProduct(data.id);
  }

  @Post('')
  public createProduct(@ReqData() data: INewProduct) {
    return {};
  }

  @Patch('/:id')
  public updateProduct(@ReqData() data: IProduct) {
    return {};
  }

  @Post('/:id/sync')
  public syncProduct(@ReqData() data: { id: string }) {
    return {};
  }

  @Delete('/:id')
  public deleteProduct(@ReqData() data: { id: string }) {
    return {};
  }

  @Post('/validate')
  public validateProduct(@ReqData() data: IProduct) {
    return {};
  }
}

export interface ISearchQuery {
  page?: number;
  perPage?: number;
  includeErrors?: boolean;
}

export interface INewProduct {
  title: string;
  subheader: string;
  description: string;
  slug: string;
  inStock: boolean;
  images: string[];
  category: string;
}

export interface IProduct extends INewProduct {
  id: string;
}
