# UnnesHub Design Guidelines

This document outlines the design system and UI rules for UnnesHub to ensure visual consistency across the platform.

## Design Philosophy: Neo-Brutalism
UnnesHub uses a **Neo-Brutalist** design style characterized by:
- High-contrast colors
- Thick, dark borders
- Hard, non-blurred shadows
- Bold typography
- Geometric shapes

## Card Component Specification
All cards in the application must follow these consistent styling rules:

### 1. Base Colors
- **Background**: White (`#FFFFFF`) or light surface colors.
- **Border**: Primary Dark (`#0A1D37`).
- **Shadow**: Accent Yellow (`#F4C41B`) or Primary Dark (`#0A1D37`).

### 2. Border and Shadow Rules
- **Border Width**: 2px to 2.5px.
- **Shadow Offset**: 4px to 8px.
- **Shadow Blur**: 0px (Hard shadow).
- **Border Radius**: 12px (`rounded-xl`) to 24px (`rounded-3xl`).

### 3. Standard Card Types

#### Neo Card (Default)
The standard card for grid items and general containers.
- **Border**: 2px solid `#0A1D37`
- **Shadow**: `4px 4px 0px 0px #0A1D37`
- **Radius**: 12px
- **Class**: `.neo-card`

#### Neo Card Thick (High Emphasis)
For banners or featured sections.
- **Border**: 2.5px solid `#0A1D37`
- **Shadow**: `6px 6px 0px 0px #0A1D37`
- **Radius**: 16px
- **Class**: `.neo-card-thick`

#### Hero Card (Maximum Impact)
As seen on the Landing Page.
- **Border**: 2.5px solid `#0A1D37`
- **Shadow**: `8px 8px 0px 0px #F4C41B` (Yellow Accent)
- **Radius**: 24px (`rounded-3xl`)
- **Usage**: Only for main hero sections.

## Interactive Elements

### Buttons
- **Neo Yellow**: `bg-[#F4C41B]` with `3px` dark shadow.
- **Neo White**: `bg-white` with `3px` dark shadow and `2.5px` border.
- **Interactions**: On hover, the button should translate slightly (`-1px` to `-2px`) and increase shadow depth. On active/click, it should "depress" by translating towards the shadow and reducing shadow size.

### Badges
- **Neo Badge**: Rounded pill shape with `2px` border and `2px` dark shadow.

## Global CSS Helpers
Refer to `app/globals.css` for the pre-defined utility classes:
- `.neo-card`
- `.neo-card-thick`
- `.neo-button-yellow`
- `.neo-button-white`
- `.neo-badge`
