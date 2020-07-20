import { Component, Input } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

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

  @Input()
  set config(config: ServerListConfig) {
    if (config) {
      this.query = config;
      this.runQuery();
    }
  }

  query: ServerListConfig;
  loading = false;
  results: Server[];
  pageIndex = 0;
  pageSizeOptions : number[] = [5, 10, 15];
  pageSize : number = 5;
  serversCount : number;

  updatePage(pageEvent : PageEvent) {
    this.pageIndex = pageEvent.pageIndex;
    this.pageSize = pageEvent.pageSize;
    this.runQuery();
  }

  prepareQuery() {
    this.loading = true;
    this.results = [];
    // Create limit and offset filter
    this.query.filters.limit = this.pageSize;
    this.query.filters.offset = this.pageSize * this.pageIndex;
  }

  runQuery() {
    this.prepareQuery();
    this.serversService.query(this.query)
      .subscribe(data => {
        this.loading = false;
        this.results = data.servers;
        this.serversCount = data.serversCount;
      });
  }
}
