"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Highlight } from "prism-react-renderer";

const dataCode = `# Let there be an input dataset \`docs\`: list[str] of documents
if not os.path.exists('input.txt'):
    import urllib.request
    names_url = 'https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt'
    urllib.request.urlretrieve(names_url, 'input.txt')
docs = [l.strip() for l in open('input.txt').read().strip().split('\\n') if l.strip()]
random.shuffle(docs)

# Let there be a Tokenizer to translate strings to discrete symbols and back
uchars = sorted(set(''.join(docs))) # unique characters become token ids 0..n-1  
BOS = len(uchars) # special Beginning of Sequence token
vocab_size = len(uchars) + 1 # total vocabulary size`;

const sampleNames = ["emma", "olivia", "ava", "isabella", "sophia", "charlotte", "mia", "amelia"];

export function DataSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [inputName, setInputName] = useState("");
  const [tokens, setTokens] = useState<number[]>([]);
  
  // Simulate tokenization (simplified)
  const charset = "abcdefghijklmnopqrstuvwxyz";
  const BOS_TOKEN = charset.length;
  
  const tokenizeName = (name: string) => {
    const tokens = [BOS_TOKEN]; // BOS token
    for (const char of name.toLowerCase()) {
      const idx = charset.indexOf(char);
      if (idx !== -1) tokens.push(idx);
    }
    tokens.push(BOS_TOKEN); // BOS token at end
    return tokens;
  };

  const handleNameInput = (name: string) => {
    setInputName(name);
    if (name.trim()) {
      setTokens(tokenizeName(name.trim()));
    } else {
      setTokens([]);
    }
  };

  return (
    <section id="data" ref={ref} className="min-h-screen py-20 px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
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
              <span style={{ color: 'var(--accent-bright)' }}>The Data</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl max-w-3xl mx-auto"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Every AI model starts with data. MicroGPT learns from a simple dataset of names,
              converting each character into discrete tokens that the model can understand.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Code explanation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 
                className="text-2xl font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                Loading & Tokenization
              </h3>
              
              <div 
                className="rounded-lg overflow-hidden"
                style={{
                  background: `color-mix(in srgb, var(--code-bg) 50%, transparent)`,
                  border: `1px solid var(--border)`,
                }}
              >
                <div 
                  className="px-4 py-2"
                  style={{
                    background: `color-mix(in srgb, var(--code-bg) 80%, var(--muted))`,
                    borderBottom: `1px solid var(--border)`,
                  }}
                >
                  <span 
                    className="font-mono text-sm"
                    style={{ color: 'var(--accent-bright)' }}
                  >
                    microgpt.py
                  </span>
                </div>
                <div className="p-4 font-mono text-sm overflow-x-auto">
                  <Highlight
                    language="python"
                    code={dataCode}
                    theme={{
                      plain: { backgroundColor: 'transparent' },
                      styles: [
                        { types: ['keyword'], style: { color: 'var(--accent)' }},
                        { types: ['string'], style: { color: '#84cc16' }},
                        { types: ['number'], style: { color: '#06b6d4' }},
                        { types: ['comment'], style: { color: 'var(--muted-foreground)', fontStyle: 'italic' }},
                        { types: ['function'], style: { color: '#8b5cf6' }},
                        { types: ['operator'], style: { color: 'var(--accent)' }},
                        { types: ['punctuation'], style: { color: 'var(--muted-foreground)' }},
                      ]
                    }}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre 
                        className={className} 
                        style={{ 
                          ...style, 
                          background: 'transparent', 
                          margin: 0, 
                          padding: 0,
                          color: 'var(--foreground)',
                        }}
                      >
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
                <div 
                  className="p-4 rounded-r-lg"
                  style={{
                    background: `color-mix(in srgb, var(--card-bg) 30%, transparent)`,
                    borderLeft: `4px solid var(--accent)`,
                  }}
                >
                  <p style={{ color: 'color-mix(in srgb, var(--foreground) 85%, var(--background))' }}>
                    <strong style={{ color: 'var(--accent-bright)' }}>Key Insight:</strong> The tokenizer converts 
                    each character to a number. Characters become token IDs 0 through n-1, 
                    with a special BOS (Beginning of Sequence) token.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Interactive tokenizer */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 
                className="text-2xl font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                Try the Tokenizer
              </h3>
              
              <div 
                className="rounded-lg p-6 space-y-4"
                style={{
                  background: `color-mix(in srgb, var(--card-bg) 30%, transparent)`,
                  border: `1px solid var(--border)`,
                }}
              >
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'color-mix(in srgb, var(--foreground) 85%, var(--background))' }}
                  >
                    Enter a name to tokenize:
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => handleNameInput(e.target.value)}
                    placeholder="Try: emma, olivia, or your name..."
                    className="w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      background: `color-mix(in srgb, var(--code-bg) 50%, transparent)`,
                      border: `1px solid var(--border)`,
                      color: 'var(--foreground)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Sample names */}
                <div className="flex flex-wrap gap-2">
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Try:
                  </span>
                  {sampleNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleNameInput(name)}
                      className="px-3 py-1 text-sm rounded-md transition-colors"
                      style={{
                        background: `color-mix(in srgb, var(--muted) 50%, transparent)`,
                        color: 'var(--accent)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `color-mix(in srgb, var(--accent) 20%, transparent)`;
                        e.currentTarget.style.color = 'var(--foreground)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `color-mix(in srgb, var(--muted) 50%, transparent)`;
                        e.currentTarget.style.color = 'var(--accent)';
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Tokenization result */}
                {tokens.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h4 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                      Tokens:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tokens.map((token, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="px-3 py-2 rounded-lg border text-center min-w-[3rem]"
                          style={{
                            background: token === BOS_TOKEN 
                              ? `color-mix(in srgb, var(--accent) 20%, transparent)`
                              : `color-mix(in srgb, var(--code-bg) 50%, transparent)`,
                            borderColor: token === BOS_TOKEN 
                              ? 'var(--accent)'
                              : 'var(--border)',
                            color: token === BOS_TOKEN 
                              ? 'var(--accent)'
                              : 'color-mix(in srgb, var(--foreground) 85%, var(--background))',
                          }}
                        >
                          <div className="text-xs opacity-75">
                            {token === BOS_TOKEN ? 'BOS' : charset[token]}
                          </div>
                          <div className="font-mono font-bold">{token}</div>
                        </motion.div>
                      ))}
                    </div>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Vocabulary size: {charset.length + 1} tokens ({charset.length} characters + 1 BOS token)
                    </p>
                  </motion.div>
                )}
              </div>

              <div 
                className="rounded-lg p-4"
                style={{
                  background: `color-mix(in srgb, var(--card-bg) 20%, transparent)`,
                  border: `1px solid var(--border)`,
                }}
              >
                <h4 
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--accent)' }}
                >
                  How it works:
                </h4>
                <ul 
                  className="space-y-2 text-sm"
                  style={{ color: 'color-mix(in srgb, var(--foreground) 85%, var(--background))' }}
                >
                  <li>• Each character gets a unique ID (0 to 25 for a-z)</li>
                  <li>• BOS (Beginning of Sequence) token marks start/end</li>
                  <li>• Model learns patterns in these token sequences</li>
                  <li>• Total vocabulary: 27 tokens (26 letters + BOS)</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
