import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../core';
import { AdminComponent } from './admin.component';
import { AdminServersComponent } from './admin-servers.component';
import { AdminUsersComponent } from './admin-users.component';
import { AdminResolver } from './admin-resolver.service';

const routes: Routes = [
    {
        path: '',
        component: AdminComponent,
        canActivate: [AuthGuard],
        resolve: {
            isAdmin: AdminResolver
        },
        children: [{
            path: '',
            component: AdminUsersComponent,
            outlet: 'user'
        },
        {
            path: '',
            component: AdminServersComponent,
            outlet: 'server'
        },
        ]
    },


];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
