-- ============================================================
-- UniGateEU — Complete Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- https://supabase.com/dashboard/project/dbpslhovztmfwyoxrjee/sql
-- ============================================================

-- ── USERS ────────────────────────────────────────────────────
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  credits      integer not null default 10,
  role         text not null default 'user' check (role in ('user', 'admin')),
  onboarding_completed boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ── PROFILES ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  nationality           text,
  degree_level          text,
  field_of_study        text,
  gpa                   numeric(4,2),
  language_score        text,
  language_score_value  numeric(5,2),
  target_countries      text[] default '{}',
  budget_range          text,
  start_date            text,
  work_experience       integer default 0,
  research_experience   boolean default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(user_id)
);

alter table public.profiles enable row level security;

create policy "Users can manage own profile"
  on public.profiles for all
  using (auth.uid() = user_id);

-- ── UNIVERSITIES ──────────────────────────────────────────────
create table if not exists public.universities (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  country             text not null,
  city                text not null,
  ranking             integer,
  tuition_min         integer default 0,
  tuition_max         integer,
  tuition_currency    text default 'EUR',
  acceptance_rate     numeric(5,2),
  programs            text[] default '{}',
  language_requirements jsonb default '{}',
  deadline_fall       text,
  deadline_spring     text,
  website             text,
  description         text,
  logo_url            text,
  created_at          timestamptz not null default now()
);

alter table public.universities enable row level security;

create policy "Universities are publicly readable"
  on public.universities for select
  using (true);

create policy "Only admins can modify universities"
  on public.universities for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ── APPLICATIONS ─────────────────────────────────────────────
create table if not exists public.applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  university_id  uuid references public.universities(id) on delete set null,
  program        text not null,
  status         text not null default 'researching'
                   check (status in ('researching','preparing','submitted','accepted','rejected','waitlisted')),
  deadline       date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.applications enable row level security;

create policy "Users can manage own applications"
  on public.applications for all
  using (auth.uid() = user_id);

-- ── DOCUMENTS ────────────────────────────────────────────────
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  name         text not null,
  type         text not null default 'other'
                 check (type in ('transcript','recommendation','sop','cv','language_test','other')),
  file_url     text,
  file_size    integer,
  ai_analysis  text,
  status       text not null default 'pending'
                 check (status in ('pending','analyzing','analyzed','approved')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can manage own documents"
  on public.documents for all
  using (auth.uid() = user_id);

-- ── SCHOLARSHIPS ──────────────────────────────────────────────
create table if not exists public.scholarships (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  provider     text not null,
  country      text not null,
  amount       integer,
  currency     text default 'EUR',
  deadline     text,
  eligibility  text[] default '{}',
  fields       text[] default '{}',
  link         text,
  description  text,
  created_at   timestamptz not null default now()
);

alter table public.scholarships enable row level security;

create policy "Scholarships are publicly readable"
  on public.scholarships for select
  using (true);

create policy "Only admins can modify scholarships"
  on public.scholarships for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ── CREDIT TRANSACTIONS ───────────────────────────────────────
create table if not exists public.credit_transactions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  amount             integer not null,
  type               text not null check (type in ('purchase','usage','refund','bonus')),
  feature            text,
  description        text not null,
  stripe_payment_id  text,
  created_at         timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.credit_transactions for insert
  with check (auth.uid() = user_id);

-- ── NEW USER TRIGGER ──────────────────────────────────────────
-- Automatically creates a public.users row with 10 free credits
-- whenever someone signs up via Supabase Auth

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url, credits, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    10,
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── STORAGE BUCKET ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Documents are publicly readable"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── ADMIN HELPER ──────────────────────────────────────────────
-- Run this separately to grant yourself admin access:
-- update public.users set role = 'admin' where email = 'your@email.com';

-- ── BLOG POSTS ────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  slug       text unique not null,
  excerpt    text,
  content    text not null,
  category   text default 'General',
  author     text default 'UniGateEU Team',
  published  boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blog_posts enable row level security;

create policy "Anyone can read published posts"
  on public.blog_posts for select
  using (published = true);

create policy "Service role full access"
  on public.blog_posts for all
  using (true);

-- ── BLOG SEED DATA ────────────────────────────────────────────
-- Run this AFTER creating the table above

insert into public.blog_posts (title, slug, excerpt, content, category, author, published) values

(
  'Top 10 Affordable Universities in Germany for International Students',
  'top-10-affordable-universities-germany-international-students',
  'Germany offers world-class education at near-zero tuition cost. Here are the top 10 universities where international students can study for free or almost free.',
  '**Why Germany?**

Germany has become the most popular destination in Europe for international students — and for good reason. Most public German universities charge no tuition fees for international students, only a semester contribution (Semesterbeitrag) of €150–400 that typically includes public transport. The result: a world-class degree for a fraction of what you would pay almost anywhere else.

**1. TU Munich (Technical University of Munich)**

Consistently ranked Germany''s number-one university for engineering and technology, TU Munich offers free education for most international students. Only some postgraduate professional programs charge fees. With strong partnerships with Google, Airbus, and BMW — and a Silicon Valley-style startup ecosystem — career outcomes here are among the best in Europe. Semester fee: approximately €145.

**2. Ludwig Maximilian University (LMU Munich)**

LMU Munich ranks in the top 10 in Europe and offers no tuition fees for international students, only a €150 semester contribution. The university excels in medicine, law, psychology, and natural sciences. Munich is more expensive to live in than other German cities, but LMU''s robust scholarship infrastructure and student support system make it manageable.

**3. Heidelberg University**

Germany''s oldest university (founded 1386) is internationally recognized for excellence in medicine, life sciences, and humanities. No tuition fees for standard programs. The city of Heidelberg is picturesque, walkable, and more affordable than Munich or Frankfurt — making it one of the most attractive student environments in Germany.

**4. RWTH Aachen University**

Europe''s most respected technical university for engineering. RWTH Aachen has produced Nobel laureates and CEOs of Fortune 500 companies. Its partnerships with Ford, Philips, and Ericsson give students extraordinary access to industry placements and graduate employment. Semester fee: approximately €280.

**5. Freie Universität Berlin**

Known for strong social sciences, humanities, and political science programs, Freie Universität is an Excellence Initiative university. No tuition fees, around €310 semester contribution. Berlin''s relatively low cost of living — €800–1,100 per month — makes this one of the most accessible options in Germany for international students.

**6. University of Hamburg**

Located in Germany''s second-largest city and a major economic hub, the University of Hamburg charges no tuition fees for international students. It is particularly strong in law, business, natural sciences, and Islamic studies. Hamburg''s port economy creates rich networking opportunities for students in business, engineering, and logistics.

**7. TU Berlin (Technische Universität Berlin)**

Located in the heart of the capital, TU Berlin offers world-class programs in engineering, computer science, and business. With no tuition fees (only a €307 semester contribution), a ranking among the top 200 globally, and access to Berlin''s booming tech and startup scene, TU Berlin is a top choice for international STEM students.

**8. University of Bonn**

One of Germany''s most reputable research universities with strong programs in economics, natural sciences, and theology. Seven Nobel Prize winners have come from Bonn. No tuition fees. Bonn is relatively affordable — students can live comfortably on €700–900 per month including accommodation.

**9. University of Göttingen**

A world-renowned research university with particular strength in physics, mathematics, and life sciences — 45 Nobel laureates have studied or taught here. No tuition fees. The small university-town atmosphere makes Göttingen one of Germany''s most welcoming environments for international students.

**10. TU Dresden**

One of Germany''s oldest technical universities, TU Dresden offers excellent programs in engineering, natural sciences, and economics. Semester fee around €275. Dresden is one of Germany''s most affordable cities to live in, with average student living costs of €600–750 per month.

**Practical Tips Before You Apply**

Applications for the winter semester (October start) typically close between May and July. Most Bachelor''s programs are taught in German, while Master''s programs are increasingly offered in English. You will need to demonstrate €11,208 in a blocked account for your German student visa. The uni-assist portal handles international applications for many German universities. Apply for the DAAD scholarship alongside your university application — at some institutions they are assessed together.

Germany''s combination of free or near-free education, internationally recognized degrees, and a booming job market makes it unmatched for value in European higher education.',
  'University Spotlights',
  'UniGateEU Team',
  true
),

(
  'How to Write a Winning Statement of Purpose for European Universities',
  'how-to-write-winning-statement-of-purpose-european-universities',
  'Your Statement of Purpose is the most controllable part of your application. Here is a proven six-part framework used by successful applicants to TU Munich, Delft, Sciences Po, and other top European institutions.',
  '**The Most Important Document You Will Write**

Your Statement of Purpose (SOP) — or Personal Statement for undergraduate applications — is the single most controllable element of your university application. Unlike your GPA or test scores, which are fixed history, your statement can be crafted, revised, and perfected. European universities pay close attention to it, especially for Master''s and PhD programs where committees want to understand your research interests, professional trajectory, and why their specific program is the right fit.

**Personal Statement vs Statement of Purpose: Know the Difference**

This distinction matters enormously and many applicants get it wrong. A Personal Statement — common for undergraduate applications in the UK, Ireland, and some Dutch universities — focuses on personal narrative. It explores your passion for the subject, formative experiences, extracurricular achievements, and how your background prepared you for this course.

A Statement of Purpose — standard for Master''s and PhD applications across continental Europe — is more academic and professional in tone. It emphasizes your academic trajectory, research experience, specific intellectual interests within your field, and your post-degree career goals.

Submitting the wrong type is one of the most common and costly mistakes applicants make.

**The Six-Part Structure That Works**

**Part One: The Hook**

Start with something specific, not generic. Not "I have always been passionate about engineering." Instead: "When I designed a low-cost water filtration prototype in my third year at university, I discovered that the real constraint was not engineering — it was materials science." One specific story or insight immediately distinguishes you from the hundreds of generic openings admissions readers see every cycle.

**Part Two: Your Academic Background**

Walk the reader through your degree and most relevant coursework, but do not simply list courses. Explain what you discovered and explored. If you wrote a thesis, explain your research question and what drew you to it. If you achieved a strong GPA, mention it and contextualize what it represents in your grading system.

**Part Three: Research and Professional Experience**

This section carries heavy weight for postgraduate applications. Describe research projects, internships, or professional roles with specifics: name the organization, explain your contribution, and state what you learned. Vague claims like "I gained valuable experience" signal an applicant who does not know how to present evidence.

**Part Four: Why This Program**

This is where many applicants write the same paragraph across ten applications — and universities can tell. Research the specific program curriculum, faculty research areas, labs, and distinctive features. Reference specific modules or professors whose work aligns with your interests. This signals genuine motivation rather than desperation.

**Part Five: Why This University**

Beyond the program, why this institution specifically? Industry connections? Research facilities? Location in a city or country that serves your goals? This can be brief — two or three sentences — but it must be specific.

**Part Six: Your Goals Post-Graduation**

Where are you headed? Be concrete but not rigid. "I intend to return to Nigeria to work in sustainable infrastructure development" is stronger than "I hope to contribute to my field." Goals give the committee confidence that admitting you serves a clear purpose.

**Common Mistakes to Avoid**

Starting with a quote is universally disliked by admissions readers. Restating your CV in paragraph form wastes valuable space — your SOP should complement your transcript and CV, not repeat them. Being vague about why you chose this program is the most detectable sign of a copy-pasted application. Exceeding the word limit signals poor judgment. Never mention financial motivation as a reason for choosing Europe.

**The Revision Process**

Write a first draft quickly — get everything out without editing. Then revise with three questions: Is every sentence specific and evidenced? Does the narrative flow logically from who you were to who you want to become? Does this sound like a real person or a template?

Read it aloud. Sentences that are difficult to say are difficult to read. Have someone outside your field read it — if they cannot follow it, it needs to be clearer.

UniGateEU''s Statement generator creates a personalised first draft based on your background and goals, and the critique tool provides specific, actionable feedback on what to strengthen.',
  'Tips & Guides',
  'UniGateEU Team',
  true
),

(
  'Student Visa Guide: Everything You Need to Know About Studying in France',
  'student-visa-guide-studying-in-france',
  'France is home to Sciences Po, Sorbonne, HEC, and some of Europe''s most prestigious institutions. Here is everything international students need to know about getting a French student visa.',
  '**France as a Study Destination**

France is home to some of Europe''s most prestigious institutions — Sciences Po, Sorbonne, HEC Paris, École Polytechnique, and CentraleSupélec among them. It also has one of Europe''s most structured student visa processes. Understanding it in advance saves months of confusion and avoids costly mistakes.

**Who Needs a Student Visa for France?**

Citizens of EU, EEA countries, and Switzerland do not need a visa to study in France. All other international students must apply for a French long-stay student visa (VLS-TS étudiant) for programs lasting more than 90 days. This visa functions as both your entry visa and your residence permit for the first year, which means you do not need to visit a préfecture immediately upon arrival — you validate it online within three months through the ANEF portal.

**The Two Types of French Student Visas**

The short-stay visa covers stays under 90 days and is suitable for summer schools, language programs, and short exchanges. The long-stay visa equivalent to a residence permit (VLS-TS) is what full degree students need. It is initially valid for one year and renewable for the duration of your program.

**The Campus France Process**

Most non-EU students must go through Campus France before applying to the French embassy. Campus France is a government agency that pre-screens international student applications. The process varies by country.

Students from countries with the full Campus France procedure — which includes most African countries, India, China, Brazil, and several others — must create a Campus France account online, complete their application, attend an interview at the Campus France center in their country, and receive a validation number before applying to the embassy. Students from countries with a simplified procedure complete a shorter online form and proceed directly to the visa application.

Check the French embassy website in your specific country to confirm which procedure applies to you.

**Required Documents**

You will need your acceptance letter from your French university, proof of tuition payment or scholarship award, proof of accommodation such as a university residence hall confirmation or housing contract, proof of financial resources of at least €615 per month, a valid passport with at least six months validity beyond your intended stay, passport-size photos meeting French specifications, health insurance documentation, your Campus France application number where applicable, and the completed visa application form. The visa fee is €50.

**Timeline to Allow**

Start your Campus France application three to four months before your program begins. Embassy appointment wait times can stretch four to eight weeks during busy seasons from June to August. Build in a minimum of five to six months lead time from when you receive your acceptance letter to when you need your visa in hand.

**Arriving in France: Your First Three Months**

Validate your VLS-TS visa on the ANEF portal within three months of arrival — failure to do so invalidates your visa. Register with your university''s international student office. Open a French bank account at BNP Paribas, Société Générale, or an online bank such as Revolut, as this is required to receive your CAF housing allowance. Apply for CAF housing benefit — international students in eligible accommodation can receive €100 to €200 per month in subsidy. Get a French SIM card and confirm your French address.

**Cost of Living in France**

In Paris, expect to spend €1,100 to €1,500 per month, with accommodation being the largest cost. In Lyon, Bordeaux, or Toulouse, a budget of €700 to €1,000 per month is realistic. In smaller university cities, €600 to €800 per month is often sufficient.

CROUS university residences are subsidized and highly sought after — apply as early as possible, as allocation is competitive. Private student residences and shared apartments (colocation) are the main alternatives.

**Working While Studying**

International students on a French student visa can work up to 964 hours per year, approximately 20 hours per week. The French minimum wage applies: approximately €11.65 per hour.

**Renewing Your Status**

In your second year and beyond, apply to renew your residence permit through the ANEF portal two to three months before your VLS-TS expires. Required documents are similar to your initial application plus proof of academic enrollment and satisfactory progress.

France combines strong scholarship programs, low tuition fees at public universities (€2,770 to €3,770 per year for most programs), and a lifestyle that makes it one of Europe''s most rewarding study destinations.',
  'Visa & Immigration',
  'UniGateEU Team',
  true
),

(
  '5 Scholarships Every African Student Should Apply For in 2025',
  '5-scholarships-african-students-apply-2025',
  'From DAAD to the Mastercard Foundation, here are the five most valuable scholarship opportunities for African students applying to European universities in 2025 — with deadlines, eligibility, and application tips.',
  '**More Funding Than You Think**

African students are among the fastest-growing populations applying to European universities — and with good reason. European education offers world-class quality, often at a fraction of the cost of American or UK programs. The challenge for most African students is not finding the right program; it is finding the funding to make it possible.

The good news is that there are more scholarship opportunities specifically targeting African students than most applicants realize. Here are five that every African student should know about and actively apply for in 2025.

**1. DAAD Scholarships — Germany**

The German Academic Exchange Service (DAAD) is one of the world''s largest funding organizations for international academic exchange. For African students, the most relevant programs are the DAAD Development-Related Postgraduate Courses — fully funded Master''s scholarships for students from developing countries planning to return home after graduation — and the Helmut-Schmidt Programme for public policy and governance Master''s programs.

Coverage includes tuition, a monthly stipend of €934 for graduates, health insurance, and a travel allowance. Eligibility requires a Bachelor''s degree with a strong academic record (GPA equivalent of at least 2.5 out of 4.0), a minimum of two years of work experience for some programs, and a commitment to returning to your home country after graduation.

Application windows typically run from September through November for programs starting the following October. This is one of the most generous scholarships available and should be a priority application for any eligible African student.

**2. Mastercard Foundation Scholars Program**

The Mastercard Foundation Scholars Program provides fully funded scholarships specifically for talented young Africans from economically disadvantaged backgrounds. Partnered with select universities across Africa and some international institutions, the program covers tuition, accommodation, a living allowance, books, and a laptop. Beyond funding, it provides mentoring, leadership development, and a strong alumni network of over 50,000 scholars.

Eligibility requires African citizenship, demonstrated financial need, a strong academic record, and evidence of commitment to giving back to Africa. Check the current list of partner universities carefully — the program is offered at specific institutions in Ghana, Kenya, Rwanda, South Africa, Egypt, and some international partners.

**3. Eiffel Excellence Scholarship — France**

The French Ministry for Europe and Foreign Affairs offers the Eiffel Excellence Scholarship to attract outstanding international students to French higher education. It is particularly relevant for African students pursuing Master''s or PhD programs in France.

Benefits include a monthly allowance of €1,181 for Master''s students and €1,400 for PhD students, plus round-trip airfare, health insurance, and a cultural activities budget. Eligibility requires being under 30 for Master''s or under 35 for PhD. You must first apply to and be accepted by a French higher education institution, which then nominates you for the Eiffel scholarship — you cannot apply directly. The application window runs from October through January for programs starting the following September.

**4. Orange Tulip Scholarship — Netherlands**

The Orange Tulip Scholarship is a merit-based award for international students from eligible countries applying to Dutch universities, offered in cooperation with Nuffic, the Dutch organization for internationalization in education. Several African nations are on the eligible country list, including Nigeria, Ghana, South Africa, Egypt, and others.

Value and coverage vary by institution, ranging from partial tuition waivers of €5,000 to €10,000 to full tuition coverage for some programs. Application is managed through your chosen Dutch university — you typically apply simultaneously for admission and the scholarship. Check the Nuffic OTS website annually as eligible countries and participating universities are updated each cycle.

**5. Swedish Institute Scholarships for Global Professionals (SISGP)**

Sweden offers fully funded scholarships for global professionals from eligible countries — which includes many African nations — pursuing Master''s programs at Swedish universities. The SISGP covers tuition fees, a living allowance of approximately SEK 10,000 per month, a travel grant, and insurance.

Eligibility requires citizenship of an eligible country (check the Swedish Institute website for the current year''s list), a minimum of three years of work experience after completing your undergraduate degree, and application to an eligible Master''s program in Sweden. The application window runs from February through March for programs starting in August of the same year.

**Final Advice: Build Your Timeline Around Scholarship Deadlines**

Do not treat scholarships as a backup plan — build your entire application timeline around scholarship deadlines. Most fully funded scholarships require your university application to be complete or accepted, so start the process 12 to 18 months before your intended start date. Use UniGateEU''s Scholarship Finder to surface awards you qualify for based on your nationality, field, and academic background.',
  'Scholarships',
  'UniGateEU Team',
  true
),

(
  'What It''s Really Like to Study in the Netherlands as an International Student',
  'what-its-really-like-to-study-netherlands-international-student',
  'The Netherlands has more English-taught degree programs than any other non-English-speaking country in Europe. But what is daily life actually like? Here is an honest account from arrival to graduation.',
  '**The Honest Picture**

The Netherlands consistently ranks among the most popular European destinations for international students — and it is not hard to see why. Dutch universities offer English-taught programs, internationally recognized degrees, a highly international campus culture, and one of Europe''s most welcoming environments for non-EU students.

But no one tells you the full picture. Here is an honest account of what studying in the Netherlands is actually like — the great parts, the challenging parts, and what to prepare for before you arrive.

**The Academic Culture: Direct, Independent, and Collaborative**

Dutch education is distinctive. If you come from an educational background where the professor lectures and students take notes, Dutch university will surprise you. Problem-Based Learning is widely used, particularly at Maastricht University, where students work in small groups to solve real-world problems with the lecturer acting as a facilitator rather than an instructor.

Even in traditional lecture-based universities like TU Delft, Leiden, or the University of Amsterdam, students are expected to actively contribute in seminars, challenge arguments, and engage critically. Sitting quietly and just submitting assignments on time is not enough.

Dutch professors are informal and accessible — students address them by first name and email them directly. But do not mistake informality for low standards. The Dutch are famously direct: if your work is below standard, you will be told so, clearly and without softening.

**The English Advantage**

The Netherlands has more English-taught degree programs than any other non-English-speaking country in Europe. At the Master''s level, the majority of programs are taught entirely in English. This makes the Netherlands one of the most accessible destinations for students from Africa, Asia, and the Americas who are not fluent in Dutch.

You can live in Amsterdam, Rotterdam, or Eindhoven for years speaking only English and function perfectly well. Learning basic Dutch phrases earns you goodwill from locals — the Dutch appreciate the effort even if they immediately switch to English in response.

**Cost of Living: The Honest Numbers**

The Netherlands is not cheap. A realistic monthly budget breakdown looks like this: accommodation costs €500 to €900 per month in Amsterdam and Rotterdam, or €400 to €700 in smaller cities like Groningen, Enschede, or Nijmegen. Groceries run €150 to €250 per month. Public transport via the OV-chipkaart costs €80 to €120 per month. Health insurance — mandatory for stays over four months — adds €120 to €150 per month. Miscellaneous expenses for phone, activities, and social life add another €100 to €200 per month.

Total realistic budget: €950 to €1,600 per month depending on city and lifestyle.

One critical point: Dutch student housing is genuinely scarce. Start looking for accommodation the moment you receive your acceptance letter. University housing portals, SSH, DUWO, and private Facebook groups for international student housing are your best options. Many students arrive without confirmed housing — do not be one of them.

**The International Community**

Major Dutch cities feel genuinely international. At TU Delft, over 30 percent of students are international. At Maastricht University, that figure exceeds 50 percent. You will share seminar rooms with students from India, Nigeria, China, Brazil, Germany, and dozens of other countries.

This internationalism is one of the Netherlands'' greatest assets. Your professional network by graduation will span multiple continents. Dutch companies like ASML, Shell, Philips, Heineken, and ING actively recruit internationally from Dutch universities.

**The Practical Realities**

Register with your local municipality within five days of arrival to obtain your BSN citizen service number, which you need for a bank account, health insurance, and legal employment. Non-EU students can work up to 16 hours per week. Buy a bicycle in your first week — everyone cycles everywhere, and a second-hand bike costing €50 to €150 is the most important purchase you will make. The Netherlands is grey, rainy, and windy for a large portion of the year — prepare psychologically and with good waterproof gear.

**Is It Worth It?**

For most students: emphatically yes. The combination of internationally recognized degrees, an English-language environment, a strong job market, and genuinely multicultural cities makes the Netherlands one of the best decisions an international student can make. The one-year Orientation Year visa after graduation gives you time to find work and potentially build a longer-term future in Europe. Just book your housing early.',
  'Student Life',
  'UniGateEU Team',
  true
),

(
  'How to Choose the Right European Country for Your Master''s Degree',
  'how-to-choose-right-european-country-masters-degree',
  'Choosing a country for your Master''s affects tuition costs, language requirements, career opportunities, and post-study work rights. Here is a step-by-step framework to make the right decision for your goals.',
  '**A Decision That Shapes More Than Your Degree**

Choosing a European country for your Master''s is not just an academic decision — it is a life decision that affects your language exposure, career opportunities, cost of living, post-study work rights, and potentially your long-term immigration pathway. With dozens of attractive options, narrowing down the choice can feel overwhelming.

This guide gives you a clear six-step framework to make the decision intelligently rather than randomly.

**Step 1: Define What "Right" Means for Your Goals**

Before comparing countries, define your personal priorities. Different students have different optimal choices depending on what they value most.

If minimizing cost is your priority, Germany, Norway, Czech Republic, and Poland offer tuition-free or near-free education. If maximizing career opportunities in tech and engineering is your goal, Germany, the Netherlands, and Sweden have the strongest ecosystems. If you want the most English-language programs without needing to learn a local language first, the Netherlands, Ireland, Sweden, and Denmark lead the way. If post-study work rights and a pathway to stay in Europe matter to you, Germany''s 18-month job search visa and the Netherlands'' Orientation Year are among the most generous.

Write your own priority list before comparing countries.

**Step 2: Compare Tuition Costs by Country**

Tuition varies enormously across Europe. German public universities charge essentially nothing — only semester fees of €150 to €400. Norway is free for all students regardless of nationality (though living costs in Oslo are very high). French public universities charge approximately €2,770 per year. The Netherlands charges €8,000 to €20,000 per year for non-EU students. Sweden charges €7,500 to €20,000 per year. Belgium ranges from €900 to €4,000 per year. Denmark charges €6,000 to €16,000 per year. Ireland charges €10,000 to €25,000 per year. Czech Republic offers free education in Czech-language programs and €2,000 to €8,000 per year for English programs.

Germany and Norway stand out for cost-conscious students. Germany because of state-funded free education and a booming job market. Norway because its free tuition policy extends to all nationalities regardless of citizenship status.

**Step 3: Language of Instruction**

If you are not fluent in the local language, your options divide into two clear groups. The Netherlands, Ireland, Sweden, Denmark, and Finland offer a massive proportion of Master''s programs entirely in English — you do not need the local language to complete your degree. Germany has many English Master''s programs but not all, and French-language programs dominate in France with a growing but still minority English offering.

If you plan to stay and work in Europe after graduation, investing in the local language gives you a significant competitive advantage regardless of where you study.

**Step 4: Post-Study Work Rights**

This matters enormously for anyone intending to work in Europe after graduation. Germany offers an 18-month job search visa for graduates. The Netherlands offers a one-year Orientation Year permit for graduates from top-100 ranked universities. France offers a two-year Talent Passport for graduates of French institutions. Ireland offers a two-year stay-back allowance for graduates of qualifying programs. Sweden provides a 12-month extension to search for work post-graduation.

**Step 5: Consider Total Cost of Living**

Top-line tuition is not the full picture. Norway has free tuition but Oslo costs €1,500 or more per month to live in. Germany has near-free tuition and Berlin costs €900 to €1,100 per month. Germany wins on total cost in almost every comparison. The Netherlands, Belgium, France, and Ireland sit in the middle range at €900 to €1,300 per month depending on city. Norway, Switzerland, and Denmark tend to be the most expensive for day-to-day living.

**Step 6: Scholarship Availability**

Some countries have more robust scholarship ecosystems for international students. Germany offers DAAD. France offers the Eiffel Excellence Scholarship. Sweden offers the Swedish Institute scholarships. The Netherlands offers the Orange Tulip and Holland scholarships. Factor scholarship availability into your country choice — Germany with near-zero tuition plus a DAAD scholarship is genuinely life-changing in financial terms.

**Making Your Final Decision**

Map your top three priorities against the countries that score well on each. Most students find that two or three countries consistently rise to the top when they do this exercise honestly. Research specific programs within those countries, check UniGateEU''s university matching tool for personalized recommendations, and apply to your best matches across multiple countries. Flexibility on country is often what separates students who get funded placements from those who do not.',
  'Tips & Guides',
  'UniGateEU Team',
  true
);
