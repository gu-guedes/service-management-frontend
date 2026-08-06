import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';

interface LoginRequestDTO {
  username: string;
  password: string;
}

interface LoginResponseDTO {
  type: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorageKey = 'accessToken';

  login(credentials: LoginRequestDTO): Observable<LoginResponseDTO> {
    console.log('Iniciando login com usuario:', credentials.username);
    return this.http.post<LoginResponseDTO>('auth/login', credentials).pipe(
      tap((response) => {
        console.log('Login realizado com sucesso');
        this.setToken(response.token);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Erro ao fazer login:', error.status, error.message, error.error);
        return throwError(() => new Error(error.error?.message || 'Falha ao autenticar'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  // usado tanto pelo botao "Sair" quanto pelo interceptor de sessao expirada —
  // so desloga de fato (e navega pro login) se a pessoa confirmar
  async confirmAndLogout(message = 'Deseja realmente sair?'): Promise<void> {
    if (!confirm(message)) return;

    this.logout();
    await this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }
}
