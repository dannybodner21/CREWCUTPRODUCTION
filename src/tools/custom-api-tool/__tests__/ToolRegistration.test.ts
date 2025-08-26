import { describe, it, expect } from 'vitest';
import { builtinTools } from '../../index';
import { BuiltinToolsPortals } from '../../portals';
import { createCustomApiToolActions } from '../actions';

describe('Tool Registration', () => {
    describe('Course Builder Tool Registration', () => {
        it('should be registered in builtinTools', () => {
            const courseBuilderTool = builtinTools.find(tool => tool.identifier === 'course-builder');
            expect(courseBuilderTool).toBeDefined();
            expect(courseBuilderTool?.manifest.meta.title).toBe('Course Builder');
            expect(courseBuilderTool?.manifest.meta.avatar).toBe('📚');
        });

        it('should have the correct API endpoints', () => {
            const courseBuilderTool = builtinTools.find(tool => tool.identifier === 'course-builder');
            expect(courseBuilderTool).toBeDefined();

            const apiNames = courseBuilderTool?.manifest.api.map(api => api.name) || [];
            expect(apiNames).toContain('createCourseOutline');
            expect(apiNames).toContain('generateLessonContent');
            expect(apiNames).toContain('createAssessment');
            expect(apiNames).toContain('generateMarketingContent');
            expect(apiNames).toContain('pricingStrategy');
        });

        it('should be registered in BuiltinToolsPortals', () => {
            expect(BuiltinToolsPortals['course-builder']).toBeDefined();
        });
    });

    describe('Tool Actions Availability', () => {
        it('should have all Course Builder actions available', () => {
            const actions = createCustomApiToolActions();

            expect(typeof actions.createCourseOutline).toBe('function');
            expect(typeof actions.generateLessonContent).toBe('function');
            expect(typeof actions.createAssessment).toBe('function');
            expect(typeof actions.generateMarketingContent).toBe('function');
            expect(typeof actions.pricingStrategy).toBe('function');
        });
    });

    describe('Tool Manifest Structure', () => {
        it('should have valid manifest structure', () => {
            const courseBuilderTool = builtinTools.find(tool => tool.identifier === 'course-builder');
            expect(courseBuilderTool).toBeDefined();

            const manifest = courseBuilderTool!.manifest;
            expect(manifest.identifier).toBe('course-builder');
            expect(manifest.type).toBe('builtin');
            expect(manifest.meta.title).toBe('Course Builder');
            expect(manifest.meta.description).toContain('Create comprehensive online course outlines');
            expect(manifest.api).toBeInstanceOf(Array);
            expect(manifest.api.length).toBe(5);
            expect(manifest.systemRole).toContain('Course Builder');
        });
    });
});
