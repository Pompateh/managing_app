-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (no foreign key dependencies)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER', 'VIEWER')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create projects table (depends on users)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    completion_percentage INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    team_members UUID[] DEFAULT '{}',
    tasks JSONB DEFAULT '[]',
    phases JSONB DEFAULT '{}'
);

-- Add foreign key to users table after projects table exists
ALTER TABLE users
ADD COLUMN assigned_project_id UUID REFERENCES projects(id);

-- Create boards table (depends on projects and users)
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    connections JSONB DEFAULT '[]',
    elements JSONB DEFAULT '[]',
    groups JSONB DEFAULT '[]',
    zoom_scale NUMERIC DEFAULT 1,
    favorite BOOLEAN DEFAULT false,
    tag TEXT,
    accepted BOOLEAN DEFAULT false,
    accepted_by UUID REFERENCES users(id)
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update all users"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'ADMIN'
        )
    );

-- Projects policies
CREATE POLICY "Users can view their assigned projects"
    ON projects FOR SELECT
    USING (
        auth.uid() = ANY(team_members)
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Users can update their assigned projects"
    ON projects FOR UPDATE
    USING (
        auth.uid() = ANY(team_members)
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND status = 'ACTIVE'
        )
    );

-- Boards policies
CREATE POLICY "Users can view project boards"
    ON boards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id
            AND (
                auth.uid() = ANY(team_members)
                OR created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid()
                    AND role = 'ADMIN'
                )
            )
        )
    );

CREATE POLICY "Users can update project boards"
    ON boards FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id
            AND (
                auth.uid() = ANY(team_members)
                OR created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid()
                    AND role = 'ADMIN'
                )
            )
        )
    );

CREATE POLICY "Users can create project boards"
    ON boards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_id
            AND (
                auth.uid() = ANY(team_members)
                OR created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users
                    WHERE id = auth.uid()
                    AND role = 'ADMIN'
                )
            )
        )
    );

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_team_members ON projects USING GIN(team_members);
CREATE INDEX idx_boards_project_id ON boards(project_id); 