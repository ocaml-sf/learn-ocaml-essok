import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ServerComponent } from './server.component';
import { ServerResolver } from './server-resolver.service';
import { AuthGuard } from '../core';

const routes: Routes = [
  {
    path: ':slug',
    component: ServerComponent,
    canActivate: [AuthGuard],
    resolve: {
      server: ServerResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServerRoutingModule { }
