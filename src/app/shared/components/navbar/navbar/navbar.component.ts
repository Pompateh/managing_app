import { AfterViewInit, Component, EventEmitter, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SimpleButtonComponent } from '@shared-components/simple-button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { IconService } from '@shared-services/icon/icon.service';
import { CommonModule } from '@angular/common';
import { Button } from '@custom-interfaces/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    SimpleButtonComponent,
    MatSidenavModule,
    MatIconModule,
    CommonModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Input() fixed: boolean = true;
  @Input() buttons!: Button[];
  isAuthenticated: boolean = false;
  UserRole = UserRole;

  constructor(
    private iconService: IconService,
    public authService: AuthService,
    private router: Router
  ) {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToProjects() {
    const user = this.authService.getCurrentUser();
    if (user?.role === UserRole.VIEWER && user.assignedProjectId) {
      // Redirect viewer to their assigned project
      this.router.navigate(['/projects', user.assignedProjectId]);
    } else {
      // For other roles, go to projects list
      this.router.navigate(['/projects']);
    }
  }
}
