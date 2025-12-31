# Sadhu - Meditation & Wellness Platform

A comprehensive meditation and wellness platform with online sessions, practitioner management, and HIPAA-compliant data handling.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for payments)
- Agora.io account (for video sessions)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd Sadhu

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and API keys

# Start development server
npm run dev
```

## 📁 Project Structure

```
Sadhu/
├── docs/                    # Documentation
│   ├── implementation/      # Implementation plans and status
│   ├── setup/               # Setup guides for integrations
│   └── reference/          # Reference materials
├── src/                     # Source code
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   └── integrations/       # Third-party integrations
├── supabase/                # Supabase configuration
│   ├── functions/           # Edge Functions
│   └── migrations/          # Database migrations
└── public/                   # Static assets
```

## 📚 Documentation

### Implementation
- **[Implementation Plan](./docs/implementation/IMPLEMENTATION_PLAN.md)** - Complete implementation plan for auth, products, and geo-pricing
- **[Implementation Status](./docs/implementation/IMPLEMENTATION_STATUS.md)** - Current status of all features
- **[HIPAA Implementation Summary](./docs/implementation/HIPAA_IMPLEMENTATION_SUMMARY.md)** - HIPAA compliance features

### Setup Guides
- **[Agora Setup](./docs/setup/AGORA_SETUP.md)** - Initial Agora video integration setup
- **[Agora Environment Variables](./docs/setup/AGORA_ENV_SETUP.md)** - Agora credentials configuration
- **[Agora Testing Setup](./docs/setup/AGORA_TESTING_SETUP.md)** - Testing Agora integration

### Reference
- **[Sitemap](./docs/reference/Sitemap.txt)** - Complete project requirements and feature list

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Payments**: Stripe
- **Video**: Agora.io
- **Deployment**: Netlify

## 🔐 Security & Compliance

This project implements HIPAA-compliant features including:
- Audit logging for all PHI access
- Consent management system
- Enhanced Row Level Security (RLS) policies
- Data retention policies
- Access grants for explicit data sharing

See [HIPAA Implementation Summary](./docs/implementation/HIPAA_IMPLEMENTATION_SUMMARY.md) for details.

## 💳 Payments

- Stripe integration for session payments and product purchases
- Multi-currency support (USD/CAD) with auto-detection
- Session packages (5 and 10 sessions)
- Practitioner payout system (75/25 split)

## 🎥 Video Sessions

- Agora.io integration for 1:1 and group sessions
- Session recording capabilities
- Shareable session links

## 📊 Features

### User Features
- Online session booking with practitioners
- Meditation journal
- Action checklist from practitioners
- Session history and credits
- Product purchases (Sadhu Board)

### Practitioner Features
- Schedule management
- Client management
- Session management
- Earnings tracking
- Action recommendations for clients

### Admin Features
- Practitioner management
- Client management
- Session oversight
- Payment tracking
- Audit log access

## 🚀 Deployment

### Database Migrations
```bash
supabase db push
```

### Edge Functions
```bash
supabase functions deploy <function-name>
```

### Frontend
Deploy via Netlify or your preferred hosting platform.

## 🔧 Environment Variables

Required environment variables (see `.env.example`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_AGORA_APP_ID` - Agora App ID (frontend)
- `STRIPE_SECRET_KEY` - Stripe secret key (Edge Functions)
- `AGORA_APP_ID` - Agora App ID (Edge Functions)
- `AGORA_APP_CERTIFICATE` - Agora App Certificate (Edge Functions)

## 📝 Development

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Database Migrations
```bash
# Create new migration
supabase migration new <migration-name>

# Apply migrations
supabase db push
```

## 🤝 Contributing

1. Review the [Implementation Plan](./docs/implementation/IMPLEMENTATION_PLAN.md)
2. Check [Implementation Status](./docs/implementation/IMPLEMENTATION_STATUS.md) for current progress
3. Follow existing code patterns and conventions
4. Ensure HIPAA compliance for any PHI-related changes

## 📄 License

[Your License Here]

## 🆘 Support

For setup issues, refer to the [Setup Guides](./docs/setup/). For implementation questions, see the [Implementation Documentation](./docs/implementation/).
