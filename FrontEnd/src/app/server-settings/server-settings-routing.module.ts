import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core';
import { ServerSettingsComponent } from './server-settings.component';

const routes: Routes = [
  {
    path: '',
    component: ServerSettingsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServerSettingsRoutingModule {}
