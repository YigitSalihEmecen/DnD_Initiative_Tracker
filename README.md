# EncounterFlow - D&D Initiative Tracker

A web-based initiative and encounter management tool for D&D Dungeon Masters.

## Features

### Campaign Management
- Create and organize multiple campaigns
- Local storage with offline functionality
- Campaign history and progress tracking

### Encounter Builder
- Build encounters with players and monsters
- Add creatures from integrated bestiary
- Save and reuse encounter templates

### Initiative Tracking
- Automatic initiative ordering
- Turn-based combat management
- Real-time health tracking and damage application
- Visual turn indicators

### Monster Bestiary
- Complete collection of official D&D monsters
- Search and filter by type, CR, source
- Full stat blocks with abilities and traits
- One-click monster addition to encounters

### User Interface
- Responsive design (desktop, tablet, mobile)
- WebView compatible for mobile apps
- Clean, intuitive interface
- Real-time updates

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: Firebase Auth (optional)
- **Storage**: Local storage + Firebase Firestore (optional)
- **Performance**: Lazy loading with caching

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:9002](http://localhost:9002)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## License

MIT
