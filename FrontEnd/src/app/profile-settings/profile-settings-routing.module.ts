import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core';
import { ProfileSettingsComponent} from './profile-settings.component';
import { ProfileSettingsResolver } from './profile-settings-resolver.service';

const routes: Routes = [
  {
    path: ':username',
    component: ProfileSettingsComponent,
    canActivate: [AuthGuard],
    resolve: {
      profile: ProfileSettingsResolver
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileSettingsRoutingModule { }
