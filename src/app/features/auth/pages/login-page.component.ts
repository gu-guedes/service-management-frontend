import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  isSubmitting = false;

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  async submit(): Promise<void> {
    if (this.isSubmitting) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const value = this.form.getRawValue();
      await firstValueFrom(
        this.authService.login({
          username: value.username ?? '',
          password: value.password ?? ''
        })
      );

      await this.router.navigate(['/app']);
    } catch {
      this.toastService.error('Falha no login. Verifique usuario e senha.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
