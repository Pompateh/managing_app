import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseConfigService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.publicKey
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
} 