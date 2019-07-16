import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ServerListConfig, Profile, UserListConfig, FilterService } from '../core';

@Component({
    selector: 'app-admin-users',
    templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private filterService: FilterService
    ) { }

    usersConfig: UserListConfig = {
        type: 'all',
        filters: {}
    };

    ngOnInit() {
        this.route.data.subscribe(
            (data: {}) => {
                this.filterService.isActive$.subscribe(
                    filterActive => {
                        this.usersConfig = {
                            type: 'all',
                            filters: {
                                active: filterActive,
                            }
                        };
                    }
                );
                this.filterService.isAuthorized$.subscribe(
                    filterAuthorized => {
                        this.usersConfig = {
                            type: 'all',
                            filters: {
                                authorized: filterAuthorized
                            }
                        };
                    }
                );
            }
        );
    }
}
