import { Component, Input } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { User, UserListConfig, UserService } from '../../core';
@Component({
  selector: 'app-user-list',
  styleUrls: ['user-list.component.scss'],
  templateUrl: './user-list.component.html'
})
export class UserListComponent {
  constructor(
    private usersService: UserService
  ) { }

  @Input()
  set config(config: UserListConfig) {
    if (config) {
      this.query = config;
      this.runQuery();
    }
  }

  query: UserListConfig;
  loading = false;
  results: User[];
  // Paginator start at page 0
  pageIndex = 0;
  pageSizeOptions : number[] = [5, 10, 15];
  pageSize : number = 5;
  usersCount : number;

  updatePage(pageEvent : PageEvent) {
    this.pageIndex = pageEvent.pageIndex;
    this.pageSize = pageEvent.pageSize;
    this.runQuery();
  }

  prepareQuery() {
    this.loading = true;
    this.results = [];
    this.query.filters.limit = this.pageSize;
    this.query.filters.offset = this.pageSize * this.pageIndex;
  }

  runQuery() {
    this.prepareQuery();
    this.usersService.query(this.query)
      .subscribe(data => {
        this.loading = false;
        this.results = data.users;
        this.usersCount = data.usersCount;
      });
  }
}
