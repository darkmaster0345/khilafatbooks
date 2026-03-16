import sys

with open('src/pages/Index.tsx', 'r') as f:
    content = f.read()

old = """              <Link to={cat.link} className="group relative block overflow-hidden rounded-2xl aspect-[4/3]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />"""

new = """              <Link to={cat.link} className="group relative block overflow-hidden rounded-2xl aspect-[4/3]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  width="800"
                  height="600"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />"""

if old in content:
    content = content.replace(old, new)
    with open('src/pages/Index.tsx', 'w') as f:
        f.write(content)
    print("Patch applied")
else:
    print("Old content not found")
