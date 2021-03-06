import { ProductDocument } from '../models/product.model';
import { JOB_STATUSES } from '../interfaces';
// import { Schema } from 'valivar';

export type ProductDTOType = {
  id: string | number;
  title?: string;
  url?: string;
  categoryId?: string;
  properties?: any;
  code?: string;
  images?: string[];
  description?: string;
  previousPrice?: string;
  status: JOB_STATUSES;
};

// export const ProductDTOSchema = (scope?: string) =>
//   new Schema({
//     id: {
//       type: String,
//     },
//     title: {
//       type: String,
//       required: true,
//     },
//     url: {
//       type: String,
//       required: !!scope,
//     },
//     categoryId: {
//       type: String,
//       required: true,
//     },
//     properties: {
//       type: Array,
//     },
//     code: {
//       type: String,
//       required: !!scope,
//     },
//     images: {
//       type: Array,
//       required: true,
//       each: {
//         type: String,
//       },
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     subheader: {
//       type: String,
//       required: true,
//     },
//     price: {
//       type: String,
//       required: true,
//     },
//     previousPrice: {
//       type: String,
//     },
//     scope: {
//       type: Number,
//     },
//     inStock: {
//       type: Boolean,
//       required: true,
//     },
//     slug: {
//       type: String,
//       required: true,
//     },
//   });

export const mapToDTO = (
  product: ProductDocument,
  includeErrors = true,
): {
  product: ProductDTOType;
  errors?: Array<{ message: string; path: string }>;
} => {
  const productDTO = {
    id: product._id,
    title: product.title,
    url: product.url,
    categoryId: product.categoryId,
    properties: product.properties,
    code: product.code,
    images: product.images,
    description: product.description,
    previousPrice: product.previousPrice,
    status: product.status,
  };
  // const errors = ProductDTOSchema(product.scope).validate(product.toJSON());
  return {
    product: productDTO,
    ...(includeErrors
      ? {
          errors: [],
          // errors: errors.map(({ message, path }) => ({
          //   message,
          //   path,
          // })),
        }
      : {}),
  };
};
