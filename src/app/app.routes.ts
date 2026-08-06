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
		loadComponent: () => import('./app.component').then((m) => m.AppComponent),
		children: [
			{
				path: 'pets',
				loadComponent: () => import('./features/pets/pages/pets-page.component').then((m) => m.PetsPageComponent)
			},
			{
				path: 'tutors',
				loadComponent: () => import('./features/tutors/pages/tutors-page.component').then((m) => m.TutorsPageComponent)
			},
			{
				path: 'registration',
				loadComponent: () =>
					import('./features/registration/pages/registration-page.component').then((m) => m.RegistrationPageComponent)
			},
			{
				path: 'care',
				loadComponent: () => import('./features/care/pages/care-page.component').then((m) => m.CarePageComponent)
			},
			{ path: '', pathMatch: 'full', redirectTo: 'pets' }
		]
	},
	{ path: '', pathMatch: 'full', redirectTo: 'app' },
	{ path: '**', redirectTo: 'app' }
];
