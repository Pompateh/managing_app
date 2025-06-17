import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole, UserStatus } from '../../models/user.model';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.loadUsers();
  }

  private async loadUsers() {
    try {
      const users = await this.supabaseService.getUsers();
      this.usersSubject.next(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      return await this.supabaseService.getUser(userId);
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async createUser(user: Partial<User>): Promise<User> {
    try {
      const newUser = await this.supabaseService.createUser(user);
      await this.loadUsers(); // Reload users to update the list
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const updatedUser = await this.supabaseService.updateUser(userId, updates);
      await this.loadUsers(); // Reload users to update the list
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.supabaseService.deleteUser(userId);
      await this.loadUsers(); // Reload users to update the list
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async authenticateUser(email: string, password: string): Promise<User> {
    try {
      const { user } = await this.supabaseService.signIn(email, password);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      const userData = await this.getUser(user.id);
      if (!userData) {
        throw new Error('User data not found');
      }
      return userData;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  getUsers(): Observable<User[]> {
    return this.users$;
  }

  getUserById(id: string): User | undefined {
    return this.usersSubject.value.find(user => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.usersSubject.value.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  inviteUser(email: string, role: UserRole, assignedProjectId?: string): User {
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split('@')[0],
      role,
      status: UserStatus.PENDING,
      createdAt: new Date(),
      lastLogin: null,
      password: 'newstalgia123',
      ...(assignedProjectId ? { assignedProjectId } : {})
    };

    const currentUsers = this.usersSubject.value;
    this.usersSubject.next([...currentUsers, newUser]);
    return newUser;
  }

  updateUserRole(userId: string, newRole: UserRole): User {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const updatedUser: User = {
      ...currentUsers[userIndex],
      role: newRole
    };

    const newUsers = currentUsers.map((user, index) =>
      index === userIndex ? updatedUser : user
    );
    this.usersSubject.next(newUsers);
    return updatedUser;
  }

  deactivateUser(userId: string): User {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const updatedUser: User = {
      ...currentUsers[userIndex],
      status: UserStatus.INACTIVE
    };

    const newUsers = currentUsers.map((user, index) =>
      index === userIndex ? updatedUser : user
    );
    this.usersSubject.next(newUsers);
    return updatedUser;
  }

  activateUser(userId: string): User {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const updatedUser: User = {
      ...currentUsers[userIndex],
      status: UserStatus.ACTIVE
    };

    const newUsers = currentUsers.map((user, index) =>
      index === userIndex ? updatedUser : user
    );
    this.usersSubject.next(newUsers);
    return updatedUser;
  }

  getUserActivity(userId: string): any[] {
    // TODO: Implement user activity tracking
    return [];
  }

  getUsersByProject(projectId: string): User[] {
    return this.usersSubject.value.filter(user => user.assignedProjectId === projectId);
  }
} 