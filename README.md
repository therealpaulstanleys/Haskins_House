# Haskins House Records

**Portsmouth's Premier Vinyl Destination** | *E-commerce Platform for Record Store*

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-purple.svg)
![Status](https://img.shields.io/badge/status-in_development-orange.svg)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Development Status](#development-status)
- [API Documentation](#api-documentation)
- [Project Roadmap](#project-roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

Haskins House Records is a modern e-commerce platform built for Portsmouth, Ohio's premier vinyl record store. This full-stack application integrates with Square's payment processing and inventory management systems to provide a seamless shopping experience for music enthusiasts.

**Live Site**: [Haskins House Records](https://haskinshouserecords.com)  
**Repository**: [github.com/therealpaulstanleys/Haskins_House](https://github.com/therealpaulstanleys/Haskins_House)

## Features

### Completed
- **Secure Server Infrastructure**: Express.js with Helmet, CORS, and rate limiting
- **Responsive Frontend**: Mobile-first HTML design with modern CSS
- **Square API Integration**: Inventory fetching and catalog management
- **Security Framework**: Session management, cookie parsing, and Vault integration ready
- **Professional Design**: Custom logo, favicons, and brand identity

### In Development
- **Shopping Cart System**: Full cart management with session persistence
- **Payment Processing**: Secure checkout with Square payments
- **User Authentication**: Customer accounts and order history
- **Search & Filter**: Advanced product discovery tools
- **Admin Dashboard**: Inventory and order management interface

### Planned Features
- **Newsletter Integration**: Customer engagement and marketing
- **Wishlist Functionality**: Save favorites for later purchase
- **Social Media Integration**: Share purchases and reviews
- **Mobile App**: Native iOS and Android applications

## Tech Stack

### Backend
```
Node.js >= 20.0.0
Express.js ^4.18.2
Square SDK ^39.1.1
Express-session ^1.18.2
Helmet ^7.1.0 (Security)
CORS ^2.8.5
Rate Limiting ^7.1.5
```

### Frontend
```
HTML5 & CSS3
Responsive Design
JavaScript (ES6+)
Static Asset Optimization
```

### Security & Infrastructure
```
Vault (Secrets Management)
Environment Variables (.env)
Session-based Authentication
HTTPS/TLS Ready
Rate Limiting Protection
```

### Development Tools
```
Nodemon ^3.0.3 (Development)
Morgan ^1.10.1 (Logging)
Dotenv ^16.4.1 (Environment)
```

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0
- Square Developer Account
- Vault Server (for production)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/therealpaulstanleys/Haskins_House.git
   cd Haskins_House
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your credentials
   nano .env
   ```

4. **Required Environment Variables**
   ```env
   # Square API Configuration
   SQUARE_ACCESS_TOKEN=your_square_access_token
   SQUARE_ENVIRONMENT=sandbox  # or production
   
   # Session & Security
   SESSION_SECRET=your_session_secret
   COOKIE_SECRET=your_cookie_secret
   
   # Vault Configuration (Production)
   VAULT_ADDR=https://your-vault-server:8200
   VAULT_TOKEN=your_vault_token
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

5. **Start Development Server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the Application**
   ```
   http://localhost:3000
   ```

## Development Status

### Current Progress: **65% Complete**

| Component | Status | Progress | Priority |
|-----------|--------|----------|----------|
| **Server Infrastructure** | ✅ Complete | 100% | High |
| **Frontend Structure** | ✅ Complete | 100% | High |
| **Square API Integration** | 🔄 In Progress | 75% | Critical |
| **API Endpoints** | ❌ Pending | 25% | Critical |
| **Shopping Cart** | ❌ Pending | 0% | High |
| **Payment Processing** | ❌ Pending | 0% | Critical |
| **User Authentication** | ❌ Pending | 0% | Medium |
| **Database Integration** | ❌ Pending | 0% | High |

### Critical Issues to Address

🔴 **High Priority**
- Missing Square API credentials configuration
- Incomplete API endpoints (returning placeholders)
- No database integration for persistent storage

🟡 **Medium Priority**
- Frontend not connected to backend APIs
- Limited error handling implementation
- No automated testing framework

### Recent Updates
- **March 27, 2025**: Updated workflow configuration
- **March 22, 2025**: Added automated workflow for code streamlining
- **February 2025**: Initial project structure and Square API research

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Cart Management
```http
GET    /api/cart          # Retrieve cart contents
POST   /api/cart/add      # Add item to cart
PUT    /api/cart/update   # Update cart item
DELETE /api/cart/remove   # Remove item from cart
```

#### Inventory
```http
GET /api/inventory        # List all available products
GET /api/inventory/:id    # Get specific product details
```

#### Payments
```http
POST /api/payments        # Process payment
GET  /api/payments/:id    # Get payment status
```

#### Authentication
```http
POST /api/auth/login      # User login
POST /api/auth/register   # User registration
POST /api/auth/logout     # User logout
```

### Example API Response
```json
{
  "success": true,
  "data": {
    "id": "prod_123456",
    "name": "Vintage Vinyl Record",
    "price": 29.99,
    "currency": "USD",
    "stock": 5,
    "description": "Classic album from the 70s"
  }
}
```

## Project Roadmap

### Phase 1: Foundation (Weeks 1-2) 🔴 Critical
**Environment & Security Setup**
- [ ] Configure Square API credentials
- [ ] Set up Vault for secrets management
- [ ] Complete environment variable configuration
- [ ] Implement comprehensive API endpoints
- [ ] Add robust error handling

**Deliverables**: Working API endpoints with Square integration

### Phase 2: Core Features (Weeks 3-4) 🟡 High Priority
**Frontend Integration & Database**
- [ ] Connect HTML pages to API endpoints
- [ ] Implement shopping cart functionality
- [ ] Add payment processing with Square
- [ ] Set up database for persistent storage
- [ ] Create user session management

**Deliverables**: Functional e-commerce platform with cart and payments

### Phase 3: Enhancement (Weeks 5-6) 🟢 Medium Priority
**User Experience & Performance**
- [ ] Add search and filtering capabilities
- [ ] Implement user accounts and order history
- [ ] Add comprehensive testing suite
- [ ] Optimize performance and caching
- [ ] Set up monitoring and analytics

**Deliverables**: Production-ready platform with advanced features

### Phase 4: Expansion (Future)
**Advanced Features**
- [ ] Mobile application development
- [ ] Advanced analytics dashboard
- [ ] Social media integration
- [ ] Newsletter and marketing tools
- [ ] Multi-store support

## Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow Node.js best practices
- Use ES6+ syntax
- Add comments for complex logic
- Include error handling
- Write descriptive commit messages

### Testing
- Add tests for new features
- Ensure all tests pass before submitting
- Test across different environments

## Technical Requirements

### System Requirements
- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **Memory**: 512MB minimum
- **Storage**: 100MB for application files

### Browser Support
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
- Mobile browsers (iOS Safari, Chrome Mobile)

### External Services
- **Square Developer Account**: Required for payments and inventory
- **Vault Server**: Recommended for production secrets management
- **Database**: PostgreSQL or MongoDB (for future releases)

## Troubleshooting

### Common Issues

**1. Square API Connection Failed**
```bash
# Check environment variables
echo $SQUARE_ACCESS_TOKEN

# Verify Square environment
# Sandbox: https://developer.squareup.com/apps
# Production: Square Developer Dashboard
```

**2. Server Won't Start**
```bash
# Check Node.js version
node --version

# Verify dependencies
npm install

# Check for port conflicts
lsof -i :3000
```

**3. Session Issues**
```bash
# Ensure session secret is set
SESSION_SECRET=your-secure-secret-key

# Check cookie settings
COOKIE_SECRET=your-cookie-secret
```

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check this README and inline code comments
- **Square Support**: For payment-related questions
- **Community**: Join our development discussions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Square**: For providing excellent payment processing APIs
- **Node.js Community**: For outstanding open-source tools
- **Contributors**: Everyone who helps improve this project
- **Haskins House Records**: For the opportunity to build something amazing

---

## Contact

**Project Maintainer**: therealpaulstanleys  
**Email**: Contact via GitHub Issues    
**Website**: Coming Soon

---

*Last Updated: November 28, 2025*  
*Next Review: December 15, 2025*