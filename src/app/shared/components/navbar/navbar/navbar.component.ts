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

  constructor(
    private iconService: IconService,
    private authService: AuthService
  ) {
    this.isAuthenticated = this.authService.isAuthenticated();
  }
}
