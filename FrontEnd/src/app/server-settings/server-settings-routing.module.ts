import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ServerSettingsComponent } from './server-settings.component';
import { AuthGuard } from '../core';
import { ServerSettingsResolver } from './server-settings-resolver.service';

const routes: Routes = [

  {
    path: ':slug',
    component: ServerSettingsComponent,
    canActivate: [AuthGuard],
    resolve: {
      server: ServerSettingsResolver
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServerSettingsRoutingModule { }
