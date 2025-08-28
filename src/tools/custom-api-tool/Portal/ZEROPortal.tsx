import { memo, useState, useEffect } from 'react';
import {
    Card,
    Select,
    Input,
    Button,
    Row,
    Col,
    Statistic,
    Space,
    Divider,
    Form,
    InputNumber,
    List,
    Tag,
    Spin,
    Alert,
    Typography,
    Table,
    Checkbox,
    message,
    Progress,
    Tooltip,
    Steps,
    Collapse,
    Timeline,
    Rate
} from 'antd';
import { createStyles } from 'antd-style';
import {
    GraduationCap,
    BookOpen,
    Target,
    Users,
    Clock,
    DollarSign,
    TrendingUp,
    FileText,
    PlayCircle,
    CheckCircle,
    Star,
    Download,
    Share2,
    Settings,
    BarChart3,
    Lightbulb,
    Award,
    Calendar,
    Bookmark,
    Zap,
    RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { BuiltinPortalProps } from '@/types/tool';

const { Search: _SearchInput } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel: _Panel } = Collapse;

const useStyles = createStyles(({ token }) => ({
    courseCard: {
        '.ant-card-head': {
            backgroundColor: token.colorPrimary,
            color: 'white',
        },
        '.ant-card-head-title': {
            color: 'white',
            fontSize: 18,
            fontWeight: 600,
        },
    },
    moduleCard: {
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        marginBottom: 16,
        '&:hover': {
            borderColor: token.colorPrimary,
            boxShadow: token.boxShadowSecondary,
        },
    },
    lessonItem: {
        padding: '12px 16px',
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        marginBottom: 8,
        backgroundColor: token.colorBgContainer,
        '&:hover': {
            backgroundColor: token.colorBgTextHover,
        },
    },
    objectiveTag: {
        margin: '4px 8px 4px 0',
        borderRadius: 16,
        fontWeight: 500,
    },
    progressCard: {
        textAlign: 'center',
        padding: 24,
    },
    marketingCard: {
        border: `2px solid ${token.colorSuccess}`,
        borderRadius: token.borderRadius,
        backgroundColor: token.colorSuccessBg,
    },
    pricingCard: {
        border: `2px solid ${token.colorWarning}`,
        borderRadius: token.borderRadius,
        backgroundColor: token.colorWarningBg,
    },
    assessmentCard: {
        border: `2px solid ${token.colorInfo}`,
        borderRadius: token.borderRadius,
        backgroundColor: token.colorInfoBg,
    },
}));

interface Course {
    id: string;
    title: string;
    description: string;
    targetAudience: string;
    duration: string;
    modules: Module[];
    learningObjectives: string[];
    prerequisites: string[];
    price: number;
    status: 'draft' | 'published' | 'archived';
    createdAt: string;
    updatedAt: string;
}

interface Module {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    order: number;
}

interface Lesson {
    id: string;
    title: string;
    description: string;
    type: 'theory' | 'practical' | 'case-study' | 'interactive' | 'assessment';
    duration: number; // in minutes
    content: string;
    examples: string[];
    exercises: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    completed: boolean;
}

interface Assessment {
    id: string;
    title: string;
    type: 'quiz' | 'test' | 'assignment' | 'project' | 'final-exam';
    lessonId: string;
    questions: Question[];
    timeLimit?: number; // in minutes
    passingScore: number;
}

interface Question {
    id: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'matching';
    question: string;
    options?: string[];
    correctAnswer: string;
    points: number;
}

const ZEROPortal = memo<BuiltinPortalProps>(({
    arguments: _args,
    messageId,
    state,
    apiName
}) => {
    const { t } = useTranslation('common');
    const { styles } = useStyles();
    const [courseForm] = Form.useForm();
    const [lessonForm] = Form.useForm();
    const [assessmentForm] = Form.useForm();

    // State management
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [showAddLesson, setShowAddLesson] = useState(false);
    const [showCreateAssessment, setShowCreateAssessment] = useState(false);

    // Parse the tool state to get data
    const toolState = typeof state === 'string' ? JSON.parse(state) : state;

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, [state]); // Add state as dependency to reload when tool state changes

    const loadInitialData = async () => {
        setLoading(true);
        try {
            let coursesToLoad: Course[] = [];

            // First, try to parse any existing courses from tool state
            if (toolState && typeof toolState === 'object') {
                // Check if tool state contains course data
                if (toolState.courses && Array.isArray(toolState.courses)) {
                    coursesToLoad = toolState.courses;
                } else if (toolState.courseOutline) {
                    // If we have a course outline from AI, create a course from it
                    const aiGeneratedCourse = createCourseFromOutline(toolState.courseOutline);
                    coursesToLoad = [aiGeneratedCourse];
                } else if (toolState.lessonContent) {
                    // If we have lesson content from AI, create a course with that lesson
                    const aiGeneratedCourse = createCourseFromLesson(toolState.lessonContent);
                    coursesToLoad = [aiGeneratedCourse];
                } else if (toolState.assessment) {
                    // If we have assessment data from AI, create a course with that assessment
                    const aiGeneratedCourse = createCourseFromAssessment(toolState.assessment);
                    coursesToLoad = [aiGeneratedCourse];
                }
            }

            // If no AI-generated content, load sample courses for demonstration
            if (coursesToLoad.length === 0) {
                coursesToLoad = getSampleCourses();
            }

            setCourses(coursesToLoad);
            if (coursesToLoad.length > 0) {
                setSelectedCourse(coursesToLoad[0]);
            }
        } catch (err) {
            console.error('Error loading course data:', err);
            setError('Failed to load course data');
            // Fall back to sample courses
            const sampleCourses = getSampleCourses();
            setCourses(sampleCourses);
            if (sampleCourses.length > 0) {
                setSelectedCourse(sampleCourses[0]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper function to create a course from AI-generated outline
    const createCourseFromOutline = (outline: any): Course => {
        return {
            id: Date.now().toString(),
            title: outline.title || outline.courseTitle || 'AI Generated Course',
            description: outline.description || outline.courseDescription || 'Course created with AI assistance',
            targetAudience: outline.targetAudience || 'beginners',
            duration: outline.duration || outline.courseDuration || '3-5 hours',
            modules: outline.modules || outline.chapters || [],
            learningObjectives: outline.learningObjectives || outline.objectives || [],
            prerequisites: outline.prerequisites || [],
            price: outline.price || 0,
            status: 'draft',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };
    };

    // Helper function to create a course from AI-generated lesson
    const createCourseFromLesson = (lessonData: any): Course => {
        return {
            id: Date.now().toString(),
            title: lessonData.courseTitle || 'Course with AI Lesson',
            description: lessonData.courseDescription || 'Course created with AI lesson content',
            targetAudience: lessonData.targetAudience || 'beginners',
            duration: '1-2 hours',
            modules: [{
                id: '1',
                title: 'Module 1',
                description: 'First module',
                order: 1,
                lessons: [{
                    id: '1',
                    title: lessonData.lessonTitle || 'AI Generated Lesson',
                    description: lessonData.lessonDescription || 'Lesson created with AI',
                    type: lessonData.lessonType || 'theory',
                    duration: lessonData.duration || 15,
                    content: lessonData.content || 'AI generated content...',
                    examples: lessonData.examples || [],
                    exercises: lessonData.exercises || [],
                    difficulty: lessonData.difficulty || 'beginner',
                    completed: false,
                }]
            }],
            learningObjectives: lessonData.learningObjectives || [],
            prerequisites: lessonData.prerequisites || [],
            price: 0,
            status: 'draft',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };
    };

    // Helper function to create a course from AI-generated assessment
    const createCourseFromAssessment = (assessmentData: any): Course => {
        return {
            id: Date.now().toString(),
            title: assessmentData.courseTitle || 'Course with AI Assessment',
            description: assessmentData.courseDescription || 'Course created with AI assessment',
            targetAudience: assessmentData.targetAudience || 'beginners',
            duration: '1-2 hours',
            modules: [{
                id: '1',
                title: 'Module 1',
                description: 'First module',
                order: 1,
                lessons: [{
                    id: '1',
                    title: 'Introduction',
                    description: 'Course introduction',
                    type: 'theory',
                    duration: 10,
                    content: 'Welcome to the course...',
                    examples: [],
                    exercises: [],
                    difficulty: 'beginner',
                    completed: false,
                }]
            }],
            learningObjectives: assessmentData.learningObjectives || [],
            prerequisites: assessmentData.prerequisites || [],
            price: 0,
            status: 'draft',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };
    };

    // Helper function to get sample courses
    const getSampleCourses = (): Course[] => {
        return [
            {
                id: '1',
                title: 'Digital Marketing Fundamentals',
                description: 'Complete guide to digital marketing for beginners',
                targetAudience: 'beginners',
                duration: '3-5 hours',
                modules: [
                    {
                        id: '1',
                        title: 'Introduction to Digital Marketing',
                        description: 'Learn the basics of digital marketing',
                        order: 1,
                        lessons: [
                            {
                                id: '1',
                                title: 'What is Digital Marketing?',
                                description: 'Understanding the digital marketing landscape',
                                type: 'theory',
                                duration: 15,
                                content: 'Digital marketing encompasses all marketing efforts that use electronic devices or the internet...',
                                examples: ['Social media advertising', 'Email marketing campaigns', 'Search engine optimization'],
                                exercises: ['Research 3 digital marketing channels', 'Identify target audience for a product'],
                                difficulty: 'beginner',
                                completed: false,
                            },
                            {
                                id: '2',
                                title: 'Digital Marketing Channels',
                                description: 'Explore various digital marketing channels',
                                type: 'practical',
                                duration: 20,
                                content: 'There are numerous digital marketing channels available to businesses...',
                                examples: ['Google Ads', 'Facebook Marketing', 'Content Marketing'],
                                exercises: ['Create a channel strategy', 'Analyze competitor channels'],
                                difficulty: 'beginner',
                                completed: false,
                            }
                        ]
                    },
                    {
                        id: '2',
                        title: 'Social Media Marketing',
                        description: 'Master social media marketing strategies',
                        order: 2,
                        lessons: [
                            {
                                id: '3',
                                title: 'Platform Selection',
                                description: 'Choose the right social media platforms',
                                type: 'case-study',
                                duration: 25,
                                content: 'Different social media platforms serve different purposes...',
                                examples: ['B2B: LinkedIn', 'B2C: Instagram', 'Visual: Pinterest'],
                                exercises: ['Audit your social media presence', 'Create platform-specific content'],
                                difficulty: 'intermediate',
                                completed: false,
                            }
                        ]
                    }
                ],
                learningObjectives: [
                    'Understand digital marketing fundamentals',
                    'Learn to create effective marketing campaigns',
                    'Master social media marketing strategies',
                    'Analyze marketing performance metrics'
                ],
                prerequisites: [
                    'Basic computer skills',
                    'Interest in marketing',
                    'Access to social media accounts'
                ],
                price: 99,
                status: 'published',
                createdAt: '2024-01-15',
                updatedAt: '2024-01-20'
            }
        ];
    };

    // Function to add new AI-generated content to existing courses
    const addAIContentToCourse = (aiContent: any) => {
        if (!aiContent) return;

        let updatedCourses = [...courses];
        let contentAdded = false;

        if (aiContent.courseOutline) {
            // Create new course from outline
            const newCourse = createCourseFromOutline(aiContent.courseOutline);
            updatedCourses = [newCourse, ...updatedCourses];
            contentAdded = true;
            message.success(`New course "${newCourse.title}" created from AI outline!`);
        } else if (aiContent.lessonContent && selectedCourse) {
            // Add lesson to existing course
            const updatedCourse = { ...selectedCourse };
            const newLesson = {
                id: Date.now().toString(),
                title: aiContent.lessonContent.lessonTitle || 'AI Generated Lesson',
                description: aiContent.lessonContent.lessonDescription || 'Lesson created with AI',
                type: aiContent.lessonContent.lessonType || 'theory',
                duration: aiContent.lessonContent.duration || 15,
                content: aiContent.lessonContent.content || 'AI generated content...',
                examples: aiContent.lessonContent.examples || [],
                exercises: aiContent.lessonContent.exercises || [],
                difficulty: aiContent.lessonContent.difficulty || 'beginner',
                completed: false,
            };

            if (updatedCourse.modules.length === 0) {
                updatedCourse.modules.push({
                    id: Date.now().toString(),
                    title: 'Module 1',
                    description: 'First module',
                    order: 1,
                    lessons: [newLesson]
                });
            } else {
                updatedCourse.modules[0].lessons.push(newLesson);
            }

            updatedCourses = updatedCourses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
            setSelectedCourse(updatedCourse);
            contentAdded = true;
            message.success(`New lesson "${newLesson.title}" added to course!`);
        } else if (aiContent.assessment && selectedCourse) {
            // Add assessment to existing course
            const updatedCourse = { ...selectedCourse };
            const newAssessment = {
                id: Date.now().toString(),
                title: aiContent.assessment.title || 'AI Generated Assessment',
                type: aiContent.assessment.type || 'quiz',
                lessonId: aiContent.assessment.lessonId || '1',
                questions: aiContent.assessment.questions || [],
                timeLimit: aiContent.assessment.timeLimit,
                passingScore: aiContent.assessment.passingScore || 70
            };

            // For now, we'll just show that an assessment was created
            message.success(`Assessment "${newAssessment.title}" created successfully!`);
            contentAdded = true;
        }

        if (contentAdded) {
            setCourses(updatedCourses);
            // Auto-select the new content
            if (aiContent.courseOutline) {
                setSelectedCourse(updatedCourses[0]);
            }
        }
    };

    // Effect to watch for new AI content in tool state
    useEffect(() => {
        if (toolState && typeof toolState === 'object') {
            // Check if we have new AI content that's different from what we already have
            const hasNewContent = toolState.courseOutline || toolState.lessonContent || toolState.assessment;
            if (hasNewContent) {
                addAIContentToCourse(toolState);
            }
        }
    }, [toolState]);

    const handleCreateCourse = async (values: any) => {
        setLoading(true);
        try {
            const newCourse: Course = {
                id: Date.now().toString(),
                title: values.courseTitle,
                description: values.courseDescription,
                targetAudience: values.targetAudience,
                duration: values.courseDuration || '3-5 hours',
                modules: [],
                learningObjectives: values.learningObjectives || [],
                prerequisites: values.prerequisites || [],
                price: values.price || 0,
                status: 'draft',
                createdAt: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0]
            };

            setCourses([...courses, newCourse]);
            setSelectedCourse(newCourse);
            setShowCreateCourse(false);
            courseForm.resetFields();
            message.success('Course created successfully!');
        } catch (err) {
            setError('Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLesson = async (values: any) => {
        if (!selectedCourse) return;

        setLoading(true);
        try {
            const newLesson: Lesson = {
                id: Date.now().toString(),
                title: values.lessonTitle,
                description: values.lessonDescription,
                type: values.lessonType || 'theory',
                duration: values.duration || 15,
                content: values.content || 'Lesson content will be generated...',
                examples: values.examples || [],
                exercises: values.exercises || [],
                difficulty: values.difficulty || 'beginner',
                completed: false,
            };

            const updatedCourse = { ...selectedCourse };
            if (updatedCourse.modules.length === 0) {
                // Create first module if none exists
                updatedCourse.modules.push({
                    id: Date.now().toString(),
                    title: 'Module 1',
                    description: 'First module',
                    order: 1,
                    lessons: [newLesson]
                });
            } else {
                // Add to first module
                updatedCourse.modules[0].lessons.push(newLesson);
            }

            setSelectedCourse(updatedCourse);
            setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
            setShowAddLesson(false);
            lessonForm.resetFields();
            message.success('Lesson added successfully!');
        } catch (err) {
            setError('Failed to add lesson');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssessment = async (values: any) => {
        if (!selectedCourse) return;

        setLoading(true);
        try {
            const newAssessment: Assessment = {
                id: Date.now().toString(),
                title: values.assessmentTitle,
                type: values.assessmentType,
                lessonId: values.lessonId,
                questions: [],
                timeLimit: values.timeLimit,
                passingScore: values.passingScore || 70
            };

            // For demo, add some sample questions
            if (values.assessmentType === 'quiz') {
                newAssessment.questions = [
                    {
                        id: '1',
                        type: 'multiple-choice',
                        question: 'Sample question 1',
                        options: ['Option A', 'Option B', 'Option C', 'Option D'],
                        correctAnswer: 'Option A',
                        points: 10
                    },
                    {
                        id: '2',
                        type: 'true-false',
                        question: 'Sample true/false question',
                        options: ['True', 'False'],
                        correctAnswer: 'True',
                        points: 10
                    }
                ];
            }

            // Add assessment to the course
            const updatedCourse = { ...selectedCourse };
            // For demo, we'll just show the assessment was created
            setSelectedCourse(updatedCourse);
            setShowCreateAssessment(false);
            assessmentForm.resetFields();
            message.success('Assessment created successfully!');
        } catch (err) {
            setError('Failed to create assessment');
        } finally {
            setLoading(false);
        }
    };

    const getCourseProgress = (course: Course) => {
        const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
        const completedLessons = course.modules.reduce((acc, module) =>
            acc + module.lessons.filter(lesson => lesson.completed).length, 0);
        return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    };

    const getTotalDuration = (course: Course) => {
        return course.modules.reduce((acc, module) =>
            acc + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0), 0);
    };

    if (loading && courses.length === 0) {
        return (
            <Flexbox align="center" justify="center" style={{ height: '100vh' }}>
                <Spin size="large" />
                <Text style={{ marginTop: 16 }}>Loading ZERO Course Creation Portal...</Text>
            </Flexbox>
        );
    }

    return (
        <Flexbox gap={16} style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <Card>
                <Flexbox align="center" gap={16} horizontal>
                    <GraduationCap size={32} />
                    <div>
                        <Title level={2} style={{ margin: 0 }}>ZERO - AI Course Creation Portal</Title>
                        <Text type="secondary">Build, design, and monetize online courses with AI assistance</Text>
                    </div>
                </Flexbox>
                <Divider style={{ margin: '16px 0' }} />
                <Row gutter={16}>
                    <Col span={6}>
                        <Statistic
                            title="Total Courses"
                            value={courses.length}
                            prefix={<BookOpen />}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Published"
                            value={courses.filter(c => c.status === 'published').length}
                            prefix={<CheckCircle />}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Total Lessons"
                            value={courses.reduce((acc, course) =>
                                acc + course.modules.reduce((sum, module) => sum + module.lessons.length, 0), 0)}
                            prefix={<FileText />}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Total Revenue"
                            value={courses.reduce((acc, course) => acc + (course.price || 0), 0)}
                            prefix={<DollarSign />}
                            suffix="$"
                        />
                    </Col>
                </Row>
            </Card>

            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError('')}
                />
            )}

            {/* Debug Section - Show tool state for development */}
            {process.env.NODE_ENV === 'development' && (
                <Card title="Debug: Tool State" size="small" style={{ marginBottom: 16 }}>
                    <Text type="secondary">API Name: {apiName}</Text>
                    <br />
                    <Text type="secondary">Message ID: {messageId}</Text>
                    <br />
                    <Text type="secondary">Tool State: {JSON.stringify(toolState, null, 2)}</Text>
                </Card>
            )}

            {/* Course Creation Section */}
            <Card title="Course Creation" size="small">
                <Row gutter={16} align="middle">
                    <Col span={16}>
                        <Text strong>Ready to create your next course?</Text>
                        <br />
                        <Text type="secondary">Use AI to generate course outlines, lesson content, and marketing materials</Text>
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button
                                icon={<RefreshCw />}
                                onClick={() => loadInitialData()}
                                loading={loading}
                            >
                                Refresh
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<Zap />}
                                onClick={() => setShowCreateCourse(true)}
                            >
                                Create New Course
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Course List */}
            {courses.length > 0 && (
                <Card title="Your Courses" size="small">
                    <Row gutter={16}>
                        {courses.map((course) => (
                            <Col span={8} key={course.id}>
                                <Card
                                    hoverable
                                    className={styles.courseCard}
                                    onClick={() => setSelectedCourse(course)}
                                    style={{
                                        cursor: 'pointer',
                                        border: selectedCourse?.id === course.id ? '2px solid #1890ff' : undefined
                                    }}
                                >
                                    <Flexbox gap={12}>
                                        <GraduationCap size={24} />
                                        <div style={{ flex: 1 }}>
                                            <Title level={5} style={{ margin: 0 }}>{course.title}</Title>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {course.description}
                                            </Text>
                                        </div>
                                    </Flexbox>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                <Users size={12} /> {course.targetAudience}
                                            </Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                <Clock size={12} /> {course.duration}
                                            </Text>
                                        </Col>
                                    </Row>
                                    <Row gutter={8} style={{ marginTop: 8 }}>
                                        <Col span={12}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                <FileText size={12} /> {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                                            </Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                <DollarSign size={12} /> ${course.price}
                                            </Text>
                                        </Col>
                                    </Row>
                                    <div style={{ marginTop: 12 }}>
                                        <Progress
                                            percent={getCourseProgress(course)}
                                            size="small"
                                            showInfo={false}
                                        />
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {getCourseProgress(course)}% Complete
                                        </Text>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>
            )}

            {/* Course Details */}
            {selectedCourse && (
                <Card title={`Course: ${selectedCourse.title}`} size="small">
                    <Steps current={currentStep} onChange={setCurrentStep}>
                        <Step title="Course Overview" icon={<BookOpen />} />
                        <Step title="Modules & Lessons" icon={<FileText />} />
                        <Step title="Assessments" icon={<Target />} />
                        <Step title="Marketing" icon={<TrendingUp />} />
                        <Step title="Pricing" icon={<DollarSign />} />
                    </Steps>

                    <Divider />

                    {currentStep === 0 && (
                        <div>
                            <Row gutter={24}>
                                <Col span={16}>
                                    <Title level={4}>Course Overview</Title>
                                    <Paragraph>{selectedCourse.description}</Paragraph>

                                    <Title level={5}>Learning Objectives</Title>
                                    <div>
                                        {selectedCourse.learningObjectives.map((objective, index) => (
                                            <Tag key={index} color="blue" className={styles.objectiveTag}>
                                                <CheckCircle size={12} /> {objective}
                                            </Tag>
                                        ))}
                                    </div>

                                    <Title level={5} style={{ marginTop: 16 }}>Prerequisites</Title>
                                    <div>
                                        {selectedCourse.prerequisites.map((prereq, index) => (
                                            <Tag key={index} color="orange" className={styles.objectiveTag}>
                                                <Bookmark size={12} /> {prereq}
                                            </Tag>
                                        ))}
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <Card className={styles.progressCard}>
                                        <Progress
                                            type="circle"
                                            percent={getCourseProgress(selectedCourse)}
                                            format={(percent) => `${percent}%`}
                                        />
                                        <Title level={4} style={{ marginTop: 16 }}>
                                            Course Progress
                                        </Title>
                                        <Text type="secondary">
                                            {getTotalDuration(selectedCourse)} minutes total
                                        </Text>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div>
                            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                                <Title level={4}>Modules & Lessons</Title>
                                <Button
                                    type="primary"
                                    icon={<FileText />}
                                    onClick={() => setShowAddLesson(true)}
                                >
                                    Add Lesson
                                </Button>
                            </Row>

                            {selectedCourse.modules.map((module, moduleIndex) => (
                                <Card key={module.id} title={`Module ${module.order}: ${module.title}`} className={styles.moduleCard}>
                                    <Paragraph>{module.description}</Paragraph>
                                    <List
                                        dataSource={module.lessons}
                                        renderItem={(lesson, lessonIndex) => (
                                            <List.Item className={styles.lessonItem}>
                                                <List.Item.Meta
                                                    avatar={<PlayCircle size={20} />}
                                                    title={
                                                        <Flexbox align="center" gap={8} horizontal>
                                                            <Text strong>{lesson.title}</Text>
                                                            <Tag color={lesson.completed ? 'success' : 'default'}>
                                                                {lesson.completed ? 'Completed' : 'Pending'}
                                                            </Tag>
                                                        </Flexbox>
                                                    }
                                                    description={
                                                        <div>
                                                            <Text type="secondary">{lesson.description}</Text>
                                                            <br />
                                                            <Flexbox gap={16} horizontal style={{ marginTop: 8 }}>
                                                                <Tag color="blue">{lesson.type}</Tag>
                                                                <Tag color="green">{lesson.difficulty}</Tag>
                                                                <Text type="secondary">{lesson.duration} min</Text>
                                                            </Flexbox>
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            ))}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                                <Title level={4}>Assessments & Quizzes</Title>
                                <Button
                                    type="primary"
                                    icon={<Target />}
                                    onClick={() => setShowCreateAssessment(true)}
                                >
                                    Create Assessment
                                </Button>
                            </Row>

                            <Card className={styles.assessmentCard}>
                                <Title level={5}>Assessment Types</Title>
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <Target size={20} />
                                                <Text strong>Quizzes</Text>
                                            </Flexbox>
                                            <Text type="secondary">Quick knowledge checks</Text>
                                        </Card>
                                    </Col>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <FileText size={20} />
                                                <Text strong>Assignments</Text>
                                            </Flexbox>
                                            <Text type="secondary">Practical exercises</Text>
                                        </Card>
                                    </Col>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <BarChart3 size={20} />
                                                <Text strong>Projects</Text>
                                            </Flexbox>
                                            <Text type="secondary">Real-world applications</Text>
                                        </Card>
                                    </Col>
                                    <Col span={6}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <Award size={20} />
                                                <Text strong>Final Exam</Text>
                                            </Flexbox>
                                            <Text type="secondary">Comprehensive evaluation</Text>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <Title level={4}>Marketing & Promotion</Title>
                            <Card className={styles.marketingCard}>
                                <Title level={5}>Marketing Tools Available</Title>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <FileText size={20} />
                                                <Text strong>Sales Pages</Text>
                                            </Flexbox>
                                            <Text type="secondary">Convert visitors to students</Text>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <TrendingUp size={20} />
                                                <Text strong>Email Sequences</Text>
                                            </Flexbox>
                                            <Text type="secondary">Nurture leads</Text>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <Share2 size={20} />
                                                <Text strong>Social Media</Text>
                                            </Flexbox>
                                            <Text type="secondary">Build awareness</Text>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div>
                            <Title level={4}>Pricing & Monetization</Title>
                            <Card className={styles.pricingCard}>
                                <Title level={5}>Pricing Strategies</Title>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <DollarSign size={20} />
                                                <Text strong>One-time</Text>
                                            </Flexbox>
                                            <Text type="secondary">Single payment</Text>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <Calendar size={20} />
                                                <Text strong>Subscription</Text>
                                            </Flexbox>
                                            <Text type="secondary">Recurring revenue</Text>
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card size="small">
                                            <Flexbox align="center" gap={8} horizontal>
                                                <BarChart3 size={20} />
                                                <Text strong>Tiered</Text>
                                            </Flexbox>
                                            <Text type="secondary">Multiple price points</Text>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    )}
                </Card>
            )}

            {/* Create Course Modal */}
            {showCreateCourse && (
                <Card title="Create New Course" size="small">
                    <Form form={courseForm} onFinish={handleCreateCourse} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="courseTitle"
                                    label="Course Title"
                                    rules={[{ required: true, message: 'Please enter course title' }]}
                                >
                                    <Input placeholder="Enter course title" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="targetAudience"
                                    label="Target Audience"
                                    rules={[{ required: true, message: 'Please select target audience' }]}
                                >
                                    <Select placeholder="Select target audience">
                                        <Option value="beginners">Beginners</Option>
                                        <Option value="intermediate">Intermediate</Option>
                                        <Option value="advanced">Advanced</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name="courseDescription"
                            label="Course Description"
                            rules={[{ required: true, message: 'Please enter course description' }]}
                        >
                            <Input.TextArea rows={3} placeholder="Describe what your course covers" />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="courseDuration" label="Course Duration">
                                    <Select placeholder="Select duration">
                                        <Option value="1-2 hours">1-2 hours</Option>
                                        <Option value="3-5 hours">3-5 hours</Option>
                                        <Option value="6-10 hours">6-10 hours</Option>
                                        <Option value="10+ hours">10+ hours</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="price" label="Price ($)">
                                    <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Create Course
                                </Button>
                                <Button onClick={() => setShowCreateCourse(false)}>
                                    Cancel
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            )}

            {/* Add Lesson Modal */}
            {showAddLesson && (
                <Card title="Add New Lesson" size="small">
                    <Form form={lessonForm} onFinish={handleAddLesson} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="lessonTitle"
                                    label="Lesson Title"
                                    rules={[{ required: true, message: 'Please enter lesson title' }]}
                                >
                                    <Input placeholder="Enter lesson title" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="lessonType"
                                    label="Lesson Type"
                                >
                                    <Select placeholder="Select lesson type">
                                        <Option value="theory">Theory</Option>
                                        <Option value="practical">Practical</Option>
                                        <Option value="case-study">Case Study</Option>
                                        <Option value="interactive">Interactive</Option>
                                        <Option value="assessment">Assessment</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name="lessonDescription"
                            label="Lesson Description"
                            rules={[{ required: true, message: 'Please enter lesson description' }]}
                        >
                            <Input.TextArea rows={3} placeholder="Describe what this lesson covers" />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="duration" label="Duration (minutes)">
                                    <InputNumber min={1} placeholder="15" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="difficulty" label="Difficulty">
                                    <Select placeholder="Select difficulty">
                                        <Option value="beginner">Beginner</Option>
                                        <Option value="intermediate">Intermediate</Option>
                                        <Option value="advanced">Advanced</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Add Lesson
                                </Button>
                                <Button onClick={() => setShowAddLesson(false)}>
                                    Cancel
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            )}

            {/* Create Assessment Modal */}
            {showCreateAssessment && (
                <Card title="Create Assessment" size="small">
                    <Form form={assessmentForm} onFinish={handleCreateAssessment} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="assessmentTitle"
                                    label="Assessment Title"
                                    rules={[{ required: true, message: 'Please enter assessment title' }]}
                                >
                                    <Input placeholder="Enter assessment title" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="assessmentType"
                                    label="Assessment Type"
                                    rules={[{ required: true, message: 'Please select assessment type' }]}
                                >
                                    <Select placeholder="Select assessment type">
                                        <Option value="quiz">Quiz</Option>
                                        <Option value="test">Test</Option>
                                        <Option value="assignment">Assignment</Option>
                                        <Option value="project">Project</Option>
                                        <Option value="final-exam">Final Exam</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="timeLimit" label="Time Limit (minutes)">
                                    <InputNumber min={1} placeholder="30" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="passingScore" label="Passing Score (%)">
                                    <InputNumber min={0} max={100} placeholder="70" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Create Assessment
                                </Button>
                                <Button onClick={() => setShowCreateAssessment(false)}>
                                    Cancel
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </Flexbox>
    );
});

ZEROPortal.displayName = 'ZEROPortal';

export default ZEROPortal;
