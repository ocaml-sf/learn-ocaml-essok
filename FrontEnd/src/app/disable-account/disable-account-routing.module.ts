import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileResolver } from '../profile/profile-resolver.service';
import { AuthGuard } from '../core';
import { DisableAccountComponent } from './disable-account.component';


const routes: Routes = [
  {
    path: '',
    component: DisableAccountComponent,
    canActivate: [AuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DisableAccountRoutingModule { }
