import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ServerComponent } from './server.component';
import { ServerResolver } from './server-resolver.service';
import { ServerSettingsComponent } from './server-settings.component';

const routes: Routes = [
  {
    path: ':slug',
    component: ServerComponent,
    resolve: {
      server: ServerResolver
    },
    children: [
      {
        path: '',
        component: ServerSettingsComponent,
        outlet: 'server-settings'
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServerRoutingModule {}
