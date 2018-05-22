import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule} from '@angular/forms';


import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressHttpModule } from '@ngx-progressbar/http';

import { ToastrModule } from 'ngx-toastr';
import { TranslateModule, TranslateLoader} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEl from '@angular/common/locales/el';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@asymmetrik/ngx-leaflet-markercluster';
import { NguCarouselModule } from '@ngu/carousel';
import { LightboxModule } from 'angular2-lightbox'



import { TranslationService } from './shared/translation.service';
import { IssuesService } from './shared/issues.service';


import {MatButtonModule,
        MatToolbarModule,
        MatSidenavModule,
        MatMenuModule,
        MatStepperModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatDatepickerModule} from '@angular/material';

import { MatMomentDateModule } from '@angular/material-moment-adapter'
import {MAT_MOMENT_DATE_FORMATS, MomentDateAdapter} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';


import { AppComponent } from './app.component';
import { AppBootStrapComponent } from './app-bootstrap.component';
import { AppRoutingModule } from './app-routing.module';
import { OverviewComponent } from './overview/overview.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { BoundariesComponent } from './boundaries/boundaries.component';
import { ReportComponent } from './report/report.component';
import { IssueTimelineComponent } from './issue-timeline/issue-timeline.component';
import { AllIssuesComponent } from './all-issues/all-issues.component';
import { SearchIssuesComponent } from './search-issues/search-issues.component';

export function HttpLoaderFactory(httpclient:HttpClient) {
    return new TranslateHttpLoader(httpclient, './assets/i18n/', '.json');
}
registerLocaleData(localeEl);

@NgModule({
    declarations: [
        AppComponent,
        AppBootStrapComponent,
        OverviewComponent,
        HeaderComponent,
        FooterComponent,
        BoundariesComponent,
        ReportComponent,
        IssueTimelineComponent,
        AllIssuesComponent,
        SearchIssuesComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatToolbarModule,
        MatSidenavModule,
        MatMenuModule,
        MatStepperModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatDatepickerModule,
        NgProgressModule.forRoot(),
        NgProgressHttpModule,
        CommonModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({timeOut:8000, progressBar:true, enableHtml:true, preventDuplicates: true}),
        TranslateModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        LeafletModule,
        LeafletMarkerClusterModule,
        NguCarouselModule,
        LightboxModule
    ],
    providers: [
        TranslationService,
        {provide: LOCALE_ID, deps:[TranslationService], useFactory: (TranslationService) => TranslationService.getLanguage()},
        {provide: MAT_DATE_LOCALE, useValue: 'el-EL'},
        {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
        {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
        IssuesService,

    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
