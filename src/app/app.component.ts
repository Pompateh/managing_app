import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { NavbarComponent } from './shared/components/navbar/navbar/navbar.component';
import { AuthService } from './core/services/auth/auth.service';
import { Button } from '@custom-interfaces/button';

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
  buttons: Button[] = [
    {
      text: 'Login',
      routerLink: '/login',
      theme: 'btn-primary',
      elementType: 'a',
      customStyles: 'ms-2'
    },
    {
      text: 'Sign Up',
      routerLink: '/signup',
      theme: 'btn-secondary',
      elementType: 'a',
      customStyles: 'ms-2'
    }
  ];

  constructor(public authService: AuthService) {
    // Update buttons based on authentication state
    this.authService.state$.subscribe(state => {
      if (state.isAuthenticated) {
        this.buttons = [];
      } else {
        this.buttons = [
          {
            text: 'Login',
            routerLink: '/login',
            theme: 'btn-primary',
            elementType: 'a',
            customStyles: 'ms-2'
          },
          {
            text: 'Sign Up',
            routerLink: '/signup',
            theme: 'btn-secondary',
            elementType: 'a',
            customStyles: 'ms-2'
          }
        ];
      }
    });
  }
}

