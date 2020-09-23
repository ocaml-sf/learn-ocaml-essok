import { Component, OnInit, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { ActivatedRoute } from '@angular/router';

import { IMGPANELS } from './imgPanel';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
})
export class HelpComponent implements OnInit {
  title: String = '';
  header: String = '';
  body: String = '';

  @ViewChild(MatAccordion) accordion : MatAccordion;

  IMGPANELS = IMGPANELS;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.url.subscribe(_data => {
      this.title = 'Help';
      this.header = 'Help page';
      this.body = 'if you need any help please contact : sebastien.lecleire@etu.univ-paris-diderot.fr or astyax.nourel@etu.univ-paris-diderot.fr or yrg@irif.fr';
    });
  }
}
