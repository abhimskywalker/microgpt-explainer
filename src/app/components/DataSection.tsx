"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

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
              <span className="text-amber-400">The Data</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-stone-400 max-w-3xl mx-auto"
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
              <h3 className="text-2xl font-semibold text-amber-300">Loading & Tokenization</h3>
              
              <div className="bg-stone-900/50 border border-stone-700 rounded-lg overflow-hidden">
                <div className="bg-stone-800/50 px-4 py-2 border-b border-stone-700">
                  <span className="text-amber-400 font-mono text-sm">microgpt.py</span>
                </div>
                <div className="p-4 font-mono text-sm overflow-x-auto">
                  <Highlight
                    language="python"
                    code={dataCode}
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
                    <strong className="text-amber-400">Key Insight:</strong> The tokenizer converts 
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
              <h3 className="text-2xl font-semibold text-amber-300">Try the Tokenizer</h3>
              
              <div className="bg-stone-900/30 border border-stone-700 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Enter a name to tokenize:
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => handleNameInput(e.target.value)}
                    placeholder="Try: emma, olivia, or your name..."
                    className="w-full px-4 py-3 bg-stone-800/50 border border-stone-600 rounded-lg text-amber-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>

                {/* Sample names */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-stone-400">Try:</span>
                  {sampleNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleNameInput(name)}
                      className="px-3 py-1 text-sm bg-stone-700/50 text-amber-300 rounded-md hover:bg-amber-500/20 hover:text-amber-200 transition-colors"
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
                    <h4 className="text-lg font-semibold text-amber-300">Tokens:</h4>
                    <div className="flex flex-wrap gap-2">
                      {tokens.map((token, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`
                            px-3 py-2 rounded-lg border text-center min-w-[3rem]
                            ${token === BOS_TOKEN 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                              : 'bg-stone-800/50 border-stone-600 text-stone-300'
                            }
                          `}
                        >
                          <div className="text-xs opacity-75">
                            {token === BOS_TOKEN ? 'BOS' : charset[token]}
                          </div>
                          <div className="font-mono font-bold">{token}</div>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-sm text-stone-400">
                      Vocabulary size: {charset.length + 1} tokens ({charset.length} characters + 1 BOS token)
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="bg-stone-800/20 border border-stone-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-amber-300 mb-2">How it works:</h4>
                <ul className="space-y-2 text-stone-300 text-sm">
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