import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileServersComponent } from './profile-servers.component';
import { ProfileResolver } from './profile-resolver.service';
import { ProfileComponent } from './profile.component';
import { AuthGuard } from '../core';


const routes: Routes = [
  {
    path: ':username',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    resolve: {
      profile: ProfileResolver
    },
    children: [
      {
        path: '',
        component: ProfileServersComponent
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule {}
