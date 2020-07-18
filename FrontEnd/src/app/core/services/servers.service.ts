import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { Server, ServerListConfig } from '../models';
import { map } from 'rxjs/operators';

@Injectable()
export class ServersService {

  constructor(
    private apiService: ApiService
  ) { }

  query(config: ServerListConfig): Observable<{ servers: Server[], serversCount: number }> {
    // Convert any filters over to Angular's URLSearchParams
    const params = {};

    Object.keys(config.filters)
      .forEach((key) => {
        params[key] = config.filters[key];
      });

    return this.apiService
      .get(
        '/servers' + (''),
        new HttpParams({ fromObject: params })
      );
  }

  get(slug): Observable<Server> {
    return this.apiService.get('/servers/' + slug)
      .pipe(map(data => data.server));
  }

  destroy(slug) {
    return this.apiService.delete('/servers/' + slug)
      .pipe(map(data => data));
  }

  disable(slug) {
    return this.apiService.post('/servers/disable/' + slug)
      .pipe(map(data => data));
  }

  save(server): Observable<Server> {
    // If we're updating an existing server
    if (server.slug) {
      return this.apiService.put('/servers/' + server.slug, { server: server })
        .pipe(map(data => data.server));

      // Otherwise, create a new server
    } else {
      return this.apiService.post('/servers/', { server: server })
        .pipe(map(data => data.server));
    }
  }

  uploadFromUrl(slug, url) {
    return this.apiService.post('/uploads/url', { server: slug, url })
      .pipe(map(data => data));
  }

  send(slug, useless, list) {
    return this.apiService.post('/uploads/send', { server: slug, useless, list })
      .pipe(map(data => data));
  }

  getGroups(slug) {
    return this.apiService.post('/uploads/index', { server: slug })
      .pipe(map(data => data));
  }

  getToken(slug) {
    return this.apiService.post('/servers/token/' + slug, { server: slug })
      .pipe(map(data => data.server));
  }
  deleteExercises(slug, trash) {
    return this.apiService.post('/uploads/delete', { server: slug, trash })
      .pipe(map(data => data));
  }
}
