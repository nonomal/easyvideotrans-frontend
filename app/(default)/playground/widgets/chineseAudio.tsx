import React, { useEffect } from 'react';
import { Button, Form, Input, message, Select } from 'antd';
import { useReactive, useRequest } from 'ahooks';
import { generateTTS } from '@/app/request/playground';
import { IGenerateTTSProp } from '@/app/type';
import { addLogEvent } from '@/app/utils/mitter';
import { TRANSLATE_OPTIONS } from '@/app/const/translate_option';
import { OPENAI_VOICE_OPTIONS, OPENAI_MODEL_OPTIONS } from '@/app/const/openai_voices';

interface Props {
  onFinish: () => void;
  videoId: string;
}

// Extended form type to include OpenAI-specific fields
interface FormValues extends IGenerateTTSProp {
  openai_voice?: string;
  openai_model?: string;
  openai_instructions?: string;
}

const ChineseAudio: React.FC<Props> = ({ onFinish, videoId }) => {
  const [form] = Form.useForm<FormValues>();

  const state = useReactive({
    translateSrtOk: false,
    selectedVendor: 'openai', // Default to OpenAI TTS
  });

  const { run: generateTTSRun, loading: generateTTSLoading } = useRequest(
    (data: IGenerateTTSProp) => generateTTS(data),
    {
      manual: true,
      onBefore: () => {
        addLogEvent('开始配音');
      },
      onSuccess: () => {
        state.translateSrtOk = true;
        message.success('配音成功');
        addLogEvent('配音成功');
      },
      onError: () => {
        message.error('配音失败，请检查参数');
        addLogEvent('配音失败，请检查参数');
      },
    },
  );

  const handleGenerateTTS = async () => {
    const formValues = form.getFieldsValue() as any; // Type assertion to handle form values
    const { tts_vendor, tts_key, tts_character, openai_voice, openai_model, openai_instructions } = formValues;

    const data: IGenerateTTSProp = {
      video_id: videoId,
      tts_vendor,
      tts_key: tts_key || '', // Only used for Edge TTS if needed
      tts_character: tts_character || '',
    };

    // Add OpenAI-specific parameters if OpenAI vendor is selected
    if (tts_vendor === 'openai') {
      data.tts_params = {
        voice: openai_voice || 'alloy',
        model: openai_model || 'tts-1',
        instructions: openai_instructions || undefined,
      };
    }

    generateTTSRun(data);
  };

  const handleVendorChange = (vendor: string) => {
    state.selectedVendor = vendor;
    // Clear form fields when changing vendor
    if (vendor === 'openai') {
      form.setFieldsValue({
        tts_character: '', // Clear Edge TTS character when switching to OpenAI
        openai_voice: 'alloy', // Set default OpenAI voice
        openai_model: 'tts-1', // Set default OpenAI model
      });
    } else {
      form.setFieldsValue({
        tts_character: 'zh-CN-XiaoyiNeural', // Set default Edge TTS character
      });
    }
  };

  useEffect(() => {
    form.setFieldValue('videoId', videoId);
    // Initialize vendor state from form initial values
    state.selectedVendor = 'openai';
  }, [videoId]);

  return (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{
        videoId,
        tts_vendor: 'openai', // Default to OpenAI
        tts_key: '',
        tts_character: 'zh-CN-XiaoyiNeural',
        openai_voice: 'alloy',
        openai_model: 'tts-1',
        openai_instructions: '',
      }}
      onSubmitCapture={onFinish}
    >
      <Form.Item label="视频ID" name={'videoId'}>
        <Input disabled value={videoId} />
      </Form.Item>
      <Form.Item label={'TTS Vendor'}>
        <Form.Item
          name="tts_vendor"
          style={{ display: 'inline-block', width: '200px' }}
        >
          <Select
            placeholder="选择TTS vendor"
            onChange={handleVendorChange}
            options={[
              { value: 'openai', label: 'OpenAI TTS (推荐)' },
              { value: 'edge', label: 'Microsoft Edge TTS (已弃用)' }
            ]}
          />
        </Form.Item>
      </Form.Item>

      {/* Edge TTS Configuration */}
      {state.selectedVendor === 'edge' && (
        <>
          <Form.Item label={'注意'}>
            <div style={{ color: '#ff4d4f', marginBottom: '10px' }}>
              ⚠️ Edge TTS 已弃用，建议使用 OpenAI TTS 获得更好的语音质量
            </div>
          </Form.Item>
          <Form.Item label={'Edge Character'}>
            <Form.Item name="tts_character">
              <Select placeholder="选择Edge TTS角色" options={TRANSLATE_OPTIONS} />
            </Form.Item>
          </Form.Item>
        </>
      )}

      {/* OpenAI TTS Configuration */}
      {state.selectedVendor === 'openai' && (
        <>
          <Form.Item label={'OpenAI Voice'}>
            <Form.Item name="openai_voice">
              <Select placeholder="选择OpenAI语音" options={OPENAI_VOICE_OPTIONS} />
            </Form.Item>
          </Form.Item>
          <Form.Item label={'OpenAI Model'}>
            <Form.Item name="openai_model">
              <Select placeholder="选择OpenAI模型" options={OPENAI_MODEL_OPTIONS} />
            </Form.Item>
          </Form.Item>
          <Form.Item label={'Voice Instructions'} name="openai_instructions">
            <Input.TextArea 
              placeholder="可选：语音指令，如'Speak in a cheerful and positive tone'"
              rows={2}
            />
          </Form.Item>
        </>
      )}

      {/* Only show API key field for Edge TTS */}
      {state.selectedVendor === 'edge' && (
        <Form.Item label="Key" name={'tts_key'}>
          <Input placeholder="密钥（Edge TTS可选）" />
        </Form.Item>
      )}
      <Form.Item label={'生成TTS'}>
        <Button
          type="primary"
          onClick={handleGenerateTTS}
          loading={generateTTSLoading}
        >
          生成
        </Button>
        {state.translateSrtOk && (
          <Button type="link" target={'_blank'} href={`/api/tts/${videoId}`}>
            下载TTS
          </Button>
        )}
      </Form.Item>
      <Form.Item label={'进入下一步'}>
        <Button
          type="primary"
          htmlType="submit"
          disabled={!state.translateSrtOk}
        >
          GO
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ChineseAudio;
