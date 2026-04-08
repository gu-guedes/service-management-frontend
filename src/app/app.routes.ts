import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/auth/pages/login-page.component').then((m) => m.LoginPageComponent)
	},
	{
		path: 'app',
		canActivate: [authGuard],
		loadComponent: () => import('./app.component').then((m) => m.AppComponent)
	},
	{ path: '', pathMatch: 'full', redirectTo: 'app' },
	{ path: '**', redirectTo: 'app' }
];
