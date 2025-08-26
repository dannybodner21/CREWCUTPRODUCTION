import { BuiltinToolManifest } from '@/types/tool';

export const CustomApiToolManifest: BuiltinToolManifest = {
    identifier: 'lewis',
    type: 'builtin',
    meta: {
        title: 'LEWIS',
        description: 'Connect to external APIs and databases, including Construction Fee Portal',
        avatar: '🧭', // Compass emoji for LEWIS
    },
    api: [
        {
            name: 'callExternalAPI',
            description: 'Make HTTP requests to external APIs',
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'The API endpoint URL to call',
                    },
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'PUT', 'DELETE'],
                        description: 'HTTP method to use',
                        default: 'GET',
                    },
                    headers: {
                        type: 'object',
                        description: 'HTTP headers to include in the request',
                    },
                    body: {
                        type: 'object',
                        description: 'Request body for POST/PUT requests',
                    },
                    timeout: {
                        type: 'number',
                        description: 'Request timeout in milliseconds',
                        default: 30000,
                    },
                },
                required: ['url'],
            },
        },
        {
            name: 'queryDatabase',
            description: 'Query database tables with filters and sorting',
            parameters: {
                type: 'object',
                properties: {
                    table: {
                        type: 'string',
                        description: 'The table name to query',
                    },
                    select: {
                        type: 'string',
                        description: 'Columns to select (comma-separated)',
                    },
                    filters: {
                        type: 'object',
                        description: 'Filter conditions for the query',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of records to return',
                    },
                    orderBy: {
                        type: 'object',
                        properties: {
                            column: { type: 'string' },
                            ascending: { type: 'boolean', default: true },
                        },
                        description: 'Ordering configuration',
                    },
                },
                required: ['table'],
            },
        },
        {
            name: 'performDatabaseOperation',
            description: 'Perform various database operations like getting all records, searching, counting, etc.',
            parameters: {
                type: 'object',
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['getAll', 'getById', 'search', 'count', 'schema', 'tables', 'recent', 'paginated'],
                        description: 'The type of database operation to perform',
                    },
                    table: {
                        type: 'string',
                        description: 'The table name for the operation',
                    },
                    id: {
                        type: 'string',
                        description: 'Record ID for getById operation',
                    },
                    searchColumn: {
                        type: 'string',
                        description: 'Column to search in for search operation',
                    },
                    searchTerm: {
                        type: 'string',
                        description: 'Search term to look for',
                    },
                    timestampColumn: {
                        type: 'string',
                        description: 'Column name for timestamp-based operations',
                    },
                    hours: {
                        type: 'number',
                        description: 'Number of hours for recent operations',
                    },
                    page: {
                        type: 'number',
                        description: 'Page number for paginated operations',
                    },
                    pageSize: {
                        type: 'number',
                        description: 'Number of records per page',
                    },
                    select: {
                        type: 'string',
                        description: 'Columns to select (comma-separated)',
                    },
                    filters: {
                        type: 'object',
                        description: 'Filter conditions for the query',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of records to return',
                    },
                    orderBy: {
                        type: 'object',
                        properties: {
                            column: { type: 'string' },
                            ascending: { type: 'boolean', default: true },
                        },
                        description: 'Ordering configuration',
                    },
                },
                required: ['table'],
            },
        },
        // Construction Fee Portal specific APIs
        {
            name: 'getCities',
            description: 'Get list of cities with filtering options for the Construction Fee Portal. Returns city information including name, population, county, and state. Use this to find available cities for fee calculations.',
            parameters: {
                type: 'object',
                properties: {
                    state: {
                        type: 'string',
                        description: 'State code to filter cities (e.g., "AZ" for Arizona)',
                    },
                    county: {
                        type: 'string',
                        description: 'County name to filter cities',
                    },
                    searchTerm: {
                        type: 'string',
                        description: 'Search term to filter cities by name or county',
                    },
                },
            },
        },
        {
            name: 'getFees',
            description: 'Get construction fees for a specific city with filtering options. Returns detailed fee information including category, description, amount, and calculation method. Use this to understand fee structures before calculating total project costs.',
            parameters: {
                type: 'object',
                properties: {
                    cityId: {
                        type: 'string',
                        description: 'City ID to get fees for (obtain this from getCities first)',
                    },
                    category: {
                        type: 'string',
                        description: 'Fee category to filter by (e.g., "Building Permit", "Plan Review", "Inspection", "Impact Fee")',
                    },
                    searchTerm: {
                        type: 'string',
                        description: 'Search term to filter fees by description or category',
                    },
                },
            },
        },
        {
            name: 'calculateFees',
            description: 'Calculate construction fees for a specific project in a city. This function will automatically fetch applicable fees and calculate total costs based on project value and square footage. Returns detailed breakdown of all fees and total project cost.',
            parameters: {
                type: 'object',
                properties: {
                    cityId: {
                        type: 'string',
                        description: 'City ID to calculate fees for (obtain this from getCities first)',
                    },
                    projectType: {
                        type: 'string',
                        enum: ['residential', 'commercial'],
                        description: 'Type of construction project (residential or commercial)',
                    },
                    projectValue: {
                        type: 'number',
                        description: 'Total project value in dollars (e.g., 500000 for $500k project)',
                    },
                    squareFootage: {
                        type: 'number',
                        description: 'Project square footage (e.g., 2500 for 2,500 sq ft)',
                    },
                },
                required: ['cityId', 'projectType', 'projectValue', 'squareFootage'],
            },
        },
    ],
    systemRole: `You are LEWIS, a powerful API Tool that can connect to external APIs and databases. You can also access the Construction Fee Portal, which provides information about construction fees for cities in Arizona.

Available capabilities:
1. **External API Calls**: Make HTTP requests to external APIs
2. **Database Operations**: Query and manipulate database tables
3. **Construction Fee Portal**: Access construction fee data and calculations

For Construction Fee Portal operations:
- Use getCities to find cities and their information
- Use getFees to retrieve fee structures for specific cities
- Use calculateFees to compute total fees for construction projects

**IMPORTANT: After calling any tool function, you MUST:**
1. **Process the tool result** - Parse the JSON response and understand what data was returned
2. **Provide an intelligent answer** - Use the tool results to answer the user's question in a helpful, informative way
3. **Explain the findings** - Don't just show raw data; interpret it and provide insights
4. **Format the response** - Present the information in a clear, organized manner

**Example workflow:**
- User asks: "What cities are available in Arizona?"
- You call: getCities({ state: "AZ" })
- You receive: JSON data with city information
- You respond: "Based on the Construction Fee Portal data, here are the available cities in Arizona: [list cities with population, county info, and insights]"

Always provide clear, helpful responses and explain what data you're retrieving or calculating. Never just call a tool without processing and presenting the results intelligently.`,
};

export const GrantToolManifest: BuiltinToolManifest = {
    identifier: 'grant',
    type: 'builtin',
    meta: {
        title: 'Grant',
        description: 'Your personal day trading coach powered by Polygon.io API - Get real-time market data and expert trading advice',
        avatar: '📈', // Chart emoji for Grant
    },
    api: [
        {
            name: 'getStockQuote',
            description: 'Get real-time stock quote data for a specific ticker symbol. Returns current price, volume, change, and other key metrics.',
            parameters: {
                type: 'object',
                properties: {
                    ticker: {
                        type: 'string',
                        description: 'Stock ticker symbol (e.g., "AAPL", "TSLA", "SPY")',
                    },
                },
                required: ['ticker'],
            },
        },
        {
            name: 'getStockHistory',
            description: 'Get historical stock price data for technical analysis. Returns OHLCV data for specified time period.',
            parameters: {
                type: 'object',
                properties: {
                    ticker: {
                        type: 'string',
                        description: 'Stock ticker symbol',
                    },
                    from: {
                        type: 'string',
                        description: 'Start date in YYYY-MM-DD format',
                    },
                    to: {
                        type: 'string',
                        description: 'End date in YYYY-MM-DD format',
                    },
                    timespan: {
                        type: 'string',
                        enum: ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
                        description: 'Time interval for data points',
                        default: 'day',
                    },
                    multiplier: {
                        type: 'number',
                        description: 'Multiplier for timespan (e.g., 5 for 5-minute intervals)',
                        default: 1,
                    },
                },
                required: ['ticker'],
            },
        },
        {
            name: 'getMarketIndicators',
            description: 'Get key market indicators and technical analysis data for a stock. Returns RSI, MACD, moving averages, and other indicators.',
            parameters: {
                type: 'object',
                properties: {
                    ticker: {
                        type: 'string',
                        description: 'Stock ticker symbol',
                    },
                    indicators: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['rsi', 'macd', 'sma', 'ema', 'bollinger', 'volume', 'all'],
                        },
                        description: 'Technical indicators to calculate',
                        default: ['all'],
                    },
                },
                required: ['ticker'],
            },
        },
        {
            name: 'getTradingAdvice',
            description: 'Get personalized trading advice and analysis for a specific stock. Analyzes current market conditions and provides actionable recommendations.',
            parameters: {
                type: 'object',
                properties: {
                    ticker: {
                        type: 'string',
                        description: 'Stock ticker symbol to analyze',
                    },
                    timeframe: {
                        type: 'string',
                        enum: ['day', 'swing', 'position'],
                        description: 'Trading timeframe for advice',
                        default: 'day',
                    },
                    riskTolerance: {
                        type: 'string',
                        enum: ['conservative', 'moderate', 'aggressive'],
                        description: 'Risk tolerance level for recommendations',
                        default: 'moderate',
                    },
                },
                required: ['ticker'],
            },
        },
        {
            name: 'getMarketNews',
            description: 'Get relevant market news and sentiment analysis for a stock or sector. Returns news articles with sentiment scores.',
            parameters: {
                type: 'object',
                properties: {
                    ticker: {
                        type: 'string',
                        description: 'Stock ticker symbol for news',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of news articles to return',
                        default: 10,
                    },
                },
                required: ['ticker'],
            },
        },
    ],
    systemRole: `You are Grant, an expert day trading coach and market analyst powered by real-time Polygon.io data. Your mission is to help users become better day traders through data-driven insights and personalized coaching.

Available capabilities:
1. **Real-time Market Data**: Access current stock prices, volume, and market movements
2. **Technical Analysis**: Calculate key indicators like RSI, MACD, moving averages, and Bollinger Bands
3. **Historical Analysis**: Review price patterns and trends over different timeframes
4. **Trading Advice**: Provide personalized recommendations based on market conditions and risk tolerance
5. **Market News**: Stay informed with relevant news and sentiment analysis

**IMPORTANT: After calling any tool function, you MUST:**
1. **Process the data** - Analyze the market information and technical indicators
2. **Provide coaching insights** - Explain what the data means for day trading
3. **Give actionable advice** - Offer specific trading recommendations and risk management tips
4. **Educate the user** - Help them understand market dynamics and improve their trading skills

**Example workflow:**
- User asks: "Should I day trade AAPL today?"
- You call: getStockQuote({ ticker: "AAPL" }) and getMarketIndicators({ ticker: "AAPL" })
- You analyze: Current price, volume, technical indicators, and market conditions
- You respond: "Based on today's market data, here's my analysis for AAPL day trading: [detailed analysis with specific entry/exit points, risk levels, and educational insights]"

Always provide:
- Clear market analysis with supporting data
- Specific trading recommendations with entry/exit points
- Risk management advice and position sizing
- Educational insights to help improve trading skills
- Real-time market context and sentiment

Remember: You're not just providing data - you're coaching a day trader to make better decisions and improve their skills.`,
};

export const ZeroToolManifest: BuiltinToolManifest = {
    identifier: 'zero',
    type: 'builtin',
    meta: {
        title: 'ZERO',
        description: 'AI-powered online course creation tool - Build and sell courses with AI assistance',
        avatar: '🎓', // Graduation cap emoji for ZERO
    },
    api: [
        {
            name: 'createCourseOutline',
            description: 'Create a comprehensive course outline with modules, lessons, and learning objectives',
            parameters: {
                type: 'object',
                properties: {
                    courseTitle: {
                        type: 'string',
                        description: 'The main title of the course',
                    },
                    courseDescription: {
                        type: 'string',
                        description: 'Brief description of what the course covers',
                    },
                    targetAudience: {
                        type: 'string',
                        description: 'Who this course is designed for (beginners, intermediate, advanced)',
                    },
                    courseDuration: {
                        type: 'string',
                        enum: ['1-2 hours', '3-5 hours', '6-10 hours', '10+ hours'],
                        description: 'Estimated time to complete the course',
                        default: '3-5 hours',
                    },
                    learningObjectives: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of specific learning objectives',
                    },
                    prerequisites: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'What students should know before taking the course',
                    },
                },
                required: ['courseTitle', 'courseDescription', 'targetAudience'],
            },
        },
        {
            name: 'generateLessonContent',
            description: 'Generate detailed lesson content including text, examples, and exercises',
            parameters: {
                type: 'object',
                properties: {
                    lessonTitle: {
                        type: 'string',
                        description: 'Title of the specific lesson',
                    },
                    lessonDescription: {
                        type: 'string',
                        description: 'What this lesson covers',
                    },
                    lessonType: {
                        type: 'string',
                        enum: ['theory', 'practical', 'case-study', 'interactive', 'assessment'],
                        description: 'Type of lesson content to generate',
                        default: 'theory',
                    },
                    includeExamples: {
                        type: 'boolean',
                        description: 'Whether to include practical examples',
                        default: true,
                    },
                    includeExercises: {
                        type: 'boolean',
                        description: 'Whether to include practice exercises',
                        default: true,
                    },
                    difficulty: {
                        type: 'string',
                        enum: ['beginner', 'intermediate', 'advanced'],
                        description: 'Difficulty level of the lesson',
                        default: 'beginner',
                    },
                },
                required: ['lessonTitle', 'lessonDescription'],
            },
        },
        {
            name: 'createAssessment',
            description: 'Generate quizzes, tests, and assessments for course evaluation',
            parameters: {
                type: 'object',
                properties: {
                    assessmentType: {
                        type: 'string',
                        enum: ['quiz', 'test', 'assignment', 'project', 'final-exam'],
                        description: 'Type of assessment to create',
                    },
                    lessonId: {
                        type: 'string',
                        description: 'ID of the lesson this assessment relates to',
                    },
                    questionCount: {
                        type: 'number',
                        description: 'Number of questions to generate',
                        default: 10,
                    },
                    questionTypes: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching'],
                        },
                        description: 'Types of questions to include',
                        default: ['multiple-choice'],
                    },
                    difficulty: {
                        type: 'string',
                        enum: ['beginner', 'intermediate', 'advanced'],
                        description: 'Difficulty level of the assessment',
                        default: 'intermediate',
                    },
                },
                required: ['assessmentType', 'lessonId'],
            },
        },
        {
            name: 'generateMarketingContent',
            description: 'Create marketing materials including course descriptions, sales pages, and promotional content',
            parameters: {
                type: 'object',
                properties: {
                    courseId: {
                        type: 'string',
                        description: 'ID of the course to generate marketing content for',
                    },
                    contentType: {
                        type: 'string',
                        enum: ['sales-page', 'email-sequence', 'social-media', 'video-script', 'landing-page'],
                        description: 'Type of marketing content to generate',
                    },
                    targetAudience: {
                        type: 'string',
                        description: 'Target audience for the marketing content',
                    },
                    tone: {
                        type: 'string',
                        enum: ['professional', 'casual', 'enthusiastic', 'authoritative', 'friendly'],
                        description: 'Tone of voice for the content',
                        default: 'professional',
                    },
                    callToAction: {
                        type: 'string',
                        description: 'Specific call to action for the content',
                    },
                },
                required: ['courseId', 'contentType'],
            },
        },
        {
            name: 'pricingStrategy',
            description: 'Generate pricing recommendations and strategies for course monetization',
            parameters: {
                type: 'object',
                properties: {
                    courseId: {
                        type: 'string',
                        description: 'ID of the course to analyze pricing for',
                    },
                    marketResearch: {
                        type: 'object',
                        properties: {
                            competitorPrices: {
                                type: 'array',
                                items: { type: 'number' },
                                description: 'Prices of similar courses in the market',
                            },
                            targetMarket: {
                                type: 'string',
                                description: 'Target market segment (budget, mid-range, premium)',
                            },
                            courseValue: {
                                type: 'string',
                                description: 'Perceived value proposition of the course',
                            },
                        },
                        description: 'Market research data for pricing analysis',
                    },
                    pricingModel: {
                        type: 'string',
                        enum: ['one-time', 'subscription', 'tiered', 'pay-what-you-want'],
                        description: 'Preferred pricing model',
                        default: 'one-time',
                    },
                },
                required: ['courseId'],
            },
        },
    ],
    systemRole: `You are ZERO, an AI-powered online course creation expert. Your mission is to help creators build comprehensive, engaging, and profitable online courses that provide real value to students.

Available capabilities:
1. **Course Planning**: Create detailed course outlines with clear learning objectives
2. **Content Generation**: Generate engaging lesson content with examples and exercises
3. **Assessment Creation**: Design quizzes, tests, and assignments for student evaluation
4. **Marketing Support**: Create compelling marketing materials and sales content
5. **Pricing Strategy**: Provide data-driven pricing recommendations

**IMPORTANT: After calling any tool function, you MUST:**
1. **Process the results** - Analyze the generated content and structure
2. **Provide actionable insights** - Explain how to use the generated content effectively
3. **Suggest improvements** - Offer recommendations for enhancing the course
4. **Guide next steps** - Help creators understand what to do next in their course development
5. **Return structured data** - Always return the generated content in a structured format that the portal can display

**Example workflow:**
- User asks: "I want to create a course on digital marketing for beginners"
- You call: createCourseOutline({ courseTitle: "Digital Marketing Fundamentals", courseDescription: "Complete guide to digital marketing for beginners", targetAudience: "beginners" })
- You receive: Detailed course structure with modules and lessons
- You respond: "Perfect! I've created a comprehensive course outline. Here's what we've built: [explain structure], and here are your next steps: [actionable guidance]"

**CRITICAL: Always return structured data in this format:**

For course outlines, return:
- courseOutline: { title, description, targetAudience, duration, modules, learningObjectives, prerequisites }

For lesson content, return:
- lessonContent: { lessonTitle, lessonDescription, lessonType, duration, content, examples, exercises, difficulty }

For assessments, return:
- assessment: { title, type, lessonId, questions, timeLimit, passingScore }

The portal will automatically parse and display this structured data.

Always provide:
- Clear, structured course content
- Practical examples and exercises
- Marketing and monetization strategies
- Step-by-step guidance for course development
- Quality assurance tips and best practices

Remember: You're not just generating content - you're helping creators build successful, profitable online courses that transform students' lives.`,
};

export const CourseBuilderToolManifest: BuiltinToolManifest = {
    identifier: 'course-builder',
    type: 'builtin',
    meta: {
        title: 'Course Builder',
        description: 'Create comprehensive online course outlines and lesson plans for any subject',
        avatar: '📚', // Book emoji for Course Builder
    },
    api: [
        {
            name: 'createCourseOutline',
            description: 'Create a comprehensive course outline with modules, lessons, and learning objectives',
            parameters: {
                type: 'object',
                properties: {
                    subject: {
                        type: 'string',
                        description: 'The main subject or topic for the course (e.g., "JavaScript Programming", "Digital Marketing", "Photography")',
                    },
                    level: {
                        type: 'string',
                        enum: ['beginner', 'intermediate', 'advanced'],
                        description: 'Target skill level for the course',
                        default: 'beginner',
                    },
                    duration: {
                        type: 'string',
                        description: 'Expected course duration (e.g., "4 weeks", "8 hours", "12 modules")',
                    },
                    learningGoals: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific learning objectives students should achieve',
                    },
                    targetAudience: {
                        type: 'string',
                        description: 'Description of the target audience (e.g., "Working professionals", "College students", "Small business owners")',
                    },
                    format: {
                        type: 'string',
                        enum: ['video', 'text', 'interactive', 'mixed'],
                        description: 'Primary content format for the course',
                        default: 'mixed',
                    },
                },
                required: ['subject'],
            },
        },
        {
            name: 'generateLessonContent',
            description: 'Generate detailed content for a specific lesson including activities, resources, and assessments',
            parameters: {
                type: 'object',
                properties: {
                    lessonTitle: {
                        type: 'string',
                        description: 'Title of the specific lesson',
                    },
                    lessonType: {
                        type: 'string',
                        enum: ['lecture', 'workshop', 'case-study', 'project', 'quiz'],
                        description: 'Type of lesson to generate',
                        default: 'lecture',
                    },
                    duration: {
                        type: 'string',
                        description: 'Expected duration of the lesson (e.g., "45 minutes", "2 hours")',
                    },
                    learningObjectives: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific learning objectives for this lesson',
                    },
                    prerequisites: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'What students should know before taking this lesson',
                    },
                    includeActivities: {
                        type: 'boolean',
                        description: 'Whether to include hands-on activities and exercises',
                        default: true,
                    },
                    includeResources: {
                        type: 'boolean',
                        description: 'Whether to include additional resources and references',
                        default: true,
                    },
                },
                required: ['lessonTitle'],
            },
        },
        {
            name: 'createAssessment',
            description: 'Create quizzes, tests, or project-based assessments for course evaluation',
            parameters: {
                type: 'object',
                properties: {
                    assessmentType: {
                        type: 'string',
                        enum: ['quiz', 'test', 'project', 'presentation', 'portfolio'],
                        description: 'Type of assessment to create',
                        default: 'quiz',
                    },
                    subject: {
                        type: 'string',
                        description: 'Subject or topic area for the assessment',
                    },
                    difficulty: {
                        type: 'string',
                        enum: ['easy', 'medium', 'hard'],
                        description: 'Difficulty level of the assessment',
                        default: 'medium',
                    },
                    questionCount: {
                        type: 'number',
                        description: 'Number of questions for quiz/test assessments',
                        default: 10,
                    },
                    includeAnswers: {
                        type: 'boolean',
                        description: 'Whether to include answer keys and explanations',
                        default: true,
                    },
                    rubric: {
                        type: 'boolean',
                        description: 'Whether to include grading rubric for project/presentation assessments',
                        default: false,
                    },
                },
                required: ['assessmentType', 'subject'],
            },
        },
        {
            name: 'generateMarketingContent',
            description: 'Create compelling marketing materials to promote the course',
            parameters: {
                type: 'object',
                properties: {
                    courseTitle: {
                        type: 'string',
                        description: 'Title of the course to promote',
                    },
                    targetAudience: {
                        type: 'string',
                        description: 'Primary target audience for the marketing content',
                    },
                    contentType: {
                        type: 'string',
                        enum: ['course-description', 'email-sequence', 'social-media', 'landing-page', 'video-script'],
                        description: 'Type of marketing content to generate',
                        default: 'course-description',
                    },
                    tone: {
                        type: 'string',
                        enum: ['professional', 'casual', 'enthusiastic', 'authoritative', 'friendly'],
                        description: 'Tone of voice for the marketing content',
                        default: 'professional',
                    },
                    keyBenefits: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Key benefits and outcomes students will gain',
                    },
                    callToAction: {
                        type: 'string',
                        description: 'Specific call to action for the marketing content',
                    },
                },
                required: ['courseTitle'],
            },
        },
        {
            name: 'pricingStrategy',
            description: 'Develop pricing strategies and revenue models for the course',
            parameters: {
                type: 'object',
                properties: {
                    courseType: {
                        type: 'string',
                        enum: ['self-paced', 'live-cohort', 'hybrid', 'certification'],
                        description: 'Type of course delivery model',
                        default: 'self-paced',
                    },
                    marketSegment: {
                        type: 'string',
                        enum: ['budget', 'mid-market', 'premium', 'enterprise'],
                        description: 'Target market segment for pricing',
                        default: 'mid-market',
                    },
                    competition: {
                        type: 'string',
                        description: 'Brief description of competitive landscape and pricing',
                    },
                    valueProposition: {
                        type: 'string',
                        description: 'Unique value proposition of the course',
                    },
                    includeBonuses: {
                        type: 'boolean',
                        description: 'Whether to include bonus materials or services in pricing',
                        default: true,
                    },
                    paymentOptions: {
                        type: 'array',
                        items: { type: 'string' },
                        enum: ['one-time', 'installments', 'subscription', 'pay-what-you-want'],
                        description: 'Payment structure options to consider',
                    },
                },
                required: ['courseType'],
            },
        },
    ],
    systemRole: `You are Course Builder, an expert instructional designer and course creation specialist. You help educators, trainers, and content creators develop comprehensive online courses that engage learners and achieve measurable outcomes.

Available capabilities:
1. **Course Outline Creation**: Design structured course frameworks with clear learning objectives
2. **Lesson Content Generation**: Create detailed lesson plans with activities and resources
3. **Assessment Development**: Design various types of evaluations and assessments
4. **Marketing Content**: Generate compelling promotional materials for courses
5. **Pricing Strategy**: Develop revenue models and pricing strategies

**IMPORTANT: After calling any tool function, you MUST:**
1. **Process the tool result** - Parse the JSON response and understand what was generated
2. **Provide an intelligent answer** - Use the tool results to answer the user's question in a helpful, informative way
3. **Explain the findings** - Don't just show raw data; interpret it and provide insights
4. **Format the response** - Present the information in a clear, organized manner

**Example workflow:**
- User asks: "I want to create a course about digital marketing for beginners"
- You call: createCourseOutline({ subject: "Digital Marketing", level: "beginner", duration: "6 weeks" })
- You receive: JSON data with course structure
- You respond: "I've created a comprehensive 6-week Digital Marketing course for beginners. Here's what your course will include: [explain the structure, modules, and learning outcomes in an organized way]"

Always provide clear, helpful responses and explain what you're creating or analyzing. Never just call a tool without processing and presenting the results intelligently.`,
};
