# Course Builder Tool

The Course Builder is a comprehensive tool for creating online course outlines, lesson plans, assessments, marketing content, and pricing strategies.

## Features

### 1. Course Outline Creation
Create structured course frameworks with clear learning objectives, modules, and lessons.

**Parameters:**
- `subject` (required): The main subject or topic for the course
- `level`: Target skill level (beginner, intermediate, advanced)
- `duration`: Expected course duration
- `learningGoals`: Specific learning objectives
- `targetAudience`: Description of the target audience
- `format`: Content format (video, text, interactive, mixed)

**Example:**
```typescript
createCourseOutline({
  subject: "JavaScript Programming",
  level: "beginner",
  duration: "6 weeks",
  targetAudience: "Working professionals",
  format: "mixed"
})
```

### 2. Lesson Content Generation
Generate detailed lesson plans with activities, resources, and assessments.

**Parameters:**
- `lessonTitle` (required): Title of the specific lesson
- `lessonType`: Type of lesson (lecture, workshop, case-study, project, quiz)
- `duration`: Expected duration of the lesson
- `learningObjectives`: Specific learning objectives for this lesson
- `prerequisites`: What students should know before taking this lesson
- `includeActivities`: Whether to include hands-on activities
- `includeResources`: Whether to include additional resources

**Example:**
```typescript
generateLessonContent({
  lessonTitle: "Introduction to React Hooks",
  lessonType: "workshop",
  duration: "2 hours",
  includeActivities: true,
  includeResources: true
})
```

### 3. Assessment Development
Create various types of evaluations and assessments.

**Parameters:**
- `assessmentType` (required): Type of assessment (quiz, test, project, presentation, portfolio)
- `subject` (required): Subject or topic area for the assessment
- `difficulty`: Difficulty level (easy, medium, hard)
- `questionCount`: Number of questions for quiz/test assessments
- `includeAnswers`: Whether to include answer keys and explanations
- `rubric`: Whether to include grading rubric

**Example:**
```typescript
createAssessment({
  assessmentType: "quiz",
  subject: "JavaScript Fundamentals",
  difficulty: "medium",
  questionCount: 15,
  includeAnswers: true
})
```

### 4. Marketing Content Generation
Create compelling marketing materials to promote courses.

**Parameters:**
- `courseTitle` (required): Title of the course to promote
- `targetAudience`: Primary target audience for the marketing content
- `contentType`: Type of marketing content (course-description, email-sequence, social-media, landing-page, video-script)
- `tone`: Tone of voice (professional, casual, enthusiastic, authoritative, friendly)
- `keyBenefits`: Key benefits and outcomes students will gain
- `callToAction`: Specific call to action

**Example:**
```typescript
generateMarketingContent({
  courseTitle: "Complete Web Development Bootcamp",
  targetAudience: "Beginners",
  contentType: "social-media",
  tone: "enthusiastic"
})
```

### 5. Pricing Strategy Development
Develop pricing strategies and revenue models for courses.

**Parameters:**
- `courseType` (required): Type of course delivery model (self-paced, live-cohort, hybrid, certification)
- `marketSegment`: Target market segment (budget, mid-market, premium, enterprise)
- `competition`: Brief description of competitive landscape and pricing
- `valueProposition`: Unique value proposition of the course
- `includeBonuses`: Whether to include bonus materials or services
- `paymentOptions`: Payment structure options

**Example:**
```typescript
pricingStrategy({
  courseType: "live-cohort",
  marketSegment: "premium",
  includeBonuses: true,
  paymentOptions: ["one-time", "installments"]
})
```

## Usage in Chat

To use the Course Builder tool in a conversation:

1. **Ask for a course outline**: "Create a course outline for JavaScript programming for beginners"
2. **Generate lesson content**: "Create a lesson plan for React Hooks introduction"
3. **Create assessments**: "Make a quiz for JavaScript fundamentals"
4. **Generate marketing**: "Create marketing content for my web development course"
5. **Develop pricing**: "Help me create a pricing strategy for my online course"

## Portal Interface

The Course Builder Portal provides a user-friendly interface with three main tabs:

1. **Overview**: Introduction to the tool and quick start guide
2. **Create Course**: Form to create new course outlines
3. **Tools**: Access to all individual tool functions

## Technical Implementation

The Course Builder tool is implemented as part of the custom API tool system:

- **Manifest**: `CourseBuilderToolManifest` in `src/tools/custom-api-tool/index.ts`
- **Actions**: Tool functions in `src/tools/custom-api-tool/actions.ts`
- **Portal**: UI component in `src/tools/custom-api-tool/Portal/CourseBuilderPortal.tsx`
- **Registration**: Added to `src/tools/index.ts` and `src/tools/portals.ts`

## Testing

The tool includes comprehensive tests in `src/tools/custom-api-tool/__tests__/CourseBuilder.test.ts` that verify all functionality works correctly.

## Example Output

When you create a course outline, you'll get a structured response like:

```json
{
  "success": true,
  "courseOutline": {
    "title": "JavaScript Programming Course",
    "subject": "JavaScript Programming",
    "level": "beginner",
    "duration": "6 weeks",
    "targetAudience": "Working professionals",
    "format": "mixed",
    "modules": [
      {
        "title": "Introduction to JavaScript Programming",
        "description": "Get started with the fundamentals",
        "lessons": ["Overview", "Key Concepts", "Getting Started"],
        "duration": "1 week"
      }
    ],
    "learningObjectives": [
      "Understand the fundamental concepts of JavaScript Programming",
      "Apply basic principles in practical scenarios"
    ],
    "prerequisites": ["No prior experience required", "Basic computer literacy"],
    "estimatedHours": 30,
    "certification": "Completion Certificate"
  }
}
```

This tool empowers educators, trainers, and content creators to develop comprehensive online courses that engage learners and achieve measurable outcomes.
