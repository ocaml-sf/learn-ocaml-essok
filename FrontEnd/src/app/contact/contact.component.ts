import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']

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
      this.title = 'Contact';
      this.header = 'Contact page';
      this.body = 'If you need any help please contact : sebastien.lecleire@etu.univ-paris-diderot.fr or astyax.nourel@etu.univ-paris-diderot.fr or yrg@irif.fr. We will help you as soon as possible.';
    });
  }

}
