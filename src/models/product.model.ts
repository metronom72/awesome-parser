import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Product {
  @Prop()
  title: string;

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
  price: string;

  @Prop()
  previousPrice: string;

  @Prop()
  jobId: string | null;

  @Prop()
  status: string;
}

export type ProductDocument = Product & Document;

export const ProductSchema = SchemaFactory.createForClass(Product);
