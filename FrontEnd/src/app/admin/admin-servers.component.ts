import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ServerListConfig, Profile, FilterService } from '../core';

@Component({
  selector: 'app-admin-servers',
  templateUrl: './admin-servers.component.html'
})
export class AdminServersComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private filterService: FilterService
  ) { }

  serversConfig: ServerListConfig = {
    type: 'all',
    filters: {}
  };

  ngOnInit() {
    this.route.data.subscribe(
      (data: {}) => {
        this.filterService.isActive$.subscribe(
          filterActive => {
            this.serversConfig = {
              type: 'all',
              filters: {
                active: filterActive,
              }
            };
          }
        );
      }
    );
  }

}
