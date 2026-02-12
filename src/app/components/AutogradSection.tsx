"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { Highlight } from "prism-react-renderer";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const autogradCode = `class Value:
    """Stores a scalar value and its gradient, as a node in a computation graph."""
    
    def __init__(self, data, children=(), local_grads=()):
        self.data = data                # forward pass value
        self.grad = 0                   # backward pass gradient
        self._children = children       # child nodes
        self._local_grads = local_grads # local derivatives

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data + other.data, (self, other), (1, 1))

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data * other.data, (self, other), (other.data, self.data))

    def backward(self):
        # Topological sort of computation graph
        topo = []
        visited = set()
        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._children:
                    build_topo(child)
                topo.append(v)
        
        build_topo(self)
        self.grad = 1  # gradient of output w.r.t. itself
        
        # Backward pass: chain rule in reverse topological order
        for v in reversed(topo):
            for child, local_grad in zip(v._children, v._local_grads):
                child.grad += local_grad * v.grad`;

interface ComputationNode extends Node {
  data: {
    label: string;
    value: number;
    grad: number;
    operation?: string;
  };
}

// Custom node component
function ValueNode({ data }: { data: ComputationNode['data'] }) {
  return (
    <motion.div
      className="bg-stone-800 border-2 border-amber-500 rounded-lg p-4 min-w-[120px] shadow-lg"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="text-center space-y-2">
        <div className="text-amber-300 font-mono text-sm font-bold">
          {data.label}
        </div>
        {data.operation && (
          <div className="text-stone-400 text-xs">
            {data.operation}
          </div>
        )}
        <div className="border-t border-stone-600 pt-2 space-y-1">
          <div className="text-amber-50 font-mono text-sm">
            data: {data.value.toFixed(2)}
          </div>
          <div className="text-orange-300 font-mono text-sm">
            grad: {data.grad.toFixed(2)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const nodeTypes = {
  valueNode: ValueNode,
};

export function AutogradSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [nodes, setNodes, onNodesChange] = useNodesState<ComputationNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Example: a = 2, b = 3, c = a + b, d = c * 2
  const buildGraph = useCallback(() => {
    const a = 2;
    const b = 3;
    const c = a + b; // 5
    const d = c * 2; // 10

    const initialNodes: ComputationNode[] = [
      {
        id: 'a',
        type: 'valueNode',
        position: { x: 100, y: 200 },
        data: { label: 'a', value: a, grad: 0 },
        sourcePosition: Position.Right,
      },
      {
        id: 'b',
        type: 'valueNode',
        position: { x: 100, y: 350 },
        data: { label: 'b', value: b, grad: 0 },
        sourcePosition: Position.Right,
      },
      {
        id: 'c',
        type: 'valueNode',
        position: { x: 400, y: 275 },
        data: { label: 'c', value: c, grad: 0, operation: 'a + b' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
      {
        id: 'd',
        type: 'valueNode',
        position: { x: 700, y: 275 },
        data: { label: 'd', value: d, grad: 0, operation: 'c * 2' },
        targetPosition: Position.Left,
      },
    ];

    const initialEdges: Edge[] = [
      { id: 'a-c', source: 'a', target: 'c', animated: false, style: { stroke: '#f59e0b' } },
      { id: 'b-c', source: 'b', target: 'c', animated: false, style: { stroke: '#f59e0b' } },
      { id: 'c-d', source: 'c', target: 'd', animated: false, style: { stroke: '#f59e0b' } },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges]);

  const animateBackward = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Start with d.grad = 1 (output gradient)
    setNodes(nodes => nodes.map(node => 
      node.id === 'd' 
        ? { ...node, data: { ...node.data, grad: 1 } }
        : node
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // d = c * 2, so c.grad += 1 * 2 = 2
    setNodes(nodes => nodes.map(node => 
      node.id === 'c' 
        ? { ...node, data: { ...node.data, grad: 2 } }
        : node
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // c = a + b, so a.grad += 2 * 1 = 2, b.grad += 2 * 1 = 2
    setNodes(nodes => nodes.map(node => {
      if (node.id === 'a' || node.id === 'b') {
        return { ...node, data: { ...node.data, grad: 2 } };
      }
      return node;
    }));

    setIsAnimating(false);
  }, [nodes, isAnimating, setNodes]);

  const resetGraph = useCallback(() => {
    setNodes(nodes => nodes.map(node => ({
      ...node,
      data: { ...node.data, grad: 0 }
    })));
  }, [setNodes]);

  useEffect(() => {
    buildGraph();
  }, [buildGraph]);

  return (
    <section id="autograd" ref={ref} className="min-h-screen py-20 px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="space-y-16"
        >
          {/* Section header */}
          <div className="text-center space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl font-bold"
            >
              <span className="text-amber-400">The Autograd Engine</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-stone-400 max-w-4xl mx-auto"
            >
              The heart of neural networks - automatic differentiation tracks every operation
              to compute gradients via the chain rule. This is how the model learns.
            </motion.p>
          </div>

          <div className="grid xl:grid-cols-2 gap-12">
            {/* Code explanation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-amber-300">The Value Class</h3>
              
              <div className="bg-stone-900/50 border border-stone-700 rounded-lg overflow-hidden">
                <div className="bg-stone-800/50 px-4 py-2 border-b border-stone-700">
                  <span className="text-amber-400 font-mono text-sm">Value class implementation</span>
                </div>
                <div className="p-4 font-mono text-sm overflow-x-auto">
                  <Highlight
                    language="python"
                    code={autogradCode}
                    theme={{
                      plain: { backgroundColor: 'transparent', color: '#fef3c7' },
                      styles: [
                        { types: ['keyword'], style: { color: '#f59e0b' }},
                        { types: ['string'], style: { color: '#84cc16' }},
                        { types: ['number'], style: { color: '#06b6d4' }},
                        { types: ['comment'], style: { color: '#6b7280', fontStyle: 'italic' }},
                        { types: ['function'], style: { color: '#8b5cf6' }},
                        { types: ['operator'], style: { color: '#f59e0b' }},
                        { types: ['punctuation'], style: { color: '#a8a29e' }},
                      ]
                    }}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre className={className} style={{ ...style, background: 'transparent', margin: 0, padding: 0 }}>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-stone-800/30 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-stone-300">
                    <strong className="text-amber-400">Key Insight:</strong> Each Value stores its data 
                    (forward pass) and gradient (backward pass). Operations create new nodes with 
                    local gradients, building a computation graph automatically.
                  </p>
                </div>
                
                <div className="bg-stone-800/20 border border-stone-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-amber-300 mb-2">How it works:</h4>
                  <ul className="space-y-2 text-stone-300 text-sm">
                    <li>• <strong>Forward pass:</strong> Compute values, build graph</li>
                    <li>• <strong>Backward pass:</strong> Chain rule in reverse order</li>
                    <li>• <strong>Local gradients:</strong> ∂f/∂x for each operation</li>
                    <li>• <strong>Accumulation:</strong> Add gradients from multiple paths</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Interactive computation graph */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-amber-300">Interactive Computation Graph</h3>
              
              <div className="bg-stone-900/30 border border-stone-700 rounded-lg overflow-hidden">
                <div className="bg-stone-800/50 px-4 py-3 border-b border-stone-700 flex justify-between items-center">
                  <span className="text-amber-400 font-mono text-sm">
                    Example: d = (a + b) * 2
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={resetGraph}
                      className="px-3 py-1 text-xs bg-stone-700 text-stone-300 rounded hover:bg-stone-600 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={animateBackward}
                      disabled={isAnimating}
                      className="px-3 py-1 text-xs bg-amber-500 text-stone-900 rounded hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      {isAnimating ? 'Running...' : 'Run Backward Pass'}
                    </button>
                  </div>
                </div>
                
                <div className="h-[400px] bg-stone-950/50">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                  >
                    <Background color="#44403c" gap={20} />
                    <Controls />
                  </ReactFlow>
                </div>
              </div>

              <div className="text-sm text-stone-400 space-y-2">
                <p><strong className="text-amber-300">Forward pass:</strong> a=2, b=3 → c=5 → d=10</p>
                <p><strong className="text-amber-300">Backward pass:</strong> d.grad=1 → c.grad=2 → a.grad=2, b.grad=2</p>
                <p className="text-xs">Click "Run Backward Pass" to see gradients flow through the graph!</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}