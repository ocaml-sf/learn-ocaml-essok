import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpansionImgPanelsComponent } from './expansion-img-panels.component';

describe('ExpansionImgPanelsComponent', () => {
  let component: ExpansionImgPanelsComponent;
  let fixture: ComponentFixture<ExpansionImgPanelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpansionImgPanelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansionImgPanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
