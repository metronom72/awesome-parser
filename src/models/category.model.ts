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
}

export type CategoryDocument = CategoryModel & Document;

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);
