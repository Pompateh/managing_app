import { inject } from '@angular/core';
import { Router, type CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseAuthService } from '../services/supabase/supabase-auth.service';
import { UserRole } from '../models/user.model';
import { BoardDataService } from '../../shared/services/board-data/board-data.service';

export interface AuthGuardData {
  roles?: string[];
  requireAuth?: boolean;
}

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(SupabaseAuthService);
  const router = inject(Router);
  const boardData = inject(BoardDataService);

  const data = route.data as AuthGuardData;
  const requireAuth = data.requireAuth ?? true;

  if (!requireAuth) {
    return true;
  }

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  if (data.roles && !authService.hasRole(data.roles)) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
}; 