import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const ReqData = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    let result: any = {};
    if (
      request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'PATCH'
    ) {
      result = {
        ...request.params,
        ...request.body,
      };
    } else if (request.method === 'GET' || request.method === 'DELETE') {
      result = {
        ...request.params,
        ...request.query,
      };
    }

    console.log(result);

    return data ? result[data] : result;
  },
);
