import re

def fix_grids(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic replace:
    content = content.replace('max-md:grid-cols-2', 'max-md:grid-cols-1')
    
    # Selective restore using \g<1>
    content = re.sub(
        r'(<div className="[^"]*grid-cols-2 max-md:grid-cols-)1([^"]*".*?label:\s*"Age")',
        r'\g<1>2\2', content, flags=re.DOTALL
    )
    content = re.sub(
        r'(<div className="[^"]*grid-cols-2 max-md:grid-cols-)1([^"]*".*?label:\s*"Religion")',
        r'\g<1>2\2', content, flags=re.DOTALL
    )
    content = re.sub(
        r'(<div className="[^"]*grid-cols-2 max-md:grid-cols-)1([^"]*".*?label:\s*"Category")',
        r'\g<1>2\2', content, flags=re.DOTALL
    )
    content = re.sub(
        r'(<div className="[^"]*grid-cols-2 max-md:grid-cols-)1([^"]*".*?label:\s*"Height")',
        r'\g<1>2\2', content, flags=re.DOTALL
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_grids('src/pages/StudentPage.jsx')
if __import__('os').path.exists('src/pages/StudentViewPage.jsx'):
    fix_grids('src/pages/StudentViewPage.jsx')

