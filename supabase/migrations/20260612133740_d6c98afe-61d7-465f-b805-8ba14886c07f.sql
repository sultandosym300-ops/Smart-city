GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_service_id(UUID) TO authenticated, anon;

ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'approved' AFTER 'new';

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS department_text TEXT;

DROP POLICY IF EXISTS "Workers can self-register" ON public.user_roles;
CREATE POLICY "Workers can self-register"
  ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'worker');