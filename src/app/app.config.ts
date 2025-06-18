import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SupabaseConfigService } from './core/services/supabase/supabase.config';
import { SupabaseAuthService } from './core/services/supabase/supabase-auth.service';
import { SupabaseDbService } from './core/services/supabase/supabase-db.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideMarkdown(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(MatIconModule, MatMenuModule),
    SupabaseConfigService,
    SupabaseAuthService,
    SupabaseDbService
  ]
};
