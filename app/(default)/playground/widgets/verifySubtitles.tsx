import React, { useEffect, useState } from 'react';
import { Button, message, Upload, Card, Typography, Input, Row, Col, Space, Divider } from 'antd';
import { useRequest } from 'ahooks';
import { DownloadOutlined, UploadOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { downloadSubtitles, uploadSubtitles } from '@/app/request/playground';
import { addLogEvent } from '@/app/utils/mitter';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Props {
  onFinish: () => void;
  videoId: string;
}

const VerifySubtitles: React.FC<Props> = ({ onFinish, videoId }) => {
  const [srtContent, setSrtContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');

  // Download current SRT file
  const { run: downloadSrtRun, loading: downloadLoading } = useRequest(
    () => downloadSubtitles(videoId),
    {
      manual: true,
      onBefore: () => {
        addLogEvent('正在下载中文字幕文件...');
      },
      onSuccess: (data) => {
        setSrtContent(data);
        setOriginalContent(data);
        addLogEvent('中文字幕下载成功');
        message.success('字幕文件下载成功');
      },
      onError: (error) => {
        addLogEvent(`下载字幕失败: ${error.message}`);
        message.error('下载字幕文件失败，请检查是否已生成中文字幕');
      },
    },
  );

  // Upload modified SRT file
  const { run: uploadSrtRun, loading: uploadLoading } = useRequest(
    (content: string) => uploadSubtitles(videoId, content),
    {
      manual: true,
      onBefore: () => {
        addLogEvent('正在上传修改后的字幕...');
      },
      onSuccess: () => {
        setOriginalContent(srtContent);
        addLogEvent('字幕更新成功');
        message.success('字幕已成功更新');
      },
      onError: (error) => {
        addLogEvent(`上传字幕失败: ${error.message}`);
        message.error('上传字幕失败，请检查格式是否正确');
      },
    },
  );

  // Load SRT on component mount
  useEffect(() => {
    if (videoId) {
      downloadSrtRun();
    }
  }, [videoId]);

  // Check if content has been modified
  const hasChanges = srtContent !== originalContent;

  // Parse SRT for display
  const parseSrtForPreview = (content: string) => {
    if (!content.trim()) return [];
    
    const blocks = content.trim().split('\n\n');
    return blocks.map((block, index) => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        return {
          id: lines[0],
          timestamp: lines[1],
          text: lines.slice(2).join('\n'),
        };
      }
      return null;
    }).filter(Boolean);
  };

  const srtBlocks = parseSrtForPreview(srtContent);

  const handleSave = () => {
    if (!srtContent.trim()) {
      message.error('字幕内容不能为空');
      return;
    }
    uploadSrtRun(srtContent);
  };

  const handleReset = () => {
    setSrtContent(originalContent);
    message.info('已重置为原始内容');
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSrtContent(content);
      message.success('文件上传成功');
    };
    reader.readAsText(file, 'utf-8');
    return false; // Prevent default upload
  };

  const handleDownload = () => {
    if (!srtContent) {
      message.error('没有可下载的字幕内容');
      return;
    }
    
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${videoId}_zh_verified.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLogEvent('字幕文件已下载');
    message.success('字幕文件已下载');
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={4}>校验字幕</Title>
        <Text type="secondary">
          您可以在此处查看、编辑和重新上传翻译后的中文字幕。支持直接在线编辑或上传SRT文件。
        </Text>
        
        <Divider />
        
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={downloadSrtRun} 
                loading={downloadLoading}
              >
                重新加载字幕
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleDownload}
                disabled={!srtContent}
              >
                下载SRT文件
              </Button>
              <Upload
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept=".srt"
              >
                <Button icon={<UploadOutlined />}>
                  上传SRT文件
                </Button>
              </Upload>
            </Space>
          </Col>
          
          <Col span={24}>
            <Text strong>字幕编辑器：</Text>
            <TextArea
              value={srtContent}
              onChange={(e) => setSrtContent(e.target.value)}
              placeholder="字幕内容将在这里显示，您可以直接编辑..."
              rows={15}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Col>
          
          {srtBlocks.length > 0 && (
            <Col span={24}>
              <Text strong>字幕预览：</Text>
              <div style={{ 
                maxHeight: '300px', 
                overflow: 'auto', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: '#fafafa'
              }}>
                {srtBlocks.map((block: any, index) => (
                  <div key={index} style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
                    <Text code style={{ fontSize: '11px' }}>{block.id}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>{block.timestamp}</Text>
                    <br />
                    <Text>{block.text}</Text>
                  </div>
                ))}
              </div>
            </Col>
          )}
          
          <Col span={24}>
            <Space>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={uploadLoading}
                disabled={!hasChanges || !srtContent.trim()}
              >
                保存修改
              </Button>
              <Button 
                onClick={handleReset}
                disabled={!hasChanges}
              >
                重置修改
              </Button>
              <Button 
                type="primary" 
                onClick={onFinish}
                style={{ marginLeft: 'auto' }}
              >
                确认完成，进入下一步
              </Button>
            </Space>
            {hasChanges && (
              <div style={{ marginTop: '8px' }}>
                <Text type="warning" style={{ fontSize: '12px' }}>
                  ⚠️ 您有未保存的修改
                </Text>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default VerifySubtitles;