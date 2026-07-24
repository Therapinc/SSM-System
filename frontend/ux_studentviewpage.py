import os
import re

file_path = 'src/pages/StudentViewPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Bottom Navigation from StudentViewPage
bottom_nav_pattern = re.compile(r'\{\/\* ----------------- MOBILE BOTTOM NAV ----------------- \*\/.*?<\/div>', re.DOTALL)
content = bottom_nav_pattern.sub('', content)

# 2. Remove pb-[90px] padding
content = content.replace('pb-[90px] lg:pb-0', '')

# 3. Implement Horizontally Scrollable Tabs
content = content.replace(
    '<div className="flex justify-center mb-8 max-lg:hidden">',
    '<div className="flex justify-center mb-8 max-md:overflow-x-auto max-md:whitespace-nowrap max-md:w-screen max-md:-mx-4 max-md:px-4 hide-scrollbar max-md:justify-start">'
)

# 4. Header Consolidation
header_replacement = """<div className="flex items-center justify-center relative mb-8 max-md:mb-5">
          <button onClick={() => navigate(-1)} className="absolute left-0 lg:hidden text-[#170F49] p-2 -ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-3xl max-md:text-xl font-bold text-[#170F49] text-center font-baskervville">
            Student Information
          </h1>
        </div>"""
content = content.replace(
    '<h1 className="text-3xl font-bold text-[#170F49] mb-8 max-md:mb-5 text-center font-baskervville">\n          Student Information\n        </h1>',
    header_replacement
)

# 5. Photo Placeholder Reduction
content = content.replace('max-md:w-20 max-md:h-20', 'max-md:w-16 max-md:h-16')

# 6. Information Density & Nested Cards
content = content.replace(
    'p-8 md:p-12 max-md:p-3',
    'p-8 md:p-12 max-md:p-0 max-md:shadow-none max-md:bg-transparent max-md:border-none'
)
content = content.replace('max-md:space-y-4', 'max-md:space-y-2')
content = content.replace('max-md:gap-4', 'max-md:gap-2')
content = content.replace(
    '<p className="font-semibold text-lg text-[#170F49]">',
    '<p className="font-semibold text-lg max-md:text-base text-[#170F49]">'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("StudentViewPage.jsx Patched")
