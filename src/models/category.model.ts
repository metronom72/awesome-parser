import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class CategoryModel {
  @Prop()
  title: string;

  @Prop()
  url: string;

  @Prop()
  parentUrl: string | null;

  @Prop()
  jobId: string | null;

  @Prop()
  status: string;
}

export type CategoryDocument = CategoryModel & Document;

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);
