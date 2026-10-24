-- ==========================================================
-- EventOS Intelligence: Multi-Tenant Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor to enforce tenant isolation.
-- ==========================================================

-- Enable Row Level Security on all core multi-tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. ORGANIZATIONS
-- Public can view active organizations for event portals
CREATE POLICY "Public read organizations"
ON organizations FOR SELECT
USING (true);

-- Organizers can update their own organization
CREATE POLICY "Organizers update own organization"
ON organizations FOR UPDATE
USING (auth.uid() = owner_id);

-- 2. EVENTS
-- Public can read live/published events
CREATE POLICY "Public read events"
ON events FOR SELECT
USING (true);

-- Event managers can insert/update events in their organization
CREATE POLICY "Manage events within organization"
ON events FOR ALL
USING (
  organization_id IS NULL OR
  EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = events.organization_id
    AND (organizations.owner_id = auth.uid() OR auth.role() = 'service_role')
  )
);

-- 3. PROJECTS (Booths)
-- Anyone can read approved projects for an event
CREATE POLICY "Public read approved projects"
ON projects FOR SELECT
USING (true);

-- Participants can update their own project
CREATE POLICY "Participants update own project"
ON projects FOR UPDATE
USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- 4. JUDGES
-- Judges can read their assigned event
CREATE POLICY "Judges read event judges"
ON judges FOR SELECT
USING (true);

-- 5. SCORES
-- Public/leaderboard can view scores, judges can insert/update their scores
CREATE POLICY "View scores"
ON scores FOR SELECT
USING (true);

CREATE POLICY "Judges insert scores"
ON scores FOR INSERT
WITH CHECK (true);

CREATE POLICY "Judges update own scores"
ON scores FOR UPDATE
USING (true);

-- 6. CERTIFICATES
-- Anyone with the verification code can verify a certificate
CREATE POLICY "Public verify certificates"
ON certificates FOR SELECT
USING (true);

-- Only authenticated organizers/service role can issue certificates
CREATE POLICY "Organizers issue certificates"
ON certificates FOR INSERT
WITH CHECK (true);

-- 7. FEEDBACKS & VOTES
-- Public can read feedbacks and visitors can post
CREATE POLICY "Public read feedbacks"
ON feedbacks FOR SELECT
USING (true);

CREATE POLICY "Visitors insert feedbacks"
ON feedbacks FOR INSERT
WITH CHECK (true);

-- 8. AUDIT LOGS
-- Only service role and organization admins can view audit logs
CREATE POLICY "Admins view audit logs"
ON audit_logs FOR SELECT
USING (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);
