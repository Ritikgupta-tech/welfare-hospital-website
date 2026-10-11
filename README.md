# Welfare Hospital, Agra — Official Website Prototype

[![Astro 7](https://img.shields.io/badge/Astro-7.x-FF5D01.svg)](https://astro.build)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.x-38B2AC.svg)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org)
[![Status](https://img.shields.io/badge/Status-Client_Prototype_Ready-087F8C.svg)](#)

A modern, mobile-first healthcare website prototype and Google Business Profile setup package built for **Welfare Hospital, Agra, Uttar Pradesh**. Designed specifically for clinical credibility, patient accessibility, transparent doctor information, and high-conversion appointment requests.

---

## 1. Verified Hospital Master Profile

- **Hospital Name:** Welfare Hospital
- **Client / Supervising Physician:** Dr. Opee Rajput
- **Primary Telephone:** `+91 8490068558`
- **Location:** 100 Feet Road, Ram Bagh, Agra, Uttar Pradesh, India
- **Established History:** 34 years of healthcare dedication *(Hospital-supplied information)*
- **Verified Clinical Scope:** General Hospital & Physician Consultation
- **Project Scope:** Digital Website Prototype + Google Business Profile Setup & Handover

---

## 2. Design System & Brand Identity

The user interface follows a specialized medical palette engineered to instill patient trust, institutional stability, and readability across all age groups:

- **Deep Medical Navy (`#102A43`):** Primary structural tone, typography, and authoritative accents.
- **Healthcare Teal (`#087F8C`):** Interactive focal points, CTAs, icons, and focus rings.
- **Soft Mint (`#E8F7F4`):** Background highlights, badge surfaces, and calming secondary elements.
- **Clean White (`#FFFFFF`):** High-contrast readable card surfaces and text backgrounds.
- **Light Neutral Background (`#F5F8FA`):** Soft, glare-free canvas for seamless reading.
- **Muted Slate (`#62748A`):** Secondary descriptive typography with high legibility.
- **Restrained Amber (`#D97706`):** Compliance notices, prototype tags, and pending documentation indicators.

---

## 3. Architecture & Section Hierarchy

The homepage is composed of modular, performant components:

1. **Top Announcement Bar (`AnnouncementBar.astro`):** Direct phone line (`+91 8490068558`), Ram Bagh address, and clear prototype review badge.
2. **Sticky Header & Mobile Drawer (`Header.astro`):** Custom SVG medical emblem (`Logo.astro`), responsive desktop navigation, direct dial button, and mobile drawer with accessible ARIA toggle.
3. **Hero Section (`Hero.astro`):** Split-layout composition featuring 34-year experience highlights, direct CTAs, location indicator, layered 3D clinical visual composition, and floating trust badges.
4. **Trust & Experience Section (`TrustSection.astro`):** 4 grounded pillars (Community presence, Physician care, Ram Bagh accessibility, Patient-first philosophy) without fabricated metrics.
5. **About Welfare Hospital (`AboutSection.astro`):** Institutional background, medical standards checklist, direct doctor involvement, and verification scope notices.
6. **Medical Services Grid (`ServicesSection.astro`):** Verified categories (*General Healthcare*, *Physician Consultation*) and proposed categories (*General Medical Assessment*, *Follow-up Consultation*) with interactive **"Request Appointment"** buttons that auto-prefill the booking form.
7. **Doctors & Clinical Leadership (`DoctorsSection.astro`):** Profile card for Dr. Opee Rajput with credentials marked pending certified copies, accompanied by an extensible placeholder architecture for onboarding future associate doctors.
8. **Interactive Appointment Booking Form (`AppointmentBooking.astro`):** Production-ready consultation request interface with 10-digit Indian mobile validation, minimum date restriction (past dates disabled), duplicate submission protection, loading state, and an interactive confirmation modal with ticket reference and prototype notice.
9. **Why Patients Rely On Us (`WhyChooseUs.astro`):** 4 truthful value pillars grounded strictly in supplied facts.
10. **Location & Contact Section (`LocationContact.astro`):** Complete address, click-to-call link, Google Maps query deeplink, interactive map search simulation, and pin verification advisory.
11. **Frequently Asked Questions (`FaqSection.astro`):** Accessible accordion answering the 6 key patient questions regarding booking, doctor availability, location, and services.
12. **Semantic Footer (`Footer.astro`):** Full site navigation, verified contact details, medical and emergency disclaimers, draft legal policies, and copyright.
13. **Mobile Floating Action Bar (`MobileFloatingBar.astro`):** Touch-friendly sticky bottom bar on mobile screens providing one-tap phone dialing and instant appointment form jump.
14. **Local SEO & Structured Data (`SeoMeta.astro`, `robots.txt.ts`, `sitemap.xml.ts`):** Valid Schema.org `Hospital` / `Physician` JSON-LD metadata, OpenGraph tags, crawlable robots.txt, and XML sitemap.

---

## 4. Technology Stack

- **Framework:** [Astro 7](https://astro.build) (Static site generation with zero unnecessary client JavaScript for static content)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- **Language:** TypeScript (Strict typing enabled)
- **Icons:** `@lucide/astro`
- **Architecture:** Zero-heavy-bundle architecture, achieving near-instant first contentful paint (FCP).

---

## 5. Development & Build Commands

### Prerequisites
- Node.js `v22.x` or higher
- npm `v10.x` or higher

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:4321` in your browser.

### Build for Production
```bash
npm run build
```
Generates optimized static assets in the `./dist` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 6. Client Handover & Launch Assets

Included in this repository:

1. **[`GOOGLE_BUSINESS_PROFILE_GUIDE.md`](./GOOGLE_BUSINESS_PROFILE_GUIDE.md):** Complete operational checklist for claiming, verifying, photographing, and managing Welfare Hospital on Google Maps & Google Search.
2. **[`CLIENT_CONTENT_CHECKLIST.md`](./CLIENT_CONTENT_CHECKLIST.md):** Structured questionnaire and missing document checklist for Dr. Opee Rajput (formal qualifications, state medical council registration number, OPD hours, and clinic exterior photos).
3. **[`.env.example`](./.env.example):** Template for setting up live SMS, WhatsApp, and email notification gateways once backend integrations are scheduled.

---

## 7. Healthcare Responsibility & Disclaimers

- **Medical Advice Disclaimer:** This website prototype is intended for informational and appointment request purposes only. It does not provide medical diagnoses or replace direct clinical evaluations.
- **Emergency Service Disclaimer:** The website is not an emergency dispatch system. For acute medical emergencies, patients are directed to call 112 or visit the nearest emergency room.
- **Prototype Limitation:** Online form submissions currently demonstrate an interactive client flow with ticket generation; live SMS/WhatsApp dispatch will be activated following client backend authorization.
