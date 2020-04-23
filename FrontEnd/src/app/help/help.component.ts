import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']

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
      this.header = 'Help page';
      this.body = 'if you need any help please contact : sebastien.lecleire@etu.univ-paris-diderot.fr or astyax.nourel@etu.univ-paris-diderot.fr or yrg@irif.fr';
    });
  }

}
