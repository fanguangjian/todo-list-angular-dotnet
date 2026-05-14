import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

import { ApiResponse } from './models';

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map((event) => {
      if (
        event instanceof HttpResponse &&
        event.body !== null &&
        typeof event.body === 'object' &&
        'data' in (event.body as object)
      ) {
        return event.clone({ body: (event.body as ApiResponse<unknown>).data });
      }
      return event;
    }),
  );
