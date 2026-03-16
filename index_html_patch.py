import sys

with open('index.html', 'r') as f:
    content = f.read()

font_url = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Inter:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap"

old = f'<link href="{font_url}" rel="stylesheet" />'
new = f'<link rel="preload" as="style" href="{font_url}" />\n    <link href="{font_url}" rel="stylesheet" />'

if old in content:
    content = content.replace(old, new)
    with open('index.html', 'w') as f:
        f.write(content)
    print("Patch applied")
else:
    print("Old content not found")
