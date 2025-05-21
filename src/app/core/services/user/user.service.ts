import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole, UserStatus } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'users';
  private readonly DEFAULT_PASSWORD = 'newstalgia123';
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    const storedUsers = localStorage.getItem(this.STORAGE_KEY);
    if (storedUsers) {
      this.usersSubject.next(JSON.parse(storedUsers));
    }
  }

  public saveUsers(users: User[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    this.usersSubject.next(users);
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

  authenticateUser(email: string, password: string): User | undefined {
    const user = this.getUserByEmail(email);
    if (!user) return undefined;

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('User account is not active');
    }

    // Check password
    if (user.password !== password) {
      throw new Error('Invalid password');
    }

    // Update last login
    const updatedUser = {
      ...user,
      lastLogin: new Date()
    };

    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      currentUsers[userIndex] = updatedUser;
      this.saveUsers(currentUsers);
    }

    return updatedUser;
  }

  inviteUser(email: string, role: UserRole, assignedProjectId?: string): User {
    // Check if user already exists
    if (this.getUserByEmail(email)) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      status: UserStatus.ACTIVE, // Set to ACTIVE immediately
      createdAt: new Date(),
      lastLogin: null,
      password: this.DEFAULT_PASSWORD,
      ...(assignedProjectId ? { assignedProjectId } : {})
    };

    const currentUsers = this.usersSubject.value;
    this.saveUsers([...currentUsers, newUser]);
    return newUser;
  }

  updateUserRole(userId: string, newRole: UserRole): User | undefined {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return undefined;

    const updatedUser: User = {
      ...currentUsers[userIndex],
      role: newRole
    };

    currentUsers[userIndex] = updatedUser;
    this.saveUsers(currentUsers);
    return updatedUser;
  }

  deactivateUser(userId: string): User | undefined {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return undefined;

    const updatedUser: User = {
      ...currentUsers[userIndex],
      status: UserStatus.INACTIVE
    };

    currentUsers[userIndex] = updatedUser;
    this.saveUsers(currentUsers);
    return updatedUser;
  }

  activateUser(userId: string): User | undefined {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return undefined;

    const updatedUser: User = {
      ...currentUsers[userIndex],
      status: UserStatus.ACTIVE
    };

    currentUsers[userIndex] = updatedUser;
    this.saveUsers(currentUsers);
    return updatedUser;
  }

  getUserActivity(userId: string): any[] {
    // TODO: Implement user activity tracking
    return [];
  }

  deleteUser(userId: string): User | undefined {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    const [deletedUser] = currentUsers.splice(userIndex, 1);
    this.saveUsers(currentUsers);
    return deletedUser;
  }
} 