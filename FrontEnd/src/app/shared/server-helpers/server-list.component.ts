import { Component, Input } from '@angular/core';

import { Server, ServerListConfig, ServersService } from '../../core';
@Component({
  selector: 'app-server-list',
  styleUrls: ['server-list.component.scss'],
  templateUrl: './server-list.component.html'
})
export class ServerListComponent {
  constructor(
    private serversService: ServersService
  ) { }

  @Input() limit: number;
  @Input()
  set config(config: ServerListConfig) {
    if (config) {
      this.query = config;
      this.currentPage = 1;
      this.runQuery();
    }
  }

  query: ServerListConfig;
  results: Server[];
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
    this.serversService.query(this.query)
      .subscribe(data => {
        this.loading = false;
        this.results = data.servers;

        // Used from http://www.jstips.co/en/create-range-0...n-easily-using-one-line/
        this.totalPages = Array.from(new Array(Math.ceil(data.serversCount / this.limit)), (val, index) => index + 1);
      });
  }
}
