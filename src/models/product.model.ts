import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { JOB_STATUSES } from '../interfaces';

@Schema()
export class Product {
  @Prop()
  title: string;

  @Prop()
  url: string;

  @Prop()
  categoryId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  properties: any;

  @Prop()
  code: string;

  @Prop([String])
  images: string[];

  @Prop()
  description: string;

  @Prop()
  subheader: string;

  @Prop()
  price: string;

  @Prop()
  previousPrice: string;

  @Prop()
  jobId: string | null;

  @Prop()
  status: JOB_STATUSES;

  @Prop()
  inStock: boolean;

  @Prop()
  scope: string;

  @Prop()
  slug: string;
}

export type ProductDocument = Product & Document;

export const ProductSchema = SchemaFactory.createForClass(Product);
