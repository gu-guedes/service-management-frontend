import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

// se qualquer chamada (exceto o proprio login) voltar 401/403, o token nao e
// mais valido — pede confirmacao e leva de volta pro login (ver AuthService.confirmAndLogout).
// 403 entra aqui porque o backend ainda nao tem sistema de permissoes: hoje,
// qualquer usuario autenticado pode tudo, entao um 403 so acontece quando o
// filtro JWT rejeita o token (nao configura um AuthenticationEntryPoint proprio
// pra diferenciar "sem token valido" de "sem permissao").
export const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isLoginRequest = req.url.includes('/auth/login');
      const isAuthError = error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);

      if (!isLoginRequest && isAuthError) {
        void authService.confirmAndLogout('Sua sessao expirou. Deseja sair e fazer login novamente?');
      }

      return throwError(() => error);
    })
  );
};