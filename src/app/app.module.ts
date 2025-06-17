import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

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

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    HttpClientModule,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { } 