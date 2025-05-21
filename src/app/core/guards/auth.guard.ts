import { inject } from '@angular/core';
import { Router, type CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UserRole } from '../models/user.model';
import { BoardDataService } from '../../shared/services/board-data/board-data.service';

export interface AuthGuardData {
  roles?: string[];
  requireAuth?: boolean;
}

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const boardDataService = inject(BoardDataService);
  const guardData = route.data as AuthGuardData;

  console.log('Auth Guard - Current URL:', state.url);
  console.log('Auth Guard - Route Data:', guardData);
  console.log('Auth Guard - Is Authenticated:', authService.isAuthenticated());
  console.log('Auth Guard - Current User:', authService.getCurrentUser());

  // If we're trying to access the login page while authenticated,
  // redirect to the default route
  if (state.url === '/login' && authService.isAuthenticated()) {
    console.log('Auth Guard - Redirecting from login to board');
    router.navigate(['/board']);
    return false;
  }

  // If authentication is not required, allow access
  if (guardData.requireAuth === false) {
    console.log('Auth Guard - No auth required, allowing access');
    return true;
  }

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    console.log('Auth Guard - Not authenticated, redirecting to login');
    router.navigate(['/login'], { 
      queryParams: { 
        returnUrl: state.url,
        error: 'Please log in to access this page'
      }
    });
    return false;
  }

  // If roles are specified, check if user has required role
  if (guardData.roles && guardData.roles.length > 0) {
    console.log('Auth Guard - Checking roles:', guardData.roles);
    const hasRequiredRole = authService.hasRole(guardData.roles);
    console.log('Auth Guard - Has required role:', hasRequiredRole);
    if (!hasRequiredRole) {
      console.log('Auth Guard - Missing required role, redirecting to 404');
      router.navigate(['/404'], {
        queryParams: { 
          error: 'You do not have permission to access this page'
        }
      });
      return false;
    }
  }

  // Restrict viewers to only their assigned board
  const user = authService.getCurrentUser();
  if (user?.role === UserRole.VIEWER && state.url.startsWith('/board')) {
    const boardId = route.queryParams['id'];
    const board = boardDataService.getBoard(boardId);
    if (!board || board.projectId !== user.assignedProjectId) {
      console.log('Auth Guard - Viewer tried to access a board not assigned to them, redirecting to 404');
      router.navigate(['/404'], {
        queryParams: {
          error: 'You do not have permission to access this board'
        }
      });
      return false;
    }
  }

  console.log('Auth Guard - Access granted');
  return true;
}; 