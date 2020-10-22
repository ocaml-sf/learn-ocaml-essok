import { Component, Input, OnInit } from '@angular/core';
import { ImgPanel } from '../imgPanel';

@Component({
  selector: 'app-expansion-img-panels',
  templateUrl: './expansion-img-panels.component.html',
})
export class ExpansionImgPanelsComponent implements OnInit {

  constructor() {}

  @Input() imgPanels : ImgPanel[];

  ngOnInit() {
    this.imgPanels =
      this.imgPanels.map(imgPanel => {
        return {...imgPanel, openState : false};
      });
  }
}
