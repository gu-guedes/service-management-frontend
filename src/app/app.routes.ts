import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { authGuard } from './guards/auth.guard';
import { LoginPageComponent } from './pages/login/login-page.component';

export const routes: Routes = [
	{ path: 'login', component: LoginPageComponent },
	{ path: 'app', component: AppComponent, canActivate: [authGuard] },
	{ path: '', pathMatch: 'full', redirectTo: 'app' },
	{ path: '**', redirectTo: 'app' }
];
