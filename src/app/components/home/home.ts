import { ApplicationConfig, ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from '../../app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled', // <--- FUNDAMENTAL
        scrollPositionRestoration: 'enabled'
      })
    )
  ]
};
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {


 }
