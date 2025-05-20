import { Routes } from '@angular/router';
import { BoardComponent } from './features/board/pages/board/board.component';
import { AccountComponent } from './features/account/pages/account/account.component';
import { LoginComponent } from './features/login/pages/login/login.component';
import { SignUpComponent } from './features/sign-up/pages/sign-up/sign-up.component';
import { ResetPasswordComponent } from './features/reset-password/pages/reset-password/reset-password.component';
import { AboutComponent } from './features/about/pages/about/about.component';
import { SupportComponent } from './features/support/pages/support/support.component';
import { NotFoundComponent } from './features/notfound/not-found/not-found.component';
import { AdminLandingComponent } from './features/admin-landing/pages/admin-landing/admin-landing.component';
import { authGuard } from './core/guards/auth.guard';
import { ProjectListComponent } from './features/project-list/project-list.component';
import { ProjectDetailsComponent } from './features/project-details/project-details.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { requireAuth: false }
  },
  {
    path: 'admin',
    component: AdminLandingComponent,
    canActivate: [authGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'projects',
    component: ProjectListComponent,
    canActivate: [authGuard],
    data: { roles: ['admin', 'user'] }
  },
  {
    path: 'projects/:id',
    component: ProjectDetailsComponent,
    canActivate: [authGuard],
    data: { roles: ['admin', 'user'] }
  },
  {
    path: 'account',
    redirectTo: 'projects',
    pathMatch: 'full'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    data: { requireAuth: false }
  },
  {
    path: 'resetpassword',
    component: ResetPasswordComponent,
    data: { requireAuth: false }
  },
  {
    path: 'about',
    component: AboutComponent,
    data: { requireAuth: false }
  },
  {
    path: 'board',
    component: BoardComponent,
    canActivate: [authGuard],
    data: { roles: ['admin', 'user'] }
  },
  {
    path: 'support',
    component: SupportComponent,
    data: { requireAuth: false }
  },
  {
    path: '404',
    component: NotFoundComponent,
    data: { requireAuth: false }
  },
  {
    path: '**',
    redirectTo: '/404'
  }
];
