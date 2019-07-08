import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ServerListConfig, Profile, UserListConfig } from '../core';

@Component({
    selector: 'app-admin-users',
    templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) { }

    usersConfig: UserListConfig = {
        type: 'all',
        filters: {}
    };

    ngOnInit() {
        this.route.parent.data.subscribe(
            (data: {}) => {
                this.usersConfig = {
                    type: 'all',
                    filters: {
                    }
                };
            }
        );
    }
}
