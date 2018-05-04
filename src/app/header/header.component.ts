import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { TranslationService } from '../shared/translation.service';
import { MatMenuTrigger } from '@angular/material/menu';


@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    encapsulation: ViewEncapsulation.Emulated
})
export class HeaderComponent implements OnInit {

    constructor(private translationService: TranslationService) { }

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    onLangMenuTrigger() {
      this.trigger.openMenu();
    }

    currentLang:string = this.translationService.getLanguage();
    langToEl() {
        this.translationService.switchLanguage("el");
        this.currentLang = 'el';

    }

    langToEn() {
        this.translationService.switchLanguage("en");
        this.currentLang = 'en';
    }

    ngOnInit() {
    }

}
