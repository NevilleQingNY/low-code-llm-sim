import React, { useState, useCallback, useRef } from 'react';
import { Handle, Position, useReactFlow, Node, Edge } from '@xyflow/react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { X, Upload } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react'; // 添加这行导入
import ReactMarkdown from 'react-markdown';

import { type CoreMessage, TextPart, ImagePart, CoreUserMessage, CoreAssistantMessage, CoreSystemMessage, CoreToolMessage } from 'ai';
import { readStreamableValue } from 'ai/rsc';
import { continueConversation } from '@/app/actions';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface CustomOutputNodeProps {
    id: string;
    data: {
        name: string;
        label: string;
        prompt?: string; // Add this line to properly type the prompt
        model?: string;  // Add this line to properly type the model
        arr?: Node[];
    };
    isConnectable: boolean;
}

type UploadedImage = {
    name: string;
    base64: string;
};

export const CustomOutputNode: React.FC<CustomOutputNodeProps> = ({ id, data, isConnectable }) => {
    const [connectedNodes, setConnectedNodes] = useState<Node[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');
    const { getNode, getEdges } = useReactFlow();

    const [messages, setMessages] = useState<CoreMessage[]>([]);
    const [answerArr, setAnswerArr] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * 获取并设置连接到当前节点的所有上游节点
     * 同时重置相关状态
     */
    const getConnectNodes = useCallback(() => {
        // 重置所有相关状态
        setAnswerArr([])
        setMessages([])
        setUploadedImages([])
        setAnswerArr([])

        let arr: Node[] = []

        // 从当前节点开始，向上遍历所有连接的节点
        let currentEdge = getEdges().find((edge: Edge) => edge.target === id)
        while (currentEdge) {
            if (getNode(currentEdge?.source as string)) {
                arr.unshift(getNode(currentEdge?.source as string) as Node)
            }
            currentEdge = getEdges().find((edge: Edge) => edge.target === currentEdge?.source)
        }
        if (arr.length > 0) {
            setConnectedNodes(arr)
            setActiveTab(arr[0].id)
        }

    }, [getEdges, getNode, id])


    /**
     * 渲染消息内容，支持文本和图片
     * @param content 消息内容
     */
    const renderMessageContent = (content: CoreMessage['content']) => {
        if (typeof content === 'string') {
            return content;
        } else if (Array.isArray(content)) {
            return content.map((part, index) => {
                if ('text' in part) {
                    return <span key={index}>{(part as TextPart).text}</span>;
                } else if ('image' in part) {
                    return <img key={index} src={String((part as ImagePart).image)} alt="Content image" className="max-w-full h-auto" />;
                }
                return null;
            });
        }
        return JSON.stringify(content); // 为其他可能的类型提供一个后备选项
    };

    const [inputText, setInputText] = useState('');

    /**
     * 处理图片上传
     * @param e 文件输入事件
     */
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) {
                    toast({
                        title: "Error",
                        description: `${file.name} is not an image file.`,
                        variant: "destructive",
                    });
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUploadedImages(prev => [...prev, {
                        name: file.name,
                        base64: reader.result as string
                    }]);
                };
                reader.onerror = () => {
                    toast({
                        title: "Error",
                        description: `Failed to read ${file.name}.`,
                        variant: "destructive",
                    });
                };
                reader.readAsDataURL(file);
            });
        }
    }, []);

    /**
     * 处理图片除
     * @param imgToDelete 要删除的图片
     */
    const handleImageDelete = (imgToDelete: UploadedImage) => {
        setUploadedImages(prev => prev.filter(img => img.name !== imgToDelete.name));
    };

    /**
     * 处理表单提交，发送消息到所有连接的节点并生成回复
     * @param e 表单提交事件
     */
    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!inputText.trim()) {
            toast({
                title: "Error",
                description: "Please enter a message",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true)
        let cur = ''

        for (let node of connectedNodes) {
            let textContent = cur ?
                `前文内容是${cur}, 当前内容是${inputText}`
                : inputText

            let content = uploadedImages.length > 0 ? [
                {
                    type: 'text',
                    text: textContent
                },
                ...uploadedImages.map((img) => ({
                    type: 'image',
                    image: img.base64
                }))
            ] : textContent

            setActiveTab(node.id)
            const systemContent: string = typeof node.data.prompt === 'string' ? node.data.prompt : '总结这部分内容';
            const newMessages: any[] = [
                ...messages,
                {
                    role: 'system',
                    content: systemContent,
                },
                {
                    role: 'user',
                    content
                }
            ];

            setMessages((pre) => [
                ...pre,
                ...newMessages
            ]);
            setInputText('');

            const result = await continueConversation(newMessages, node.data.model as string);

            for await (const content of readStreamableValue(result.message)) {
                setMessages([
                    ...newMessages,
                    {
                        role: 'assistant',
                        content: content as string,
                    },
                ]);
                cur = content as string
            }
            setAnswerArr((pre) => {
                return [
                    ...pre,
                    cur
                ]
            })
        }
        setIsGenerating(false)

    }, [inputText, connectedNodes, uploadedImages, messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Card className="w-[600px] min-h-[600px] flex flex-col resize-y overflow-hidden">
            <CardHeader className="flex-shrink-0">
                <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-lg bg-primary/10 text-primary">Output</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow overflow-hidden">
                <Button onClick={getConnectNodes} className="w-full mb-4 text-lg py-2 flex-shrink-0">
                    Get Connected Nodes
                </Button>
                <div className="flex-grow overflow-hidden flex flex-col">
                    <ScrollArea className="flex-grow">
                        <Card className="mb-4 p-4 bg-muted">
                            <CardContent>
                                {connectedNodes.length > 0 ? (
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                        <ScrollArea className="w-full max-h-[100px]">
                                            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                                {connectedNodes.map((node, index) => (
                                                    <TabsTrigger
                                                        key={index}
                                                        value={node.id}
                                                        className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                                                    >
                                                        {(node.data?.name as string) ?? '未命名'}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                        </ScrollArea>
                                        {connectedNodes.map((node, index) => (
                                            <TabsContent key={index} value={node.id} className="mt-4">
                                                <div className="space-y-4">
                                                    <div className="bg-card p-4 rounded-lg shadow">
                                                        <h3 className="font-semibold mb-2">Current Parameters:</h3>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div className="font-medium">Prompt:</div>
                                                            <div>{node.data.prompt as string || 'Default: Summarize this content'}</div>
                                                            <div className="font-medium">Model:</div>
                                                            <div>{node.data.model as string || 'Default: GPT-4o'}</div>
                                                        </div>
                                                    </div>
                                                    <Separator />
                                                    <div className="prose max-w-none dark:prose-invert">
                                                        <h3 className="text-lg font-semibold mb-2">Generated Content:</h3>
                                                        <div>
                                                            {answerArr.map((n, i) => {
                                                                if (i % connectedNodes.length === index) {
                                                                    return (
                                                                        <div key={i} className="mb-4">
                                                                            <div className="bg-card dark:bg-card-dark p-4 rounded-lg shadow">
                                                                                <ReactMarkdown className="break-words">
                                                                                    {n}
                                                                                </ReactMarkdown>
                                                                            </div>
                                                                            <Separator className="my-4" />
                                                                        </div>
                                                                    )
                                                                }
                                                            })}
                                                        </div>
                                                        {isGenerating && (
                                                            <div>
                                                                <div className="flex items-center space-x-2 text-primary">
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    <span className="text-sm font-medium">Generating...</span>
                                                                </div>
                                                                <div className={cn("whitespace-pre-wrap", { "animate-pulse": isGenerating })}>
                                                                    {messages
                                                                        .filter(m => m.role === 'assistant')
                                                                        .slice(-1)
                                                                        .map((m, i) => (
                                                                            <div key={i}>
                                                                                {renderMessageContent(m.content)}
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        No connected nodes. Click "Get Connected Nodes" to start.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </ScrollArea>

                    <div className="mt-4 space-y-2">
                        <div className="flex space-x-2">
                            <Textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message here..."
                                className="flex-grow"
                            />
                            <Button
                                disabled={connectedNodes.length <= 0 || isGenerating}
                                onClick={(e) => handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)}
                            >
                                Submit
                            </Button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            id="image-upload"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleUploadClick}
                            disabled={isGenerating}
                        >
                            <Upload className="mr-2 h-4 w-4" /> Upload Images
                        </Button>

                        {uploadedImages.length > 0 && (
                            <ScrollArea className="h-[100px] w-full border rounded-md p-2">
                                <div className="flex gap-2">
                                    {uploadedImages.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={img.base64}
                                                alt={img.name}
                                                className="w-16 h-16 rounded-md object-cover"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleImageDelete(img)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </CardContent>
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555', width: '12px', height: '12px' }}
                isConnectable={isConnectable}
            />
        </Card>
    );
};

export default CustomOutputNode;