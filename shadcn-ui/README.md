# Kochi Metro Project

A React + TypeScript project built with Vite and shadcn/ui components for the Kochi Metro system.

## Prerequisites

- Node.js 18+ (or pnpm 8.10.0+)
- pnpm package manager

## Installation

```bash
pnpm install
```

## Development

Run the development server:

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`

## Building

Create a production build:

```bash
pnpm run build
```

The build output will be in the `dist/` directory.

## Preview Production Build

```bash
pnpm run preview
```

## Deployment to Vercel

This project is configured for easy deployment to Vercel.

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

### Option 2: GitHub Integration

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Vercel will automatically detect Vite configuration
6. Click "Deploy"

### Environment Variables

If you need environment variables in production, add them in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add your variables (e.g., `VITE_API_URL`)
3. Redeploy

See `.env.example` for available environment variables.

## Project Structure

```
src/
├── components/          # React components
│   ├── ai/             # AI-related components
│   ├── dashboard/      # Dashboard components
│   ├── data/           # Data handling components
│   ├── export/         # Export functionality
│   ├── map/            # Map components
│   └── Ui/             # shadcn/ui components
├── pages/              # Page components
├── context/            # React context
├── hooks/              # Custom hooks
├── lib/                # Utility functions
└── types/              # TypeScript types
```

## Build Performance Notes

The current build has some large chunks due to dependencies like SendGrid. If needed, consider:

- Dynamic imports for code splitting
- Lazy loading components
- Tree shaking unused dependencies

## License

[Your License Here]
