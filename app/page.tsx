'use client'

import React, { useRef, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    useReactFlow,
    Node,
    Edge,
    OnConnect,
    Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Sidebar from '../components/Sidebar';
import { DnDProvider, useDnD } from '../components/DnDContext';
import { nanoid } from 'nanoid';
import { CustomCommonNode } from '@/components/CustomCommonNode';
import CustomInputNode from '@/components/CustomInputNode';
import CustomOutputNode from '@/components/CustomOutputNode';

import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Define custom data for nodes
interface CustomNodeData {
    label: string;
    [key: string]: unknown;
}

// Use the Node type from @xyflow/react with our custom data
type CustomNode = Node<CustomNodeData>;

// Use the Edge type from @xyflow/react
type CustomEdge = Edge;

const initialNodes: CustomNode[] = [];

// Replace the existing getId function with this:
const getId = (): string => `dndnode_${nanoid()}`;

const nodeTypes = {
    customInput: CustomInputNode,
    customOutput: CustomOutputNode,
    customCommon: CustomCommonNode,
};

const DnDFlow: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
    const { screenToFlowPosition, getEdges, getNode, updateNode } = useReactFlow();
    const [type] = useDnD();
    const { toast } = useToast();

    const onConnect: OnConnect = useCallback(
        (params: Connection) => {
            const sourceHasConnection = edges.some(edge => edge.source === params.source);
            const targetHasConnection = edges.some(edge => edge.target === params.target);

            if (sourceHasConnection || targetHasConnection) {
                toast({
                    title: "连接限制",
                    description: "当前仅支持每个节点一个连接。",
                    variant: "destructive",
                });
                return;
            }

            setEdges((eds) => addEdge(params, eds));
        },
        [nodes, edges, toast],
    );

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();

            if (!type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode: CustomNode = {
                id: getId(),
                type,
                position,
                data: { label: `${type} node` },
            };

            setNodes((nds) => [...nds, newNode]);
        },
        [screenToFlowPosition, type],
    );

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex-1 p-4">
                <div className="h-[calc(100vh-2rem)] border rounded-lg shadow-sm bg-card" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodeTypes={nodeTypes}
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        fitView
                        className="!bg-gray-100 dark:!bg-gray-900"
                    >
                        {/* <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm" /> */}
                    </ReactFlow>
                </div>
            </div>
            <Toaster />
        </div>
    );
};

const FlowWithProviders: React.FC = () => (
    <ReactFlowProvider>
        <DnDProvider>
            <DnDFlow />
        </DnDProvider>
    </ReactFlowProvider>
);

export default FlowWithProviders;
