import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';

// Import the Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1Qf2T8fa6XVRXyI6lnYTw-8flIMOxbII",
  authDomain: "newstalgia-f019d.firebaseapp.com",
  projectId: "newstalgia-f019d",
  storageBucket: "newstalgia-f019d.firebasestorage.app",
  messagingSenderId: "512552991212",
  appId: "1:512552991212:web:70ade11a8e14b59f89a8c9",
  measurementId: "G-6S3CNVNNTF"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideMarkdown(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom(
      provideFirebaseApp(() => initializeApp(firebaseConfig)),
      provideFirestore(() => getFirestore()),
      provideAuth(() => getAuth())
    )
  ]
};
