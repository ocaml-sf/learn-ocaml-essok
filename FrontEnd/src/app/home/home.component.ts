import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ServerListConfig, UserService, User } from '../core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) { }

  currentUser: User;
  isAuthenticated: boolean;
  listConfig: ServerListConfig = {
    type: 'all',
    filters: {
    }
  };
  title: string;
  header: string;
  body: string;

  ngOnInit() {
    this.authStatus();

    if (this.isAuthenticated) {
      this.authTrue();

    } else {
      this.authFalse();
    }
    this.router.navigateByUrl('/');

  }

  authStatus() {
    this.userService.isAuthenticated.subscribe(
      (authenticated) => {
        this.isAuthenticated = authenticated;
      }
    );
  }

  authTrue() {
    this.userService.currentUser.subscribe(
      (userData) => {
        this.currentUser = userData;
        this.listConfig = {
          type: 'all',
          filters: {
            author: this.currentUser.username,
          }
        };
      }
    );
  }

  authFalse() {
    this.route.url.subscribe(data => {
      this.title = 'Home';
      this.header = 'This is the header of the home page';
      this.body = 'This is the body of the home page';
    });
  }

}
