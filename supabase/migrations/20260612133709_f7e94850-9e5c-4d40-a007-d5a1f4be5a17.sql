CREATE TYPE public.app_role AS ENUM ('citizen', 'worker', 'admin');
CREATE TYPE public.report_status AS ENUM ('new', 'in_progress', 'awaiting_confirmation', 'completed', 'returned');
CREATE TYPE public.report_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.report_category AS ENUM ('roads', 'water', 'electricity', 'sanitation', 'transport', 'emergency', 'other');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.report_category NOT NULL UNIQUE,
  name_ru TEXT NOT NULL,
  name_kk TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are public" ON public.services FOR SELECT USING (true);

INSERT INTO public.services (code, name_ru, name_kk) VALUES
  ('roads',       'Дорожная служба',         'Жол қызметі'),
  ('water',       'Водоканал',               'Сумен жабдықтау'),
  ('electricity', 'Электросети',             'Электр желілері'),
  ('sanitation',  'Санитарная служба',       'Санитарлық қызмет'),
  ('transport',   'Общественный транспорт',  'Қоғамдық көлік'),
  ('emergency',   'Экстренные службы',       'Жедел қызметтер'),
  ('other',       'Прочие обращения',        'Басқа өтініштер');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, service_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.user_service_id(_user_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT service_id FROM public.user_roles WHERE user_id = _user_id AND role = 'worker' LIMIT 1
$$;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_name TEXT,
  anon_phone TEXT,
  description TEXT NOT NULL,
  photo_url TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  district TEXT,
  status public.report_status NOT NULL DEFAULT 'new',
  category public.report_category,
  priority public.report_priority,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  taken_at TIMESTAMPTZ,
  awaiting_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_photo_url TEXT,
  completion_comment TEXT
);
CREATE INDEX reports_status_idx ON public.reports(status);
CREATE INDEX reports_service_idx ON public.reports(service_id);
CREATE INDEX reports_priority_idx ON public.reports(priority);
CREATE INDEX reports_created_by_idx ON public.reports(created_by);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT SELECT, INSERT ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reports are publicly visible" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Anyone can submit reports" ON public.reports
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND created_by IS NULL)
    OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
  );
CREATE POLICY "Workers update service reports" ON public.reports
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'worker') AND service_id = public.user_service_id(auth.uid()))
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'worker') AND service_id = public.user_service_id(auth.uid()))
  );

CREATE TABLE public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  category public.report_category,
  priority public.report_priority,
  service_code public.report_category,
  reason TEXT,
  solution TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_analysis_report_idx ON public.ai_analysis(report_id);
GRANT SELECT, INSERT ON public.ai_analysis TO anon, authenticated;
GRANT ALL ON public.ai_analysis TO service_role;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI analysis is public" ON public.ai_analysis FOR SELECT USING (true);
CREATE POLICY "Anyone can insert AI analysis" ON public.ai_analysis FOR INSERT WITH CHECK (true);

CREATE TABLE public.report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  from_status public.report_status,
  to_status public.report_status,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX report_history_report_idx ON public.report_history(report_id);
GRANT SELECT ON public.report_history TO anon, authenticated;
GRANT INSERT ON public.report_history TO authenticated;
GRANT ALL ON public.report_history TO service_role;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "History is public" ON public.report_history FOR SELECT USING (true);
CREATE POLICY "Authenticated can write history" ON public.report_history
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_service_id(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.user_service_id(UUID) TO service_role;

CREATE POLICY "Anyone can upload report photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports');
CREATE POLICY "Anyone can read report photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports');
CREATE POLICY "Workers and admins can update report photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'reports');