import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
})
export class ContactComponent implements OnInit {
  title: String = '';
  header: String = '';
  body: String = '';

  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.route.url.subscribe(data => {
      this.title = 'Contacts';
      this.header = 'Contact page';
      this.body = '';
    });
  }

}
