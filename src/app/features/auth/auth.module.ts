import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthTestComponent } from './components/auth-test/auth-test.component';

@NgModule({
  declarations: [
    AuthTestComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    AuthTestComponent
  ]
})
export class AuthModule { } 