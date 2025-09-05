import { memo, useState } from 'react';
import {
    Card,
    Select,
    Input,
    Button,
    Row,
    Col,
    Space,
    Divider,
    Form,
    InputNumber,
    List,
    Tag,
    Typography,
    Table,
    Checkbox,
    message,
    Tabs,
    Collapse,
    Steps,
    Progress,
    Alert
} from 'antd';
import { createStyles } from 'antd-style';
import {
    BookOpen,
    GraduationCap,
    Target,
    Clock,
    Users,
    Video,
    FileText,
    CheckCircle,
    Star,
    DollarSign,
    TrendingUp,
    Lightbulb
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { BuiltinPortalProps } from '@/types/tool';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;

const useStyles = createStyles(({ token }) => ({
    headerCard: {
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryHover} 100%)`,
        color: 'white',
        marginBottom: token.marginLG,
    },
    featureCard: {
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: token.boxShadowSecondary,
            transform: 'translateY(-2px)',
        },
    },
    moduleCard: {
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        marginBottom: token.marginSM,
    },
    lessonCard: {
        backgroundColor: token.colorBgLayout,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        marginBottom: token.marginXS,
    },
    assessmentCard: {
        backgroundColor: token.colorSuccessBg,
        border: `1px solid ${token.colorSuccessBorder}`,
        borderRadius: token.borderRadius,
    },
    marketingCard: {
        backgroundColor: token.colorInfoBg,
        border: `1px solid ${token.colorInfoBorder}`,
        borderRadius: token.borderRadius,
    },
    pricingCard: {
        backgroundColor: token.colorWarningBg,
        border: `1px solid ${token.colorWarningBorder}`,
        borderRadius: token.borderRadius,
    },
    statCard: {
        textAlign: 'center',
        padding: token.paddingLG,
    },
    iconLarge: {
        fontSize: 48,
        color: token.colorPrimary,
        marginBottom: token.marginMD,
    },
    tag: {
        margin: token.marginXS,
        borderRadius: token.borderRadius,
    },
    stepIcon: {
        fontSize: 24,
        color: token.colorPrimary,
    },
}));

interface CourseBuilderPortalProps extends BuiltinPortalProps { }

const CourseBuilderPortal = memo<CourseBuilderPortalProps>(({ identifier: _identifier }) => { // _identifier commented out - unused but preserved
    const { styles } = useStyles();
    // const { t: _t } = useTranslation(); // commented out - unused but preserved
    const [activeTab, setActiveTab] = useState('overview');
    const [courseData, setCourseData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleCreateCourse = async (values: any) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise<void>(resolve => {
                setTimeout(resolve, 2000);
            });

            const mockCourseData = {
                title: `${values.subject} Course`,
                subject: values.subject,
                level: values.level,
                duration: values.duration,
                targetAudience: values.targetAudience || 'General learners',
                format: values.format,
                modules: [
                    {
                        title: 'Introduction to ' + values.subject,
                        description: 'Get started with the fundamentals',
                        lessons: ['Overview', 'Key Concepts', 'Getting Started'],
                        duration: '1 week'
                    },
                    {
                        title: 'Core Concepts',
                        description: 'Master the essential principles',
                        lessons: ['Theory', 'Practice', 'Examples'],
                        duration: '2 weeks'
                    },
                    {
                        title: 'Advanced Applications',
                        description: 'Apply your knowledge to real scenarios',
                        lessons: ['Case Studies', 'Projects', 'Best Practices'],
                        duration: '1 week'
                    }
                ],
                learningObjectives: values.learningGoals || [
                    `Understand the fundamental concepts of ${values.subject}`,
                    `Apply basic principles in practical scenarios`,
                    `Develop confidence in using ${values.subject} tools and techniques`
                ],
                prerequisites: ['No prior experience required', 'Basic computer literacy', 'Willingness to learn'],
                estimatedHours: 20,
                certification: 'Completion Certificate'
            };

            setCourseData(mockCourseData);
            message.success('Course outline created successfully!');
        } catch (error) {
            message.error('Failed to create course outline');
        } finally {
            setLoading(false);
        }
    };

    const renderOverview = () => (
        <div>
            <Card className={styles.headerCard}>
                <Row gutter={[24, 16]} align="middle">
                    <Col>
                        <BookOpen size={64} color="white" />
                    </Col>
                    <Col flex="auto">
                        <Title level={2} style={{ color: 'white', margin: 0 }}>
                            Course Builder
                        </Title>
                        <Text style={{ color: 'white', fontSize: 16 }}>
                            Create comprehensive online course outlines and lesson plans for any subject
                        </Text>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className={styles.featureCard} title="Course Outline Creation">
                        <Flexbox align="center" gap={16}>
                            <GraduationCap size={32} className={styles.iconLarge} />
                            <div>
                                <Title level={4}>Structured Learning</Title>
                                <Text>Design comprehensive course frameworks with clear learning objectives</Text>
                            </div>
                        </Flexbox>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className={styles.featureCard} title="Lesson Content Generation">
                        <Flexbox align="center" gap={16}>
                            <FileText size={32} className={styles.iconLarge} />
                            <div>
                                <Title level={4}>Detailed Plans</Title>
                                <Text>Create lesson plans with activities, resources, and assessments</Text>
                            </div>
                        </Flexbox>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className={styles.featureCard} title="Assessment Development">
                        <Flexbox align="center" gap={16}>
                            <CheckCircle size={32} className={styles.iconLarge} />
                            <div>
                                <Title level={4}>Evaluation Tools</Title>
                                <Text>Design various types of evaluations and assessments</Text>
                            </div>
                        </Flexbox>
                    </Card>
                </Col>
            </Row>

            <Divider />

            <Card title="Quick Start Guide">
                <Steps direction="vertical" size="small">
                    <Step
                        title="Define Your Course"
                        description="Specify the subject, level, and target audience"
                        icon={<Target className={styles.stepIcon} />}
                    />
                    <Step
                        title="Generate Outline"
                        description="Create a comprehensive course structure with modules and lessons"
                        icon={<BookOpen className={styles.stepIcon} />}
                    />
                    <Step
                        title="Add Content"
                        description="Generate detailed lesson plans and activities"
                        icon={<FileText className={styles.stepIcon} />}
                    />
                    <Step
                        title="Create Assessments"
                        description="Design quizzes, projects, and evaluations"
                        icon={<CheckCircle className={styles.stepIcon} />}
                    />
                    <Step
                        title="Marketing & Pricing"
                        description="Generate promotional content and pricing strategies"
                        icon={<TrendingUp className={styles.stepIcon} />}
                    />
                </Steps>
            </Card>
        </div>
    );

    const renderCourseCreator = () => (
        <Card title="Create New Course">
            <Form layout="vertical" onFinish={handleCreateCourse}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Course Subject"
                            name="subject"
                            rules={[{ required: true, message: 'Please enter the course subject' }]}
                        >
                            <Input
                                placeholder="e.g., JavaScript Programming, Digital Marketing, Photography"
                                prefix={<BookOpen size={16} />}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Skill Level"
                            name="level"
                            initialValue="beginner"
                        >
                            <Select>
                                <Option value="beginner">Beginner</Option>
                                <Option value="intermediate">Intermediate</Option>
                                <Option value="advanced">Advanced</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Duration"
                            name="duration"
                        >
                            <Input
                                placeholder="e.g., 4 weeks, 8 hours, 12 modules"
                                prefix={<Clock size={16} />}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Content Format"
                            name="format"
                            initialValue="mixed"
                        >
                            <Select>
                                <Option value="video">Video</Option>
                                <Option value="text">Text</Option>
                                <Option value="interactive">Interactive</Option>
                                <Option value="mixed">Mixed</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item
                            label="Target Audience"
                            name="targetAudience"
                        >
                            <Input
                                placeholder="e.g., Working professionals, College students, Small business owners"
                                prefix={<Users size={16} />}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item
                            label="Learning Goals"
                            name="learningGoals"
                        >
                            <TextArea
                                rows={3}
                                placeholder="Enter specific learning objectives (one per line)"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24}>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                size="large"
                                icon={<BookOpen size={16} />}
                            >
                                Create Course Outline
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );

    const renderCourseDisplay = () => {
        if (!courseData) return null;

        return (
            <div>
                <Card
                    title="Course Outline"
                    extra={
                        <Space>
                            <Tag color="blue">{courseData.level}</Tag>
                            <Tag color="green">{courseData.duration}</Tag>
                            <Tag color="orange">{courseData.format}</Tag>
                        </Space>
                    }
                >
                    <Row gutter={[24, 16]}>
                        <Col xs={24} md={16}>
                            <Title level={3}>{courseData.title}</Title>
                            <Paragraph>
                                <strong>Target Audience:</strong> {courseData.targetAudience}
                            </Paragraph>
                            <Paragraph>
                                <strong>Estimated Hours:</strong> {courseData.estimatedHours} hours
                            </Paragraph>
                            <Paragraph>
                                <strong>Certification:</strong> {courseData.certification}
                            </Paragraph>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card className={styles.statCard}>
                                <BookOpen className={styles.iconLarge} />
                                <Title level={2}>{courseData.modules.length}</Title>
                                <Text>Modules</Text>
                            </Card>
                        </Col>
                    </Row>

                    <Divider />

                    <Title level={4}>Learning Objectives</Title>
                    <List
                        dataSource={courseData.learningObjectives}
                        renderItem={(objective: string) => (
                            <List.Item>
                                <CheckCircle size={16} style={{ color: '#52c41a', marginRight: 8 }} />
                                {objective}
                            </List.Item>
                        )}
                    />

                    <Divider />

                    <Title level={4}>Prerequisites</Title>
                    <List
                        dataSource={courseData.prerequisites}
                        renderItem={(prerequisite: string) => (
                            <List.Item>
                                <Star size={16} style={{ color: '#faad14', marginRight: 8 }} />
                                {prerequisite}
                            </List.Item>
                        )}
                    />

                    <Divider />

                    <Title level={4}>Course Modules</Title>
                    <Collapse>
                        {courseData.modules.map((module: any, index: number) => (
                            <Panel
                                header={
                                    <Space>
                                        <Tag color="blue">Module {index + 1}</Tag>
                                        {module.title}
                                        <Tag color="green">{module.duration}</Tag>
                                    </Space>
                                }
                                key={index}
                            >
                                <Paragraph>{module.description}</Paragraph>
                                <Title level={5}>Lessons:</Title>
                                <List
                                    dataSource={module.lessons}
                                    renderItem={(lesson: string) => (
                                        <List.Item>
                                            <FileText size={14} style={{ marginRight: 8 }} />
                                            {lesson}
                                        </List.Item>
                                    )}
                                />
                            </Panel>
                        ))}
                    </Collapse>
                </Card>
            </div>
        );
    };

    const renderTools = () => (
        <div>
            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card
                        title="Lesson Content Generator"
                        className={styles.lessonCard}
                        extra={<FileText size={16} />}
                    >
                        <Paragraph>
                            Generate detailed lesson plans with activities, resources, and assessments.
                        </Paragraph>
                        <Button type="primary" block>
                            Generate Lesson Content
                        </Button>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        title="Assessment Creator"
                        className={styles.assessmentCard}
                        extra={<CheckCircle size={16} />}
                    >
                        <Paragraph>
                            Create quizzes, tests, or project-based assessments for course evaluation.
                        </Paragraph>
                        <Button type="primary" block>
                            Create Assessment
                        </Button>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        title="Marketing Content"
                        className={styles.marketingCard}
                        extra={<TrendingUp size={16} />}
                    >
                        <Paragraph>
                            Generate compelling marketing materials to promote your course.
                        </Paragraph>
                        <Button type="primary" block>
                            Generate Marketing Content
                        </Button>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        title="Pricing Strategy"
                        className={styles.pricingCard}
                        extra={<DollarSign size={16} />}
                    >
                        <Paragraph>
                            Develop pricing strategies and revenue models for your course.
                        </Paragraph>
                        <Button type="primary" block>
                            Generate Pricing Strategy
                        </Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    return (
        <div style={{ padding: 24 }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Overview" key="overview">
                    {renderOverview()}
                </TabPane>
                <TabPane tab="Create Course" key="create">
                    {renderCourseCreator()}
                    {courseData && renderCourseDisplay()}
                </TabPane>
                <TabPane tab="Tools" key="tools">
                    {renderTools()}
                </TabPane>
            </Tabs>
        </div>
    );
});

CourseBuilderPortal.displayName = 'CourseBuilderPortal';

export default CourseBuilderPortal;
