import sys

with open('src/pages/Index.tsx', 'r') as f:
    content = f.read()

old = """      {/* Abandoned Cart Banner */}
      {items.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-accent/10 border-b border-accent/20 overflow-hidden"
        >"""

new = """      {/* Abandoned Cart Banner */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-accent/10 border-b border-accent/20 overflow-hidden"
        >"""

if old in content:
    content = content.replace(old, new)
    with open('src/pages/Index.tsx', 'w') as f:
        f.write(content)
    print("Patch applied")
else:
    print("Old content not found")
