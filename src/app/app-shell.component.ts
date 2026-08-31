import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-confirm-dialog />
  `
})
export class AppShellComponent {}
