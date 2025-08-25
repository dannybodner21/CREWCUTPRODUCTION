# Custom API Tool

This package provides three powerful custom tools for LobeChat:

## 🧭 LEWIS - Construction Fee Portal

**LEWIS** is a comprehensive construction fee calculator and database tool that provides information about construction fees for cities across the United States.

### Features:
- **City Database**: Access to cities from multiple states with population, county, and state information
- **Fee Calculator**: Calculate construction fees based on project type, value, and square footage
- **Fee Database**: Comprehensive fee structures for different cities and project types
- **Comparison Tool**: Compare fees across different cities to find the best value

### Use Cases:
- Construction project planning and budgeting
- City selection for development projects
- Fee structure analysis and comparison
- Project cost estimation

## 📈 Grant - Day Trading Coach

**Grant** is your personal day trading coach powered by Polygon.io API integration. Get real-time market data and expert trading advice to improve your trading skills.

### Features:
- **Real-time Stock Quotes**: Current prices, volume, change, and market data
- **Technical Analysis**: RSI, MACD, moving averages, and other key indicators
- **Historical Data**: Price patterns and trends over different timeframes
- **Trading Advice**: Personalized recommendations with entry/exit points and risk management
- **Market News**: Relevant news with sentiment analysis
- **Educational Content**: Day trading tips and best practices

### Use Cases:
- Stock analysis and research
- Day trading decision support
- Technical indicator analysis
- Risk management guidance
- Market sentiment analysis

## 🎓 ZERO - AI Course Creation Portal

**ZERO** is an AI-powered online course creation tool that helps creators build comprehensive, engaging, and profitable online courses.

### Features:
- **Course Planning**: Create detailed course outlines with clear learning objectives
- **Content Generation**: Generate engaging lesson content with examples and exercises
- **Assessment Creation**: Design quizzes, tests, and assignments for student evaluation
- **Marketing Support**: Create compelling marketing materials and sales content
- **Pricing Strategy**: Get data-driven pricing recommendations for course monetization

### Use Cases:
- Online course development and planning
- Educational content creation
- Learning objective definition
- Student assessment design
- Course marketing and promotion
- Pricing strategy development

## API Functions

### LEWIS Functions:
- `getCities()` - Get list of cities with filtering options
- `getFees()` - Retrieve fee structures for specific cities
- `calculateFees()` - Compute total fees for construction projects

### Grant Functions:
- `getStockQuote()` - Get real-time stock quote data
- `getStockHistory()` - Retrieve historical price data for technical analysis
- `getMarketIndicators()` - Calculate technical indicators (RSI, MACD, etc.)
- `getTradingAdvice()` - Get personalized trading recommendations
- `getMarketNews()` - Access relevant market news and sentiment

### ZERO Functions:
- `createCourseOutline()` - Create comprehensive course outlines with modules and learning objectives
- `generateLessonContent()` - Generate detailed lesson content with examples and exercises
- `createAssessment()` - Create quizzes, tests, and assessments for course evaluation
- `generateMarketingContent()` - Generate marketing materials and promotional content
- `pricingStrategy()` - Get pricing recommendations and monetization strategies

## Getting Started

1. **For LEWIS**: Ask questions about construction fees, cities, or project calculations
2. **For Grant**: Ask about specific stocks, request trading advice, or get market analysis

### Example Queries:

**LEWIS:**
- "What cities are available in Arizona?"
- "Calculate construction fees for a $500k residential project in Phoenix"
- "Compare fees between Phoenix and Tucson"

**Grant:**
- "Should I day trade AAPL today?"
- "What's the technical analysis for TSLA?"
- "Give me trading advice for SPY with moderate risk tolerance"

**ZERO:**
- "I want to create a course on digital marketing for beginners"
- "Generate lesson content for a Python programming course"
- "Create a quiz for my photography course"
- "Help me market my online course on social media"
- "What should I price my course on web development?"

## Technical Details

- Built with React and TypeScript
- Uses Ant Design components for UI
- Integrates with external APIs (Polygon.io for Grant)
- Mock data implementation for demonstration
- Extensible architecture for adding new tools

## Future Enhancements

- Real Polygon.io API integration for live market data
- Advanced technical analysis algorithms
- Portfolio tracking and performance analysis
- Real-time alerts and notifications
- Integration with additional financial data sources
