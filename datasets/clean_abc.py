"""Clean ABC notation files for character-level training.
Strip headers, chord annotations, comments — keep only melody notes."""
import re, os, glob

def clean_abc_tune(lines):
    """Extract melody from ABC tune lines."""
    melody_parts = []
    for line in lines:
        line = line.strip()
        # Skip headers (X:, T:, M:, K:, S:, P:, %, etc.)
        if not line or line[0] in 'XTMLKSPQWHRNIBCFOV%' and len(line) > 1 and line[1] in ':':
            continue
        if line.startswith('%'):
            continue
        if line.startswith('P:'):
            continue
        # Remove chord annotations like "G" "D7" "Am" etc
        line = re.sub(r'"[^"]*"', '', line)
        # Remove decorations like !segno! !fermata! etc
        line = re.sub(r'![^!]*!', '', line)
        # Clean up extra spaces
        line = re.sub(r'\s+', ' ', line).strip()
        if line:
            melody_parts.append(line)
    return ' '.join(melody_parts)

def process_file(filepath):
    """Process one ABC file, return list of cleaned melodies."""
    with open(filepath) as f:
        content = f.read()
    
    tunes = []
    current_lines = []
    
    for line in content.split('\n'):
        if line.startswith('X:'):
            if current_lines:
                melody = clean_abc_tune(current_lines)
                if melody and len(melody) > 20:
                    tunes.append(melody)
            current_lines = [line]
        else:
            current_lines.append(line)
    
    if current_lines:
        melody = clean_abc_tune(current_lines)
        if melody and len(melody) > 20:
            tunes.append(melody)
    
    return tunes

# Process all files
all_tunes = []
for f in sorted(glob.glob('*.txt')):
    if f.startswith('clean') or f.startswith('melod'):
        continue
    tunes = process_file(f)
    print(f"{f}: {len(tunes)} tunes")
    all_tunes.extend(tunes)

print(f"\nTotal tunes: {len(all_tunes)}")

# Analyze
lengths = [len(t) for t in all_tunes]
print(f"Length range: {min(lengths)} - {max(lengths)}")
print(f"Mean length: {sum(lengths)/len(lengths):.0f}")
print(f"Median length: {sorted(lengths)[len(lengths)//2]}")

# Vocab analysis
all_chars = set()
for t in all_tunes:
    all_chars.update(t)
chars = sorted(all_chars)
print(f"\nVocab size: {len(chars)}")
print(f"Chars: {''.join(chars)}")

# Show a few examples
print("\n--- Sample melodies ---")
for t in all_tunes[:5]:
    print(f"  [{len(t)}] {t[:100]}...")

# Save
with open('melodies_full.txt', 'w') as f:
    for t in all_tunes:
        f.write(t + '\n')

# Also save shorter versions (block_size=8 friendly)
# Trim to first 64 chars for more manageable training
short_tunes = [t[:64] for t in all_tunes]
with open('melodies_short.txt', 'w') as f:
    for t in short_tunes:
        f.write(t + '\n')

print(f"\nSaved {len(all_tunes)} full melodies and {len(short_tunes)} short (64-char) melodies")
