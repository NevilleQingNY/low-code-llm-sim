import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Textarea } from "@/components/ui/textarea"; // 替换 Input 导入
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from './ui/input';
import { AIModel } from '@/types';

interface CustomInputNodeProps {
  data: {
    label: string;
    initialModel?: string;
    initialPrompt?: string;
  };
  id: string;
  isConnectable: boolean;
}

interface NodeData {
  name: string;
  model: string;
  prompt: string;
}

export const CustomCommonNode: React.FC<CustomInputNodeProps> = ({ data, isConnectable, id }) => {
  const { updateNode } = useReactFlow();
  const [nodeData, setNodeData] = useState<NodeData>({
    name: '',  // 初始名称为空
    model: data.initialModel || '',
    prompt: data.initialPrompt || '',
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 组件挂载后，让名称输入框获得焦点
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    updateNode(id, { data: { ...data, ...nodeData } });
  }, [nodeData]);

  const updateNodeData = useCallback((update: Partial<NodeData>) => {
    setNodeData(prevData => ({ ...prevData, ...update }));
  }, []);

  const handleNameInputKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();  // 阻止事件冒泡
  };

  return (
    <Card className="w-96 min-h-[250px] shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          <Input
            ref={nameInputRef}
            value={nodeData.name}
            onChange={(e) => updateNodeData({ name: e.target.value })}
            onKeyDown={handleNameInputKeyDown}
            placeholder="Node Name"
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`model-select-${id}`} className="text-sm font-medium">AI Model</Label>
          <Select
            value={nodeData.model}
            onValueChange={(value) => updateNodeData({ model: value })}
          >
            <SelectTrigger id={`model-select-${id}`} className="w-full">
              <SelectValue placeholder="Select an AI model" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AIModel).map(([label, value]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`prompt-input-${id}`} className="text-sm font-medium">Prompt</Label>
          <Textarea
            id={`prompt-input-${id}`}
            placeholder="Enter your prompt"
            value={nodeData.prompt}
            onChange={(e) => updateNodeData({ prompt: e.target.value })}
            className="min-h-[100px] resize-y"
          />
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', width: '12px', height: '12px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', width: '12px', height: '12px' }}
        isConnectable={isConnectable}
      />
    </Card>
  );
};

export default CustomCommonNode;
