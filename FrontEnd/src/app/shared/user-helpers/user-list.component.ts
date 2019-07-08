import { Component, Input } from '@angular/core';

import { User, UserListConfig, UserService } from '../../core';
@Component({
  selector: 'app-user-list',
  styleUrls: ['user-list.component.css'],
  templateUrl: './user-list.component.html'
})
export class UserListComponent {
  constructor(
    private usersService: UserService
  ) { }

  @Input() limit: number;
  @Input()
  set config(config: UserListConfig) {
    if (config) {
      this.query = config;
      this.currentPage = 1;
      this.runQuery();
    }
  }

  query: UserListConfig;
  results: User[];
  loading = false;
  currentPage = 1;
  totalPages: Array<number> = [1];

  setPageTo(pageNumber) {
    this.currentPage = pageNumber;
    this.runQuery();
  }

  prepareQuery() {
    this.loading = true;
    this.results = [];
    // Create limit and offset filter (if necessary)
    if (this.limit) {
      this.query.filters.limit = this.limit;
      this.query.filters.offset = (this.limit * (this.currentPage - 1));
    }
  }

  runQuery() {
    this.prepareQuery();
    this.usersService.query(this.query)
      .subscribe(data => {
        this.loading = false;
        this.results = data.users;

        // Used from http://www.jstips.co/en/create-range-0...n-easily-using-one-line/
        this.totalPages = Array.from(new Array(Math.ceil(data.usersCount / this.limit)), (val, index) => index + 1);
      });
  }
}
