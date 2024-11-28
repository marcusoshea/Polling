import { Component } from '@angular/core';
import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { PollingOrder } from './interfaces/polling-order';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';  
import { provideRouter } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    RouterLink,
  ],
  styleUrls: ['./app.component.css']
}) 
export class AppComponent {
  isLoggedIn = false;
  showAdmin = false;
  showModeratorBoard = false;
  email?: string;
  title = 'polling';
  pollingOrder = {} as PollingOrder;
  
  constructor(private storageService: StorageService, private authService: AuthService, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.isLoggedIn = this.storageService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.storageService.getMember();
      this.pollingOrder = this.storageService.getPollingOrder();
      this.showAdmin = user.isOrderAdmin;
    } else {
      if(window.location.pathname.includes('profile') || window.location.pathname.includes('admin')
      || window.location.pathname.includes('candidates') || window.location.pathname.includes('pollings')
      || window.location.pathname.includes('report') ) {
        location.replace('/login');
      }
    }
  }

  logout(): void {
    this.storageService.clean();
    window.location.reload();
  }
}
