---
name: Serene Academic Interface
colors:
  surface: '#f9f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f9f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeef'
  surface-container-high: '#e8e8e9'
  surface-container-highest: '#e2e2e3'
  on-surface: '#1a1c1d'
  on-surface-variant: '#42474e'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#73777f'
  outline-variant: '#c3c6d0'
  surface-tint: '#3b608c'
  primary: '#3b608c'
  on-primary: '#ffffff'
  primary-container: '#7da2d1'
  on-primary-container: '#083861'
  inverse-primary: '#a4c9fa'
  secondary: '#366758'
  on-secondary: '#ffffff'
  secondary-container: '#b6ebd8'
  on-secondary-container: '#3a6c5d'
  tertiary: '#745945'
  on-tertiary: '#ffffff'
  tertiary-container: '#ba9983'
  on-tertiary-container: '#483220'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a4c9fa'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#204972'
  secondary-fixed: '#b9eedb'
  secondary-fixed-dim: '#9dd1bf'
  on-secondary-fixed: '#002018'
  on-secondary-fixed-variant: '#1c4f41'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#e3c0a8'
  on-tertiary-fixed: '#2a1708'
  on-tertiary-fixed-variant: '#5a422f'
  background: '#f9f9fa'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e3'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style

The design system is anchored in **Minimalism** with a **Corporate Modern** influence, tailored specifically for the educational sector. The goal is to reduce the cognitive load of school administrators, teachers, and students by prioritizing clarity, intentional whitespace, and a soothing visual rhythm.

The personality is **Empathetic yet Systematic**. It avoids the coldness of traditional enterprise software by using a "Human-Centric Professionalism" approach. The UI should evoke a sense of organized calm—like a well-lit, modern library. To differentiate from generic templates, the system utilizes subtle organic curves, proprietary-feeling pastel intersections, and high-quality typography that prioritizes reading endurance.

## Colors

The palette is built on high-chroma pastels to maintain a light, airy feel while ensuring interactive elements remain discoverable.

- **Primary (Serenity Blue):** Used for primary actions, navigation states, and brand-heavy components. It symbolizes trust and stability.
- **Secondary (Mint Green):** Reserved for "success" states, progress indicators, and growth-related metrics.
- **Tertiary (Pale Peach):** Used sparingly for highlights, student-centric alerts, or to soften data-heavy dashboards.
- **Surface & Background:** We use a "Paper White" (#FFFFFF) for cards and an "Alabaster Off-white" (#FBFBFC) for the main canvas to create a subtle distinction between the layout and the content containers.
- **Typography & Icons:** A deep Slate (#334155) is used instead of pure black to maintain softness and improve legibility against pastel backgrounds.

## Typography

The design system utilizes **Plus Jakarta Sans** across all levels. This typeface offers a modern, geometric structure with soft terminals that align with our "Professional and Welcoming" narrative.

- **Headlines:** Use a tighter letter-spacing and heavier weights to create a strong visual anchor for page titles.
- **Body Text:** Set with generous line-height to ensure readability during long-form grading or report reading.
- **Labels:** Slightly more compact and often used in uppercase for metadata or secondary navigation to provide contrast without increasing font size.

## Layout & Spacing

This design system follows a **Fluid Grid** model based on an 8px square-grid system. 

- **Desktop (1440px+):** A 12-column grid with 24px gutters and 40px outer margins. Use large 64px or 80px vertical padding between major sections to emphasize the "clean/minimalist" requirement.
- **Tablet (768px - 1439px):** An 8-column grid with 20px gutters.
- **Mobile (Up to 767px):** A 4-column grid with 16px gutters and 16px margins. 

Layouts should favor vertical stacking of cards rather than horizontal density. Content should breathe; if a screen feels "busy," increase the `section-padding` before reducing element sizes.

## Elevation & Depth

To maintain a clean aesthetic, depth is achieved through **Tonal Layers** and **Ambient Shadows** rather than heavy borders.

1.  **Level 0 (Base):** The off-white background (#FBFBFC).
2.  **Level 1 (Cards/Content):** Pure white (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.04)).
3.  **Level 2 (Overlays/Modals):** Pure white with a more defined shadow (0px 10px 30px rgba(0, 0, 0, 0.08)) and a slight 1px border in a light grey (#E2E8F0) to ensure edge definition.

Avoid using shadows for small components like buttons; use color fills or subtle 1px outlines instead to keep the UI feeling "objective" and flat.

## Shapes

The shape language is **Rounded**, reflecting the approachable nature of an educational environment. 

- **Standard Elements (Buttons, Inputs):** 8px (0.5rem) radius.
- **Containers (Cards, Modals):** 16px (1rem) radius.
- **Status Indicators (Tags, Chips):** Fully rounded (pill-shaped) to distinguish them from actionable buttons.

Avoid sharp corners entirely, as they appear too aggressive for the "welcoming" brand personality.

## Components

- **Buttons:** Primary buttons use a solid Serenity Blue fill with white text. Secondary buttons use a transparent background with a 1.5px border in Serenity Blue. No heavy gradients; keep them flat and modern.
- **Input Fields:** Use a light grey background (#F1F5F9) that transitions to white on focus with a Serenity Blue border. Labels are always positioned above the field for maximum accessibility.
- **Cards:** Cards are the primary vessel for information. They must have a minimum internal padding of 24px. Header sections within cards can be subtly tinted with the secondary (Mint) or tertiary (Peach) colors to denote category.
- **Chips & Badges:** Used for status (e.g., "Present," "Late," "Graded"). These should use a "Low-Contrast" style: a pale background version of the status color with deep-toned text of the same hue (e.g., Mint background #E6F6F0 with dark green text).
- **Progress Bars:** Use thick, rounded tracks (8px height) with the secondary Mint color to provide a positive emotional response to completion.
