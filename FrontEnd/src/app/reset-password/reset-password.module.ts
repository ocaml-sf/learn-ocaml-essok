import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { ResetPasswordRoutingModule } from './reset-password-routing.module';
import { ResetPasswordComponent } from './reset-password.component';

@NgModule({
  imports: [
    SharedModule,
    ResetPasswordRoutingModule
  ],
  declarations: [
    ResetPasswordComponent
  ]
})
export class ResetPasswordModule { }
