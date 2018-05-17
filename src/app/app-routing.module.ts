import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppBootStrapComponent } from './app-bootstrap.component';
import { EnvironmentSpecificResolver } from './envSpecific/environment-specific-resolver';
import { EnvironmentSpecificService } from './envSpecific/environment-specific-service';
import { OverviewComponent } from './overview/overview.component';
import { BoundariesComponent } from './boundaries/boundaries.component';
import { ReportComponent } from './report/report.component';
import { IssueTimelineComponent } from './issue-timeline/issue-timeline.component';
import { AllIssuesComponent } from './all-issues/all-issues.component'


const appRoutes: Routes = [
    { path: '', component: AppBootStrapComponent, resolve: { envSpecific: EnvironmentSpecificResolver }, children:[
        { path: 'overview', component: OverviewComponent },
        { path: 'boundaries', component: BoundariesComponent },
        { path: 'report', component: ReportComponent },
        { path: 'issue/:id', component: IssueTimelineComponent},
        { path: 'issues', component: AllIssuesComponent },
        // { path: 'signup', component: SignupComponent},
        // { path: 'login', component: LoginComponent},
        // { path: 'dashboard', component: DashboardComponent, canActivate:[AuthGuardService], children:[
        //     {path: 'home',  canActivate:[RoleGuardService], component: HomeComponent},
        //     {path: 'users', component: UsersComponent, children:[
        //         {path: '', component: ListUsersComponent},
        //         {path: 'add', component: AddUserComponent},
        //         {path: ':name', component: DisplayUserComponent},
        //         {path: ':name/edit', component: EditUserComponent}
        //     ]},
        //     {path: 'departments', component: DepartmentsComponent, children:[
        //         {path: '', component: ListDepartmentsComponent},
        //         {path: 'add', component: AddDepartmentComponent},
        //         {path: ':name', component: DisplayDepartmentComponent},
        //         {path: ':name/edit', component: EditDepartmentComponent}
        //     ]},
        //     {path: 'boundaries', component: BoundariesComponent},
        //     {path: 'policy', component: PolicyComponent},
        //     {path: 'account', component: AccountComponent},
        //     {path: 'issues', component: IssuesComponent, children:[
        //         {path: '', component: ListIssuesComponent},
        //         {path: ':name', component: DisplayIssueComponent}
        //     ]},
        //     {path: 'search_issues', component: SearchIssueComponent},
        //     {path: 'statistics', component: StatisticsComponent},
        //     {path: '**', redirectTo: 'home', pathMatch: 'full'}
        // ]},
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
