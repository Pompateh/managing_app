export interface Project {
  id: string;
  name: string;
  description?: string;
  deadline: Date;
  completionPercentage: number;
  status: ProjectStatus;
  createdAt: Date;
  createdBy: string; // admin's email
  teamMembers: string[]; // array of team member emails
  tasks?: ProjectTask[];
  phases: { [key: string]: PhaseContent };
}

export interface ProjectTask {
  id: string;
  name: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date;
}

export interface PhaseContent {
  name: string;
  completed: boolean;
  content?: string;
  lastModified?: Date;
  description?: string;
  attachments?: string[];
  comments?: PhaseComment[];
  subPhases?: { [key: string]: PhaseContent };
  boardId?: string; // Reference to associated board for phases that need it
}

export interface PhaseComment {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  lastModified?: Date;
}

export enum ProjectStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED'
} 