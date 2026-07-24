import os

def patch_student_page():
    file_path = 'src/pages/StudentPage.jsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Tabs scrolling (snap-x snap-mandatory)
    content = content.replace(
        'max-md:overflow-x-auto max-md:whitespace-nowrap max-md:w-screen max-md:-mx-4 max-md:px-4 hide-scrollbar max-md:justify-start',
        'max-md:overflow-x-auto max-md:whitespace-nowrap max-md:w-screen max-md:-mx-4 max-md:px-4 hide-scrollbar max-md:justify-start max-md:snap-x max-md:snap-mandatory'
    )
    
    # Add snap-start to all tab buttons (they all have w-[180px])
    content = content.replace(
        'className={`w-[180px]',
        'className={`w-[180px] max-md:snap-start max-md:shrink-0'
    )

    # 2. Header Height
    content = content.replace(
        'className="flex items-center justify-center relative mb-8 max-md:mb-5"',
        'className="flex items-center justify-center relative mb-8 max-md:mb-2 max-md:-mt-2"'
    )

    # 3. Nested cards flattening
    old_card_class = 'className="mb-6 max-md:mb-4 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl"'
    new_card_class = 'className="mb-6 max-md:mb-6 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-6 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none"'
    content = content.replace(old_card_class, new_card_class)

    # 4. Photo placeholder reduction
    content = content.replace(
        'w-48 h-48 rounded-2xl',
        'w-48 h-48 max-md:w-24 max-md:h-24 rounded-2xl'
    )

    # 5. Edit Button style change
    old_edit = 'className="p-2 rounded-full transition-all duration-200 bg-[#E38B52] text-white hover:bg-[#C8742F]"'
    new_edit = 'className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 bg-transparent text-[#170F49] hover:bg-gray-100 border border-gray-200 text-sm font-medium"'
    content = content.replace(old_edit, new_edit)
    
    # Save button style change
    old_save = 'className="p-2 rounded-full transition-all duration-200 bg-green-600 text-white hover:bg-green-700"'
    new_save = 'className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 bg-green-600 text-white hover:bg-green-700 text-sm font-medium"'
    content = content.replace(old_save, new_save)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def patch_student_view_page():
    file_path = 'src/pages/StudentViewPage.jsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Tabs scrolling
    content = content.replace(
        'max-md:overflow-x-auto max-md:whitespace-nowrap max-md:w-screen max-md:-mx-4 max-md:px-4 hide-scrollbar max-md:justify-start',
        'max-md:overflow-x-auto max-md:whitespace-nowrap max-md:w-screen max-md:-mx-4 max-md:px-4 hide-scrollbar max-md:justify-start max-md:snap-x max-md:snap-mandatory'
    )
    content = content.replace(
        'className={`w-[180px]',
        'className={`w-[180px] max-md:snap-start max-md:shrink-0'
    )

    # 2. Header Height
    content = content.replace(
        'className="flex items-center justify-center relative mb-8 max-md:mb-5"',
        'className="flex items-center justify-center relative mb-8 max-md:mb-2 max-md:-mt-2"'
    )

    # 3. Nested cards flattening
    old_card_class = 'className="mb-6 max-md:mb-4 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl"'
    new_card_class = 'className="mb-6 max-md:mb-6 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-6 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none"'
    content = content.replace(old_card_class, new_card_class)

    # 4. Photo placeholder reduction
    content = content.replace(
        'w-40 h-40 rounded-2xl',
        'w-40 h-40 max-md:w-20 max-md:h-20 rounded-2xl'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_student_page()
patch_student_view_page()
print("UX final fixes applied!")
