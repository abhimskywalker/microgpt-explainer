"""MicroGPT training script for standard Python runtimes (Pyodide-friendly).
Based on Karpathy's microgpt gist structure with browser-safe dataset embedding.
"""

import math
import random

# UI overwrites this per run.
random.seed(42)

# Load melody dataset
with open('melodies_full.txt') as _f:
    docs = [l.strip() for l in _f if l.strip()]
dataset_name = "Nottingham folk melodies (ABC)"

# Tokenizer
uchars = sorted(list(set(''.join(docs))))
BOS = len(uchars)
vocab_size = len(uchars) + 1

print("=== microgpt (Pyodide) ===")
print(f"dataset: {dataset_name} | docs: {len(docs)}")
print(f"vocab: {vocab_size} | {''.join(uchars)}")


class Value:
    def __init__(self, data, _children=(), _op=''):
        self.data = float(data)
        self.grad = 0.0
        self._prev = set(_children)
        self._op = _op
        self._backward = lambda: None

    def __repr__(self):
        return f"Value(data={self.data}, grad={self.grad})"

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), '+')

        def _backward():
            self.grad += out.grad
            other.grad += out.grad

        out._backward = _backward
        return out

    def __radd__(self, other):
        return self + other

    def __neg__(self):
        return self * -1

    def __sub__(self, other):
        return self + (-other)

    def __rsub__(self, other):
        return other + (-self)

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), '*')

        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad

        out._backward = _backward
        return out

    def __rmul__(self, other):
        return self * other

    def __truediv__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return self * (other ** -1)

    def __rtruediv__(self, other):
        return other * (self ** -1)

    def __pow__(self, other):
        assert isinstance(other, (int, float)), "only int/float powers are supported"
        out = Value(self.data ** other, (self,), f'**{other}')

        def _backward():
            self.grad += (other * self.data ** (other - 1)) * out.grad

        out._backward = _backward
        return out

    def exp(self):
        out = Value(math.exp(self.data), (self,), 'exp')

        def _backward():
            self.grad += out.data * out.grad

        out._backward = _backward
        return out

    def log(self):
        out = Value(math.log(self.data), (self,), 'log')

        def _backward():
            self.grad += (1.0 / self.data) * out.grad

        out._backward = _backward
        return out

    def relu(self):
        out = Value(self.data if self.data > 0 else 0.0, (self,), 'relu')

        def _backward():
            self.grad += (1.0 if out.data > 0 else 0.0) * out.grad

        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visited = set()

        def build(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build(child)
                topo.append(v)

        build(self)
        self.grad = 1.0
        for node in reversed(topo):
            node._backward()


# Model config
n_embd = 16
n_head = 4
n_layer = 1
block_size = 8
head_dim = n_embd // n_head


def matrix(rows, cols, std=0.02):
    return [[Value(random.gauss(0.0, std)) for _ in range(cols)] for _ in range(rows)]


def vector(size, value=0.0):
    return [Value(value) for _ in range(size)]


state_dict = {
    "wte": matrix(vocab_size, n_embd),
    "wpe": matrix(block_size, n_embd),
    "layers": [
        {
            "ln1": vector(n_embd, 1.0),
            "attn_wq": matrix(n_embd, n_embd),
            "attn_wk": matrix(n_embd, n_embd),
            "attn_wv": matrix(n_embd, n_embd),
            "attn_wo": matrix(n_embd, n_embd, std=0.0),
            "ln2": vector(n_embd, 1.0),
            "mlp_fc1": matrix(4 * n_embd, n_embd),
            "mlp_fc2": matrix(n_embd, 4 * n_embd, std=0.0),
        }
        for _ in range(n_layer)
    ],
    "ln_f": vector(n_embd, 1.0),
    "lm_head": matrix(vocab_size, n_embd),
}


def flatten_params(obj):
    if isinstance(obj, Value):
        return [obj]
    if isinstance(obj, list):
        result = []
        for item in obj:
            result.extend(flatten_params(item))
        return result
    if isinstance(obj, dict):
        result = []
        for value in obj.values():
            result.extend(flatten_params(value))
        return result
    return []


params = flatten_params(state_dict)
print(f"params: {len(params)}")


def linear(x, w):
    return [sum((wi * xi for wi, xi in zip(wo, x)), Value(0.0)) for wo in w]


def softmax(logits):
    maxval = max(logits, key=lambda x: x.data)
    ex = [(x - maxval).exp() for x in logits]
    denom = sum(ex, Value(0.0))
    return [x / denom for x in ex]


def rmsnorm(x, g):
    eps = 1e-5
    n = len(x)
    ss = sum((xi * xi for xi in x), Value(0.0))
    rms = (ss / n + eps) ** 0.5
    return [(xi / rms) * gi for xi, gi in zip(x, g)]


def gpt(token_id, pos_id, keys, values):
    x = [state_dict["wte"][token_id][i] + state_dict["wpe"][pos_id][i] for i in range(n_embd)]

    for li in range(n_layer):
        layer = state_dict["layers"][li]

        x_residual = x
        x = rmsnorm(x, layer["ln1"])
        q = linear(x, layer["attn_wq"])
        k = linear(x, layer["attn_wk"])
        v = linear(x, layer["attn_wv"])
        keys[li].append(k)
        values[li].append(v)

        heads = []
        for h in range(n_head):
            qh = q[h * head_dim:(h + 1) * head_dim]
            scores = []
            for t in range(pos_id + 1):
                kh = keys[li][t][h * head_dim:(h + 1) * head_dim]
                dot = sum((qi * ki for qi, ki in zip(qh, kh)), Value(0.0))
                scores.append(dot / (head_dim ** 0.5))
            ws = softmax(scores)

            oh = [Value(0.0) for _ in range(head_dim)]
            for t in range(pos_id + 1):
                vh = values[li][t][h * head_dim:(h + 1) * head_dim]
                for i in range(head_dim):
                    oh[i] = oh[i] + ws[t] * vh[i]
            heads.extend(oh)

        attn = linear(heads, layer["attn_wo"])
        x = [xr + a for xr, a in zip(x_residual, attn)]

        x_residual = x
        x = rmsnorm(x, layer["ln2"])
        h = linear(x, layer["mlp_fc1"])
        h = [hi.relu() ** 2 for hi in h]
        h2 = linear(h, layer["mlp_fc2"])
        x = [xr + y for xr, y in zip(x_residual, h2)]

    x = rmsnorm(x, state_dict["ln_f"])
    logits = linear(x, state_dict["lm_head"])
    return logits


# AdamW-like optimizer state
learning_rate = 1e-2
beta1 = 0.9
beta2 = 0.95
eps = 1e-8
m = [0.0 for _ in params]
v = [0.0 for _ in params]

# UI overwrites this per run.
num_steps = 200
print(f"training {num_steps} steps...")

for step in range(num_steps):
    doc = docs[random.randrange(len(docs))]
    tokens = [BOS] + [uchars.index(ch) for ch in doc] + [BOS]
    n = min(len(tokens) - 1, block_size)

    keys = [[] for _ in range(n_layer)]
    values = [[] for _ in range(n_layer)]
    losses = []

    for pos in range(n):
        logits = gpt(tokens[pos], pos, keys, values)
        probs = softmax(logits)
        losses.append(-(probs[tokens[pos + 1]].log()))

    loss = sum(losses[1:], losses[0]) / n
    loss.backward()

    lr_t = learning_rate * 0.5 * (1.0 + math.cos(math.pi * step / num_steps))
    for i, p in enumerate(params):
        m[i] = beta1 * m[i] + (1.0 - beta1) * p.grad
        v[i] = beta2 * v[i] + (1.0 - beta2) * (p.grad ** 2)
        m_hat = m[i] / (1.0 - beta1 ** (step + 1))
        v_hat = v[i] / (1.0 - beta2 ** (step + 1))
        p.data -= lr_t * m_hat / (v_hat ** 0.5 + eps)
        p.grad = 0.0

    print(f"step {step + 1}/{num_steps} | loss {loss.data:.6f}")


# UI overwrites this per run.
temperature = 0.8
print("=== generating ===")

for sample_idx in range(12):
    token_id = BOS
    sample = []
    keys = [[] for _ in range(n_layer)]
    values = [[] for _ in range(n_layer)]

    for pos in range(block_size):
        logits = gpt(token_id, pos, keys, values)
        probs = softmax([l / temperature for l in logits])
        token_id = random.choices(range(vocab_size), weights=[p.data for p in probs], k=1)[0]
        if token_id == BOS:
            break
        sample.append(uchars[token_id])

    print(f"sample {sample_idx + 1}: {''.join(sample)}")

print("=== done ===")
