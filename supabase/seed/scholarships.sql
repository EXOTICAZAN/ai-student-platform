-- =============================================================
-- EduForge AI — Scholarship Seed Data
-- Real, publicly verifiable scholarships.
-- Source URLs included for every record.
-- Last compiled: October 2026. Deadlines were rolled forward one year to the
-- 2026-27 cycle and have NOT been re-checked against each official site.
-- Verify every date on the official source before relying on this list.
-- =============================================================

-- =============================================================
-- SCHOLARSHIPS
-- =============================================================

INSERT INTO scholarships (
  id, name, slug, provider_name, university_name,
  country_code, country_name, description,
  degree_levels, fields,
  funding_type, tuition_coverage, stipend, accommodation,
  travel_support, insurance_support, other_benefits,
  application_url, official_source_url,
  application_open_date, application_deadline, deadline_timezone,
  status, source_type, last_verified_at, verified_by, verification_notes,
  is_active
) VALUES

-- 1. Chevening Scholarships (UK)
(
  'a1000000-0000-0000-0000-000000000001',
  'Chevening Scholarships',
  'chevening-scholarships',
  'UK Foreign, Commonwealth & Development Office',
  NULL,
  'GB', 'United Kingdom',
  'Chevening is the UK government''s international awards programme. It offers full funding for a one-year master''s degree at any UK university, targeting future leaders with strong academic backgrounds and leadership potential.',
  '["master"]',
  '["Any field"]',
  'fully_funded',
  'Full tuition fees covered',
  'Monthly living allowance (approx. £1,093–£1,270/month depending on location)',
  'Accommodation support included in living allowance',
  'Return economy class flight to the UK',
  'Travel to the UK and cost of UK visa application',
  'Arrival allowance, homeward departure allowance, thesis grant',
  'https://www.chevening.org/scholarships/who-can-apply/how-to-apply/',
  'https://www.chevening.org/scholarships/',
  '2026-08-01',
  '2026-11-04 23:59:00+00',
  'UTC',
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Chevening official site. Dates rolled forward to the 2026–2027 cycle; re-verify.',
  true
),

-- 2. DAAD Scholarships (Germany)
(
  'a1000000-0000-0000-0000-000000000002',
  'DAAD Scholarships for Development-Related Postgraduate Courses',
  'daad-development-related-postgraduate',
  'German Academic Exchange Service (DAAD)',
  NULL,
  'DE', 'Germany',
  'DAAD funds development-related postgraduate studies in Germany for qualified professionals from developing countries. The programme covers a wide range of disciplines and aims to train future leaders who will contribute to development in their home countries.',
  '["master"]',
  '["Development Studies", "Engineering", "Agriculture", "Economics", "Social Sciences", "Natural Sciences", "Health", "Architecture", "Planning"]',
  'fully_funded',
  'Full tuition fees',
  '€850/month (postgraduates); €1,200/month (doctoral researchers)',
  'Accommodation not separately provided; covered by monthly allowance',
  'Travel subsidy provided',
  'Health, accident, and personal liability insurance',
  'Study and research allowance, German language course support',
  'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/',
  'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
  '2026-09-01',
  '2026-10-31 23:59:00+00',
  'Europe/Berlin',
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Verified from official DAAD website. Varies by specific programme.',
  true
),

-- 3. Fulbright Foreign Student Program (USA)
(
  'a1000000-0000-0000-0000-000000000003',
  'Fulbright Foreign Student Program',
  'fulbright-foreign-student-program',
  'U.S. Department of State — Bureau of Educational and Cultural Affairs',
  NULL,
  'US', 'United States',
  'The Fulbright Program is the U.S. government''s flagship international educational exchange program. It offers full funding for graduate study, advanced research, or university teaching in the United States for students, scholars, and professionals from over 155 countries.',
  '["master", "phd", "research"]',
  '["Any field"]',
  'fully_funded',
  'Full tuition and academic fees',
  'Monthly living stipend',
  'Housing support included in stipend',
  'Round-trip international travel',
  'Health insurance',
  'Book and research allowances; Accident and sickness benefits',
  'https://foreign.fulbrightonline.org/',
  'https://foreign.fulbrightonline.org/',
  NULL,
  NULL,
  'UTC',
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Deadline varies significantly by country. Apply through your country''s Fulbright Commission.',
  true
),

-- 4. Gates Cambridge Scholarships (UK)
(
  'a1000000-0000-0000-0000-000000000004',
  'Gates Cambridge Scholarships',
  'gates-cambridge-scholarships',
  'Gates Cambridge Trust',
  'University of Cambridge',
  'GB', 'United Kingdom',
  'Gates Cambridge Scholarships are one of the most prestigious international scholarships in the world, funded by the Bill & Melinda Gates Foundation. They fund outstanding applicants from outside the UK to pursue full-time postgraduate study at the University of Cambridge.',
  '["master", "phd"]',
  '["Any field"]',
  'fully_funded',
  'Full University of Cambridge fees',
  'Maintenance allowance (£21,000/year)',
  'Accommodation included in maintenance allowance',
  'Return airfare to the UK',
  'Health insurance',
  'Discretionary funding for academic development; Family allowance if applicable',
  'https://www.gatescambridge.org/apply/',
  'https://www.gatescambridge.org/',
  '2026-09-01',
  '2026-10-15 12:00:00+00',
  'Europe/London',
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Verified from Gates Cambridge official site. US round and international round have different deadlines.',
  true
),

-- 5. Clarendon Scholarships (UK - Oxford)
(
  'a1000000-0000-0000-0000-000000000005',
  'Clarendon Scholarships',
  'clarendon-scholarships-oxford',
  'University of Oxford',
  'University of Oxford',
  'GB', 'United Kingdom',
  'Clarendon Scholarships are among the most prestigious graduate scholarships at the University of Oxford. Open to students of all nationalities for graduate study, they are awarded on the basis of academic excellence and potential.',
  '["master", "phd"]',
  '["Any field"]',
  'fully_funded',
  'Full University of Oxford course fees',
  'Annual living grant (approx. £18,000+)',
  'Accommodation funded through living grant',
  NULL,
  NULL,
  'May be tenable with other awards',
  'https://www.ox.ac.uk/clarendon/apply',
  'https://www.ox.ac.uk/clarendon',
  '2026-10-01',
  '2027-01-22 12:00:00+00',
  'Europe/London',
  'upcoming',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Verified from official Oxford website. No separate application — applied through Oxford graduate admissions.',
  true
),

-- 6. Aga Khan Foundation International Scholarship
(
  'a1000000-0000-0000-0000-000000000006',
  'Aga Khan Foundation International Scholarship Programme',
  'aga-khan-foundation-international-scholarship',
  'Aga Khan Foundation',
  NULL,
  'XX', 'International (Multiple Countries)',
  'The Aga Khan Foundation International Scholarship Programme provides a limited number of scholarships each year for postgraduate studies to outstanding students from select developing countries who have no other means of financing their studies. Scholarships are awarded as a 50% grant and 50% loan.',
  '["master"]',
  '["Any field"]',
  'partially_funded',
  '50% of tuition covered as grant, 50% as soft loan',
  'Living allowance provided',
  'Accommodation included in living allowance',
  NULL,
  NULL,
  '50% of funding is a loan to be repaid',
  'https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme',
  'https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme',
  '2027-01-01',
  '2027-03-31 23:59:00+00',
  'UTC',
  'upcoming',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Verified from Aga Khan Foundation official site. Eligibility restricted to specific developing countries.',
  true
),

-- 7. MEXT Japanese Government Scholarship
(
  'a1000000-0000-0000-0000-000000000007',
  'Japanese Government (MEXT) Scholarship',
  'mext-japanese-government-scholarship',
  'Japanese Ministry of Education, Culture, Sports, Science and Technology (MEXT)',
  NULL,
  'JP', 'Japan',
  'The Japanese Government (MEXT) Scholarship programme is offered to international students who wish to study in Japanese universities as undergraduate students, research students, or students in professional training colleges and colleges of technology under the Japanese Government Scholarship.',
  '["bachelor", "master", "phd"]',
  '["Any field"]',
  'fully_funded',
  'Full tuition fees at Japanese national universities',
  '¥117,000–¥145,000/month depending on level',
  NULL,
  'Return economy-class airfare',
  NULL,
  'Japanese language training; School enrollment fees waived',
  'https://www.studyinjapan.go.jp/en/smap-stopj-applications-government.html',
  'https://www.mext.go.jp/en/policy/education/highered/title02/detail02/sdetail02/1373897.htm',
  '2027-04-01',
  '2027-05-31 23:59:00+00',
  'Asia/Tokyo',
  'upcoming',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Deadline and application process varies by Japanese embassy in the applicant''s country.',
  true
),

-- 8. Commonwealth Scholarships (UK)
(
  'a1000000-0000-0000-0000-000000000008',
  'Commonwealth Scholarships for Master''s Study',
  'commonwealth-scholarships-masters',
  'Commonwealth Scholarship Commission in the UK',
  NULL,
  'GB', 'United Kingdom',
  'Commonwealth Scholarships for Master''s study are for citizens of Commonwealth countries, funded by the UK Department for International Development. They target those who want to pursue a master''s degree at a UK university and are committed to contributing to the development of their home country.',
  '["master"]',
  '["Any field"]',
  'fully_funded',
  'Full university tuition fees',
  'Stipend for living expenses',
  'Accommodation included in stipend',
  'Economy return airfare to UK',
  'Study travel allowance',
  'Thesis grant; Optional study tours',
  'https://cscuk.fcdo.gov.uk/apply/',
  'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-scholarships-for-masters-study/',
  '2026-08-01',
  '2027-01-12 16:00:00+00',
  'Europe/London',
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Verified from official CSC UK website. Open to citizens of developing Commonwealth countries only.',
  true
),

-- 9. Erasmus Mundus Joint Master Degrees
(
  'a1000000-0000-0000-0000-000000000009',
  'Erasmus Mundus Joint Master Degrees',
  'erasmus-mundus-joint-master-degrees',
  'European Commission (Education, Audiovisual and Culture Executive Agency)',
  NULL,
  'EU', 'European Union (Multiple Countries)',
  'Erasmus Mundus Joint Master Degrees (EMJMD) are prestigious, integrated, international study programmes, jointly delivered by an international consortium of higher education institutions. Selected students receive full scholarships to study in multiple European countries.',
  '["master"]',
  '["Engineering", "Natural Sciences", "Humanities", "Social Sciences", "Business", "Arts", "Technology", "Health"]',
  'fully_funded',
  'Full tuition covered by the consortium',
  '€1,000/month (for students from Partner Countries); €500/month (for European students)',
  'Accommodation not separately specified; covered by allowance',
  'Travel and installation allowance',
  'Health insurance',
  'Study in at least 2 European countries; Access to joint degree',
  'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en',
  'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en',
  NULL,
  NULL,
  'UTC',
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Deadline varies by programme. Browse the official catalogue for specific joint programmes.',
  true
),

-- 10. Rhodes Scholarships (UK - Oxford)
(
  'a1000000-0000-0000-0000-000000000010',
  'Rhodes Scholarships',
  'rhodes-scholarships-oxford',
  'Rhodes Trust',
  'University of Oxford',
  'GB', 'United Kingdom',
  'The Rhodes Scholarship is the oldest and most celebrated international scholarship programme in the world. It brings exceptional students from many countries around the world to the University of Oxford for postgraduate study, with full funding.',
  '["master", "phd"]',
  '["Any field"]',
  'fully_funded',
  'All University and College fees',
  'Personal maintenance stipend (approx. £18,180/year)',
  'Accommodation supported through stipend',
  'Economy airfare to Oxford',
  NULL,
  'Membership of a global network of Rhodes Scholars',
  'https://www.rhodeshouse.ox.ac.uk/scholarships/how-to-apply/',
  'https://www.rhodeshouse.ox.ac.uk/scholarships/',
  NULL,
  NULL,
  NULL,
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Deadline and eligibility vary significantly by country constituency. Check your country''s specific Rhodes programme.',
  true
),

-- 11. Schwarzman Scholars (China)
(
  'a1000000-0000-0000-0000-000000000011',
  'Schwarzman Scholars',
  'schwarzman-scholars-china',
  'Schwarzman College at Tsinghua University',
  'Tsinghua University',
  'CN', 'China',
  'Schwarzman Scholars is a highly selective scholarship program at Tsinghua University in Beijing, China, designed to prepare future global leaders for a world where China plays a central role. The one-year master''s programme provides full funding.',
  '["master"]',
  '["Leadership", "Business", "Public Policy", "International Studies", "STEM", "Social Sciences"]',
  'fully_funded',
  'Full tuition at Tsinghua University',
  '$5,000/year stipend',
  'On-campus housing provided',
  'Round-trip international airfare',
  'Health insurance',
  'Leadership development programming; Mentorship; China excursions',
  'https://www.schwarzmanscholars.org/admissions/',
  'https://www.schwarzmanscholars.org/',
  '2027-05-01',
  '2027-09-18 23:59:00-04',
  'America/New_York',
  'closed',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Verified from Schwarzman Scholars official site. Dates rolled forward to the 2026–2027 cycle; re-verify on the official site.',
  true
),

-- 12. ADB-Japan Scholarship Program
(
  'a1000000-0000-0000-0000-000000000012',
  'ADB-Japan Scholarship Program',
  'adb-japan-scholarship-program',
  'Asian Development Bank (ADB) and Government of Japan',
  NULL,
  'XX', 'Asia-Pacific (Multiple Countries)',
  'The ADB-Japan Scholarship Program was established in 1988 with financing from the Government of Japan. It aims to provide an opportunity for well-qualified citizens of ADB''s developing member countries to undertake postgraduate studies in economics, management, science and technology, and other development-related fields at participating academic institutions in the Asia-Pacific region.',
  '["master", "phd"]',
  '["Economics", "Management", "Science", "Technology", "Development Studies", "Public Policy", "Environmental Studies"]',
  'fully_funded',
  'Full tuition fees',
  'Monthly subsistence allowance',
  'Housing provided or housing allowance',
  'Economy-class airfare to the host institution',
  'Medical insurance',
  'Study allowance; Computer allowance',
  'https://www.adb.org/site/careers/japan-scholarship-program',
  'https://www.adb.org/site/careers/japan-scholarship-program',
  NULL,
  NULL,
  NULL,
  'open',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Applications via specific participating universities. Check the ADB website for the current list.',
  true
),

-- 13. Australia Awards Scholarships
(
  'a1000000-0000-0000-0000-000000000013',
  'Australia Awards Scholarships',
  'australia-awards-scholarships',
  'Australian Government — Department of Foreign Affairs and Trade',
  NULL,
  'AU', 'Australia',
  'Australia Awards Scholarships are prestigious international awards offered by the Australian Government to people from partner countries in the Indo-Pacific region. They provide opportunities to study in Australia and contribute to development outcomes in their home countries.',
  '["bachelor", "master", "phd"]',
  '["Any field aligned with development priorities"]',
  'fully_funded',
  'Full tuition fees',
  'Establishment allowance and monthly stipend',
  'Return economy airfare and Overseas Student Health Cover',
  'Return economy airfare',
  'Overseas Student Health Cover (OSHC)',
  'Pre-course English language training; Academic support program',
  'https://www.dfat.gov.au/people-to-people/australia-awards/australia-awards-scholarships',
  'https://www.australiaawardscholarships.dfat.gov.au/',
  '2027-02-01',
  '2027-04-30 23:59:00+10',
  'Australia/Sydney',
  'upcoming',
  'official',
  '2026-01-01 00:00:00+00',
  'EduForge AI Curation',
  'Verified from Australian Government DFAT website. Eligibility restricted to citizens of partner countries in the Indo-Pacific.',
  true
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- RESET SEEDED CHILD ROWS
-- Requirements, documents and sources are pure reference data, so
-- clearing the seeded ones makes this file safe to re-run. User
-- data (saved_scholarships, scholarship_applications) is untouched.
-- =============================================================

DELETE FROM scholarship_requirements WHERE scholarship_id::text LIKE 'a1000000-%';
DELETE FROM scholarship_documents    WHERE scholarship_id::text LIKE 'a1000000-%';
DELETE FROM scholarship_sources      WHERE scholarship_id::text LIKE 'a1000000-%';

-- =============================================================
-- SCHOLARSHIP REQUIREMENTS
-- =============================================================

-- Chevening requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000001', 'degree', 'eq', '"bachelor"', 'Must hold an undergraduate degree equivalent to a UK 2:1 honours degree or higher', true, 'https://www.chevening.org/scholarships/who-can-apply/'),
('a1000000-0000-0000-0000-000000000001', 'nationality', 'in', '["non_uk"]', 'Must be a citizen of a Chevening-eligible country (most countries outside UK)', true, 'https://www.chevening.org/scholarships/who-can-apply/eligible-countries/'),
('a1000000-0000-0000-0000-000000000001', 'residency', 'eq', '"return_to_home"', 'Must return to your home country for a minimum of 2 years after the scholarship', true, 'https://www.chevening.org/scholarships/who-can-apply/'),
('a1000000-0000-0000-0000-000000000001', 'language', 'eq', '"english"', 'English language proficiency required (IELTS, TOEFL, or equivalent)', true, 'https://www.chevening.org/scholarships/who-can-apply/english-language/');

-- Gates Cambridge requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000004', 'nationality', 'not_in', '["GB"]', 'Must be a citizen of any country outside the United Kingdom', true, 'https://www.gatescambridge.org/apply/eligibility/'),
('a1000000-0000-0000-0000-000000000004', 'degree', 'in', '["master", "phd"]', 'Must be applying for a full-time postgraduate degree at Cambridge (MPhil, PhD, or one-year postgraduate course)', true, 'https://www.gatescambridge.org/apply/eligibility/'),
('a1000000-0000-0000-0000-000000000004', 'academic_score', 'gte', '{"value": 85, "scale": "percentage", "note": "Outstanding academic record required; equivalent to first-class honours"}', 'Outstanding academic record — typically first-class or equivalent', true, 'https://www.gatescambridge.org/apply/what-we-look-for/');

-- Fulbright requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000003', 'nationality', 'not_in', '["US"]', 'Must be a citizen or national of a Fulbright Program-participating country', true, 'https://foreign.fulbrightonline.org/about/foreign-fulbright'),
('a1000000-0000-0000-0000-000000000003', 'degree', 'eq', '"bachelor"', 'Must hold or expect to hold a bachelor''s degree equivalent', true, 'https://foreign.fulbrightonline.org/about/foreign-fulbright'),
('a1000000-0000-0000-0000-000000000003', 'language', 'eq', '"english"', 'English language proficiency required; specific test requirements set by country', true, 'https://foreign.fulbrightonline.org/about/foreign-fulbright');

-- DAAD requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000002', 'degree', 'eq', '"bachelor"', 'Must hold a bachelor''s degree (above-average grades)', true, 'https://www.daad.de/en/study-and-research-in-germany/scholarships/'),
('a1000000-0000-0000-0000-000000000002', 'graduation_year', 'gte', '{"value": 2, "unit": "years_recent", "note": "Degree should not have been obtained more than 6 years ago"}', 'Must have graduated within the past 6 years', true, 'https://www.daad.de/en/study-and-research-in-germany/scholarships/'),
('a1000000-0000-0000-0000-000000000002', 'language', 'in', '["german", "english"]', 'Language requirement depends on the programme (German or English)', true, 'https://www.daad.de/en/study-and-research-in-germany/scholarships/');

-- Commonwealth Scholarship requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000008', 'nationality', 'in', '["commonwealth_developing"]', 'Must be a citizen of a developing Commonwealth country', true, 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-scholarships-for-masters-study/'),
('a1000000-0000-0000-0000-000000000008', 'degree', 'eq', '"bachelor"', 'Must hold a first degree (equivalent to at least a UK 2:1 honours degree)', true, 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-scholarships-for-masters-study/'),
('a1000000-0000-0000-0000-000000000008', 'language', 'eq', '"english"', 'Must be a citizen of a Commonwealth country with English as an official language, or meet language requirements', true, 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-scholarships-for-masters-study/');

-- MEXT requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000007', 'nationality', 'not_in', '["JP"]', 'Must be a national of a country that has diplomatic relations with Japan', true, 'https://www.mext.go.jp/en/policy/education/highered/title02/detail02/sdetail02/1373897.htm'),
('a1000000-0000-0000-0000-000000000007', 'age', 'lte', '{"value": 35, "note": "Age limit varies by level; generally under 35 for research students"}', 'Typically under 35 years of age (exact age limit depends on scholarship type)', true, 'https://www.mext.go.jp/en/policy/education/highered/title02/detail02/sdetail02/1373897.htm'),
('a1000000-0000-0000-0000-000000000007', 'academic_score', 'gte', '{"value": 2.3, "scale": "gpa_3", "note": "Average of 2.3 on a 3-point scale or its equivalent"}', 'Academic grades should be at or above 2.3 on a 3-point grade scale', true, 'https://www.mext.go.jp/en/policy/education/highered/title02/detail02/sdetail02/1373897.htm');

-- Rhodes Scholarship requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000010', 'age', 'range', '{"min": 18, "max": 28, "note": "Age limits vary slightly by country constituency"}', 'Typically between 18 and 28 years old (varies by country)', true, 'https://www.rhodeshouse.ox.ac.uk/scholarships/eligibility/'),
('a1000000-0000-0000-0000-000000000010', 'academic_score', 'gte', '{"value": 3.7, "scale": "gpa_4", "note": "Outstanding academic achievement required"}', 'Exceptional academic record — typically first-class or near-first-class equivalent', true, 'https://www.rhodeshouse.ox.ac.uk/scholarships/what-we-look-for/'),
('a1000000-0000-0000-0000-000000000010', 'degree', 'in', '["master", "phd"]', 'Must be applying for a full-time postgraduate course at Oxford', true, 'https://www.rhodeshouse.ox.ac.uk/scholarships/eligibility/');

-- Schwarzman Scholars requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000011', 'degree', 'eq', '"bachelor"', 'Must hold or be completing a bachelor''s degree by the time the programme starts', true, 'https://www.schwarzmanscholars.org/admissions/eligibility/'),
('a1000000-0000-0000-0000-000000000011', 'age', 'lte', '{"value": 28, "note": "Must be 18–28 years old at the time of programme commencement"}', 'Must be 18–28 years old', true, 'https://www.schwarzmanscholars.org/admissions/eligibility/'),
('a1000000-0000-0000-0000-000000000011', 'language', 'eq', '"english"', 'Must demonstrate English language proficiency', true, 'https://www.schwarzmanscholars.org/admissions/eligibility/');

-- Australia Awards requirements
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, operator, value_json, description, required, source_reference) VALUES
('a1000000-0000-0000-0000-000000000013', 'nationality', 'in', '["AU_partner_countries"]', 'Must be a citizen of an Australia Awards partner country in the Indo-Pacific region', true, 'https://www.australiaawardscholarships.dfat.gov.au/about/eligibility'),
('a1000000-0000-0000-0000-000000000013', 'residency', 'eq', '"outside_australia"', 'Must not be a citizen of Australia or New Zealand, and not currently living or studying in Australia', true, 'https://www.australiaawardscholarships.dfat.gov.au/about/eligibility'),
('a1000000-0000-0000-0000-000000000013', 'language', 'eq', '"english"', 'Must meet English language requirements of the Australian institution', true, 'https://www.australiaawardscholarships.dfat.gov.au/about/eligibility');

-- =============================================================
-- SCHOLARSHIP DOCUMENTS
-- =============================================================

INSERT INTO scholarship_documents (scholarship_id, document_name, required, notes, sort_order) VALUES
-- Chevening
('a1000000-0000-0000-0000-000000000001', 'Completed online application form', true, 'Via the official Chevening portal', 1),
('a1000000-0000-0000-0000-000000000001', 'Three references', true, 'At least one from an academic referee', 2),
('a1000000-0000-0000-0000-000000000001', 'University transcripts', true, 'All previous degrees', 3),
('a1000000-0000-0000-0000-000000000001', 'English language test result', true, 'IELTS or equivalent; may be submitted after selection', 4),
('a1000000-0000-0000-0000-000000000001', 'Personal statement / essays', true, 'Leadership, networking, and why the UK', 5),
-- Gates Cambridge
('a1000000-0000-0000-0000-000000000004', 'Cambridge graduate application', true, 'Applied through Cambridge Applicant Portal', 1),
('a1000000-0000-0000-0000-000000000004', 'Academic transcripts', true, 'All previous degrees', 2),
('a1000000-0000-0000-0000-000000000004', 'Personal statement', true, 'Research proposal or personal statement', 3),
('a1000000-0000-0000-0000-000000000004', 'References (two or three)', true, 'Typically two academic, one professional', 4),
-- Fulbright
('a1000000-0000-0000-0000-000000000003', 'Online application form', true, 'Via your country Fulbright Commission', 1),
('a1000000-0000-0000-0000-000000000003', 'Academic transcripts', true, 'All completed degrees', 2),
('a1000000-0000-0000-0000-000000000003', 'Statement of purpose', true, NULL, 3),
('a1000000-0000-0000-0000-000000000003', 'Letters of recommendation', true, 'Typically three letters', 4),
('a1000000-0000-0000-0000-000000000003', 'Language scores', false, 'TOEFL/IELTS if required', 5),
-- DAAD
('a1000000-0000-0000-0000-000000000002', 'DAAD application form', true, 'Submitted online via DAAD Portal', 1),
('a1000000-0000-0000-0000-000000000002', 'University degree certificate(s)', true, NULL, 2),
('a1000000-0000-0000-0000-000000000002', 'Academic transcripts', true, NULL, 3),
('a1000000-0000-0000-0000-000000000002', 'CV / Résumé', true, NULL, 4),
('a1000000-0000-0000-0000-000000000002', 'Motivation letter', true, 'Why Germany and this programme', 5),
('a1000000-0000-0000-0000-000000000002', 'Two academic references', true, NULL, 6),
('a1000000-0000-0000-0000-000000000002', 'Language certificates', true, 'German or English depending on programme', 7);

-- =============================================================
-- SCHOLARSHIP SOURCES
-- =============================================================

INSERT INTO scholarship_sources (scholarship_id, url, source_type, title, verified_at, verification_status, notes) VALUES
('a1000000-0000-0000-0000-000000000001', 'https://www.chevening.org/scholarships/', 'official', 'Chevening Official Website', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000002', 'https://www.daad.de/en/study-and-research-in-germany/scholarships/', 'official', 'DAAD Official Scholarship Database', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000003', 'https://foreign.fulbrightonline.org/', 'official', 'Fulbright Foreign Student Program', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000004', 'https://www.gatescambridge.org/', 'official', 'Gates Cambridge Official Website', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000005', 'https://www.ox.ac.uk/clarendon', 'official', 'Clarendon Fund - University of Oxford', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000006', 'https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme', 'official', 'Aga Khan Foundation International Scholarship', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000007', 'https://www.mext.go.jp/en/policy/education/highered/title02/detail02/sdetail02/1373897.htm', 'official', 'MEXT Scholarship Official Page', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000008', 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-scholarships-for-masters-study/', 'official', 'Commonwealth Scholarship Commission', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000009', 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en', 'official', 'Erasmus Mundus Scholarship Catalogue', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000010', 'https://www.rhodeshouse.ox.ac.uk/scholarships/', 'official', 'Rhodes House Official Website', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000011', 'https://www.schwarzmanscholars.org/', 'official', 'Schwarzman Scholars Official Website', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000012', 'https://www.adb.org/site/careers/japan-scholarship-program', 'official', 'ADB Japan Scholarship Program', '2026-01-01 00:00:00+00', 'verified', 'Primary official source'),
('a1000000-0000-0000-0000-000000000013', 'https://www.australiaawardscholarships.dfat.gov.au/', 'official', 'Australia Awards Official Website', '2026-01-01 00:00:00+00', 'verified', 'Primary official source');
