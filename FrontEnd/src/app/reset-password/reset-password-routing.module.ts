import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileResolver } from '../profile/profile-resolver.service';
import { AuthGuard } from '../core';
import { ResetPasswordComponent } from './reset-password.component';


const routes: Routes = [
  {
    path: '',
    component: ResetPasswordComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResetPasswordRoutingModule { }
