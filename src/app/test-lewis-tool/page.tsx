'use client';

import { useState } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { hybridLewisService } from '@/tools/custom-api-tool/hybrid-lewis-service';

const { Title, Text } = Typography;

export default function TestLewisToolPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'client' | 'server'>('client');

  const testLewisTool = async (action: string, _params?: any) => {
    setLoading(true);
    try {
      let result;

      switch (action) {
        case 'getStatesCount':
          result = await hybridLewisService.getStatesCount();
          break;
        case 'getUniqueStates':
          result = await hybridLewisService.getUniqueStates();
          break;
        case 'getCities':
          result = await hybridLewisService.getCities();
          break;
        default:
          result = { success: false, error: 'Unknown action' };
      }

      setResults({ action, result, timestamp: new Date().toISOString() });
    } catch (error) {
      setResults({
        action,
        result: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'client' ? 'server' : 'client');
    // This would normally be set via environment variable
    console.log('Mode toggled to:', mode === 'client' ? 'server' : 'client');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>🧪 Lewis Tool Test Page</Title>

      <Card title="Configuration" style={{ marginBottom: '16px' }}>
        <Space direction="vertical">
          <Text>Current Mode: <strong>{mode}</strong></Text>
          <Text type="secondary">
            {mode === 'client'
              ? 'Using direct database calls (client-side)'
              : 'Using server-side API routes'
            }
          </Text>
          <Button onClick={toggleMode} type="primary">
            Toggle Mode (Client ↔ Server)
          </Button>
        </Space>
      </Card>

      <Card title="Test Actions" style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Button
            onClick={() => testLewisTool('getStatesCount')}
            loading={loading}
            type="primary"
          >
            Test getStatesCount
          </Button>
          <Button
            onClick={() => testLewisTool('getUniqueStates')}
            loading={loading}
          >
            Test getUniqueStates
          </Button>
          <Button
            onClick={() => testLewisTool('getCities')}
            loading={loading}
          >
            Test getCities
          </Button>
        </Space>
      </Card>

      {results && (
        <Card title="Test Results">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Action: {results.action}</Text>
            <Text type="secondary">Timestamp: {results.timestamp}</Text>
            <pre style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(results.result, null, 2)}
            </pre>
          </Space>
        </Card>
      )}
    </div>
  );
}
