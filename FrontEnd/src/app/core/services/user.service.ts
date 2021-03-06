import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';

import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { User, UserListConfig } from '../models';
import { map, distinctUntilChanged } from 'rxjs/operators';


@Injectable()
export class UserService {
  private currentUserSubject = new BehaviorSubject<User>({} as User);
  public currentUser = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();

  private isAdminSubject = new ReplaySubject<boolean>(1);
  public isAdmin = this.isAdminSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private jwtService: JwtService
  ) { }

  // Verify JWT in localstorage with server & load user's info.
  // This runs once on application startup.
  populate() {
    // If JWT detected, attempt to get & store user's info
    if (this.jwtService.getToken()) {
      this.apiService.get('/user')
        .subscribe(
          data => this.setAuth(data.user),
          err => this.purgeAuth()
        );
    } else {
      // Remove any potential remnants of previous auth states
      this.purgeAuth();
    }
  }

  setAuth(user: User) {
    this.jwtService.saveToken(user.token);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.isAdminSubject.next(user.admin);
  }

  purgeAuth() {
    // Remove JWT from localstorage
    this.jwtService.destroyToken();
    // Set current user to an empty object
    this.currentUserSubject.next({} as User);
    // Set auth status to false
    this.isAuthenticatedSubject.next(false);
    // Set admin status to false
    this.isAdminSubject.next(false);
  }

  attemptAuth(type, credentials): Observable<User> {
    const route = (type === 'login') ? '/login' : '';
    return this.apiService.post('/users' + route, { user: credentials })
      .pipe(map(
        data => {
          this.setAuth(data.user);
          return data;
        }
      ));
  }

  attemptChangePassword(credentialsReset, credentialsLogin): Observable<User> {
    return this.apiService.post('/reset-password', { reset: credentialsReset, user: credentialsLogin })
      .pipe(map(
        data => {
          this.currentUserSubject.next(data.user);
          return data.user;
        }
      ));
  }

  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  // Update the user on the server (email, pass, etc)
  update(user, userBase): Observable<User> {
    return this.apiService
      .put('/user', { user: user, userBase: userBase })
      .pipe(map(data => data.user));

  }

  disable(credentialsDisable, credentialsLogin): Observable<User> {
    return this.apiService
      .post(
        '/users/disable',
        { user: credentialsLogin, disable: credentialsDisable }
      )
      .pipe(map(data => {
        this.currentUserSubject.next(data.user);
        return data.user;
      }
      ));
  }

  delete(credentialsDisable, credentialsLogin): Observable<User> {
    return this.apiService
      .post(
        '/users/delete',
        { user: credentialsLogin, disable: credentialsDisable }
      )
      .pipe(map(data => data));
  }

  query(config: UserListConfig): Observable<{ users: User[], usersCount: number }> {
    // Convert any filters over to Angular's URLSearchParams
    const params = {};

    Object.keys(config.filters)
      .forEach((key) => {
        params[key] = config.filters[key];
      });

    return this.apiService
      .get(
        '/users' + (''),
        new HttpParams({ fromObject: params })
      );
  }

  activateAccount(user): Observable<User> {
    return this.apiService
      .post('/user/activate', { user })
      .pipe(map(data => data.user));
  }

  authorizeAccount(user): Observable<User> {
    return this.apiService
      .post('/user/authorize', { user })
      .pipe(map(data => data.user));
  }

}
