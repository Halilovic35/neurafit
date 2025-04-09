# NeuraFit - AI-Powered Fitness Platform

NeuraFit is a modern, AI-powered fitness platform that provides personalized workout plans, meal recommendations, and real-time fitness coaching. Built with Next.js, TypeScript, and Tailwind CSS, it offers a seamless and responsive user experience across all devices.

## Features

### 🔐 User Login

Upon logging in, users get access to:
- AI Chatbot for real-time advice
- Personalized workout generator
- Meal plan customization and suggestions
- Full dashboard for tracking all fitness metrics

### 🔑 Test Account
- Email: admin@neurafit.com
- Password: Admin123!

### 🤖 AI Chatbot
- Real-time fitness and nutrition advice
- Personalized recommendations based on user goals
- Voice input support (coming soon)
- Powered by OpenAI's GPT-4

### 💪 Workout Plan Generator
- Customized workout plans based on:
  - Fitness goals (muscle gain, weight loss, endurance)
  - Experience level
  - Available equipment
  - Time constraints
- Detailed exercise instructions
- Progress tracking
- Form guidance

### 🥗 Meal Plan Generator
- Personalized meal plans considering:
  - Dietary preferences
  - Caloric needs
  - Macronutrient targets
  - Food allergies
- Detailed recipes and instructions
- Grocery lists
- Nutritional information

### 📊 User Dashboard
- Progress tracking
- Workout history
- Weight tracking
- Performance metrics
- Goal setting and monitoring

## Tech Stack

- **Frontend:**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - HeadlessUI

- **Backend:**
  - Next.js API Routes
  - OpenAI API
  - Prisma (coming soon)
  - PostgreSQL (coming soon)

- **Authentication:**
  - NextAuth.js (coming soon)

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/neurafit.git
cd neurafit
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
```env
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
neurafit/
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── chat/          # AI chatbot page
│   │   ├── workouts/      # Workout plan generator
│   │   ├── meal-plans/    # Meal plan generator
│   │   └── dashboard/     # User dashboard
│   ├── components/        # Reusable components
│   └── styles/           # Global styles
├── public/              # Static assets
└── prisma/             # Database schema (coming soon)
```

## Upcoming Features

- User authentication and profiles
- Progress photos and measurements
- Social features and community
- Mobile app (React Native)
- Integration with fitness wearables
- Video demonstrations for exercises
- Custom AI model fine-tuning
- Premium subscription features

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please feel free to:
- File an issue on GitHub
- Contact us directly at haallilovic@gmail.com
- Join our community discussions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for their powerful API
- Vercel for hosting and deployment
- The Next.js team for the amazing framework
- The open-source community for various tools and libraries
