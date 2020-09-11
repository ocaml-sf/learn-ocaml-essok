import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AdminResolver } from './admin-resolver.service';
import { AdminServersComponent } from './admin-servers.component';
import { AdminUsersComponent } from './admin-users.component';

@NgModule({
    imports: [
        SharedModule,
        AdminRoutingModule,

    ],
    declarations: [
        AdminComponent,
        AdminServersComponent,
        AdminUsersComponent
    ],
    providers: [
        AdminResolver
    ]

})
export class AdminModule { }
