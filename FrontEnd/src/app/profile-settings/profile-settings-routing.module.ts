import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core';
import { ProfileSettingsComponent } from './profile-settings.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileSettingsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileSettingsRoutingModule { }
