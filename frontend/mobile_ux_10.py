import re

file_path = 'src/pages/StudentPage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Page padding: `<div className="max-w-6xl mx-auto p-6 max-md:p-0">` -> `max-md:px-4 max-md:py-2`
content = content.replace('max-w-6xl mx-auto p-6 max-md:p-0', 'max-w-6xl mx-auto p-6 max-md:px-4 max-md:py-2')

# 2. Section gap: Reduce vertical gap between sections from `mb-6 max-md:mb-6 ... max-md:pb-6`
# The class block is `mb-6 max-md:mb-6 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-6 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none`
old_section_class = 'mb-6 max-md:mb-6 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-6 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none'
new_section_class = 'mb-6 max-md:mb-0 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-5 max-md:mb-5 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none'
content = content.replace(old_section_class, new_section_class)

# 3. Gap between columns: `gap-6 max-md:gap-3` -> `gap-6 max-md:gap-5`
content = content.replace('gap-6 max-md:gap-3', 'gap-6 max-md:gap-5')

# 4. Typography Hierarchy
# Label:
old_label_class = 'text-sm max-md:text-xs text-[#6F6C90] max-md:text-gray-500 mb-2 max-md:mb-1 font-semibold max-md:font-medium'
new_label_class = 'text-sm max-md:text-[13px] text-[#6F6C90] max-md:text-gray-500 mb-2 max-md:mb-1 font-semibold max-md:font-medium'
content = content.replace(old_label_class, new_label_class)

# Value:
old_value_class = 'text-[#170F49] font-medium text-lg max-md:text-sm max-md:font-bold'
new_value_class = 'text-[#170F49] font-medium text-lg max-md:text-[17px] max-md:font-semibold max-md:text-[#0A0535]'
content = content.replace(old_value_class, new_value_class)
# Also Address info has: `<p className="text-[#170F49] font-medium">{student?.[field.key] || "N/A"}</p>`
# Let's replace `className="text-[#170F49] font-medium"` when it's next to `{student?.[field.key]` with the new value class, but we need to be careful.
# Actually, the user wants this hierarchy applied to the mobile form fields. I will use regex.
content = re.sub(
    r'<p className="text-\[#170F49\] font-medium">(.*?\{student\?\.\[field\.key\].*?)</p>',
    r'<p className="text-[#170F49] font-medium text-lg max-md:text-[17px] max-md:font-semibold max-md:text-[#0A0535]">\1</p>',
    content
)

# 5. FAB offset on mobile
# className={`fixed z-50 bottom-8 right-8 flex flex-col gap-3 transition-opacity duration-300
content = content.replace(
    'className={`fixed z-50 bottom-8 right-8',
    'className={`fixed z-50 bottom-8 max-md:bottom-24 right-8'
)

# 6. Grid columns logic (Two columns only for short fields)
# The current is: `className={["name", "specific_diagnostic", "medical_conditions", "address", "birthPlace", "houseName", "streetName", "postOffice", "email"].includes(field.key) ? "max-md:col-span-2" : ""}`
# New logic: `className={!["age", "studentId", "dob", "gender", "religion", "caste", "category", "ud_id"].includes(field.key) ? "max-md:col-span-2" : ""}`
old_grid_logic = r'className=\{\["name", "specific_diagnostic", "medical_conditions", "address", "birthPlace", "houseName", "streetName", "postOffice", "email"\]\.includes\(field\.key\) \? "max-md:col-span-2" : ""\}'
new_grid_logic = r'className={!["age", "studentId", "dob", "gender", "religion", "caste", "category", "ud_id"].includes(field.key) ? "max-md:col-span-2" : ""}'
content = re.sub(old_grid_logic, new_grid_logic, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Modifications applied successfully.")
