import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (ABSOLUTE_URL_PATTERN.test(req.url)) {
    return next(req);
  }

  const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  const relativeUrl = req.url.replace(/^\//, '');

  return next(req.clone({ url: `${baseUrl}/${relativeUrl}` }));
};
