import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']

})
export class HelpComponent implements OnInit {
  title: String = '';
  header: String = '';
  body: String = '';

  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.route.url.subscribe(data => {
      this.title = 'Help';
      this.header = 'This is the header of the contact page';
      this.body = 'This is the body of the contact page';
    });
  }

}
