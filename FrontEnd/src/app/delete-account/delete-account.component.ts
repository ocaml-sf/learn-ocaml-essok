import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, Profile, User } from '../core';

@Component({
  selector: 'app-delete-account',
  templateUrl: './delete-account.component.html',
  styleUrls: ['./delete-account.component.css']
})
export class DeleteAccountComponent implements OnInit {

  isSubmitting: boolean;
  deleteAccountForm: FormGroup;
  authForm: FormGroup;
  isChecked = false;
  isAssuming = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder
  ) {

    this.deleteAccountForm = this.fb.group({
      'username_verification': ['', [Validators.required]],
      'password_verification': ['', [
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
    this.userService.currentUser.subscribe(
      (userData: User) => {
        this.user = userData;
      }
    );
    this.router.navigateByUrl('/delete-account');

  }

  preForm() {
    this.isSubmitting = true;
    this.errors = { errors: {} };
  }

  submitForm() {
    if (this.isAssuming && this.isChecked) {
      this.preForm();
      this.userService
        .delete(this.deleteAccountForm.value, this.authForm.value)
        .subscribe(
          succes => {
            this.userService.purgeAuth();
            this.router.navigateByUrl('');
          },
          err => {
            this.errors = err;
            this.isSubmitting = false;
          }
        );
    }
  }

  assumeDelete() {
    this.isAssuming = !this.isAssuming;
  }

  understandDelete() {
    this.isChecked = !this.isChecked;
  }
}
