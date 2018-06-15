import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppBootStrapComponent } from './app-bootstrap.component';
import { EnvironmentSpecificResolver } from './envSpecific/environment-specific-resolver';
import { EnvironmentSpecificService } from './envSpecific/environment-specific-service';
import { OverviewComponent } from './overview/overview.component';
import { BoundariesComponent } from './boundaries/boundaries.component';
import { ReportComponent } from './report/report.component';
import { IssueTimelineComponent } from './issue-timeline/issue-timeline.component';
import { AllIssuesComponent } from './all-issues/all-issues.component';
import { SearchIssuesComponent } from  './search-issues/search-issues.component';


const appRoutes: Routes = [
    { path: '', component: AppBootStrapComponent, resolve: { envSpecific: EnvironmentSpecificResolver }, children:[
        { path: 'overview', component: OverviewComponent },
        { path: 'boundaries', component: BoundariesComponent },
        { path: 'report', component: ReportComponent },
        { path: 'issue/:id', component: IssueTimelineComponent},
        { path: 'issues', component: AllIssuesComponent },
        { path: 'search', component: SearchIssuesComponent },
        { path: '**', redirectTo: 'overview', pathMatch: 'full'}
    ]}
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule],
    providers: [EnvironmentSpecificResolver, EnvironmentSpecificService]
})
export class AppRoutingModule {
}
