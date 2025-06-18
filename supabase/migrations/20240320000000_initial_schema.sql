-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    assigned_project_id UUID REFERENCES projects(id)
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    completion_percentage INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES users(id),
    team_members UUID[] DEFAULT '{}',
    tasks JSONB DEFAULT '[]',
    phases JSONB DEFAULT '{}'
);

-- Create boards table
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    connections JSONB DEFAULT '[]',
    elements JSONB DEFAULT '[]',
    groups JSONB DEFAULT '[]',
    zoom_scale NUMERIC DEFAULT 1,
    tag TEXT,
    favorite BOOLEAN DEFAULT false,
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

-- Projects policies
CREATE POLICY "Users can view projects they are members of"
    ON projects FOR SELECT
    USING (
        auth.uid() = created_by OR
        auth.uid() = ANY(team_members)
    );

CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update projects they are members of"
    ON projects FOR UPDATE
    USING (
        auth.uid() = created_by OR
        auth.uid() = ANY(team_members)
    );

-- Boards policies
CREATE POLICY "Users can view boards of their projects"
    ON boards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = boards.project_id
            AND (
                projects.created_by = auth.uid() OR
                auth.uid() = ANY(projects.team_members)
            )
        )
    );

CREATE POLICY "Users can create boards for their projects"
    ON boards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = boards.project_id
            AND (
                projects.created_by = auth.uid() OR
                auth.uid() = ANY(projects.team_members)
            )
        )
    );

CREATE POLICY "Users can update boards of their projects"
    ON boards FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = boards.project_id
            AND (
                projects.created_by = auth.uid() OR
                auth.uid() = ANY(projects.team_members)
            )
        )
    );

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_team_members ON projects USING GIN(team_members);
CREATE INDEX idx_boards_project_id ON boards(project_id);
CREATE INDEX idx_boards_accepted_by ON boards(accepted_by); 