import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductsDTO {
  @IsInt()
  @Type(() => Number)
  page: number;

  @IsInt()
  @Type(() => Number)
  perPage: number;

  @IsBoolean()
  @IsOptional()
  includeErrors: boolean;
}
