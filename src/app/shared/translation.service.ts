import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class TranslationService {

    languageChanged = new Subject();
    constructor(private translate: TranslateService) {
        this.translate.setDefaultLang('el');
        this.translate.use('el');
    }

    switchLanguage(language: string) {
        this.translate.use(language)
        .subscribe( () => this.languageChanged.next(language));
    }

    getLanguage() {
        return this.translate.currentLang;
    }

    get(keyword: string):Observable<any> {
        return this.translate.get(keyword);
    }

    get_instant(keyword:string, params?:object):string {
        if (params) {
            return this.translate.instant(keyword, params);
        }
        return this.translate.instant(keyword);
    }

}
