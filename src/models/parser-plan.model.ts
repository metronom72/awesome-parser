import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CategoryModel } from './category.model';
import { Document } from 'mongoose';

export enum ParserPlanStatuses {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED',
}

@Schema()
export class ParserPlanModel {
  @Prop()
  jobId: string;

  @Prop(ParserPlanStatuses)
  status: ParserPlanStatuses;

  @Prop([CategoryModel])
  categories: Array<{ title: string; url: string; parentUrl: string | null }>;
}

export type ParserPlanDocument = ParserPlanModel & Document;

export const ParserPlanSchema = SchemaFactory.createForClass(ParserPlanModel);
