import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, User, Profile } from '../core';
import { concatMap, tap } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  isSubmitting: boolean;
  resetPasswordForm: FormGroup;
  authForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder
  ) {

    this.resetPasswordForm = this.fb.group({
      'new_password': ['', [
        Validators.required,
        Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
        Validators.minLength(6),
        Validators.maxLength(25),
      ]],
      'new_password_verification': ['', [
        Validators.required,
        Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
        Validators.minLength(6),
        Validators.maxLength(25),
      ]],
    });

    this.authForm = this.fb.group({
      'email': ['', [Validators.required, Validators.email]],
      'password': ['', [
        Validators.required,
        Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
        Validators.minLength(6),
        Validators.maxLength(25),
      ]],
    });
  }

  profile: Profile;
  user: User;
  isUser: boolean;
  errors: Object = {};


  ngOnInit() {
    // Make a fresh copy of the current user's object to place in editable form fields
    Object.assign(this.user, this.userService.getCurrentUser());
  }

  submitForm() {
    this.isSubmitting = true;
    this.errors = { errors: {} };
    const credentialsLogin = this.authForm.value;
    const credentialsReset = this.resetPasswordForm.value;

    this.userService
      .attemptChangePassword(credentialsReset, credentialsLogin)
      .subscribe(
        updatedUser => this.router.navigateByUrl('/profile/' + updatedUser.username),
        err => {
          this.errors = err;
          this.isSubmitting = false;
        }
      );
  }
}
