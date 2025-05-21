import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { NavbarComponent } from './shared/components/navbar/navbar/navbar.component';
import { AuthService } from './core/services/auth/auth.service';

@Component({ 
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    RouterOutlet,
    MarkdownModule,
    NavbarComponent
  ],
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}

