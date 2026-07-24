import os

def tweak_student_page():
    file_path = 'src/pages/StudentPage.jsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make the main container edge-to-edge on mobile
    content = content.replace(
        '<div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col ">',
        '<div className="w-[90%] max-md:w-full max-w-[1200px] mx-4 max-md:mx-0 flex-1 flex flex-col ">'
    )

    # Make the action buttons stacked on mobile
    content = content.replace(
        '<div className="flex gap-4 mt-6 md:mt-8">',
        '<div className="flex max-md:flex-col gap-4 max-md:gap-3 mt-6 md:mt-8 max-md:px-4 max-md:pb-6">'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def tweak_student_view_page():
    file_path = 'src/pages/StudentViewPage.jsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace(
        '<div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col ">',
        '<div className="w-[90%] max-md:w-full max-w-[1200px] mx-4 max-md:mx-0 flex-1 flex flex-col ">'
    )
    
    # Wait, in View page, what are the bottom buttons?
    # Let's just stack any "flex gap-4 mt-6"
    content = content.replace(
        '<div className="flex gap-4 mt-6 md:mt-8">',
        '<div className="flex max-md:flex-col gap-4 max-md:gap-3 mt-6 md:mt-8 max-md:px-4 max-md:pb-6">'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

tweak_student_page()
tweak_student_view_page()
print("Mobile tweaks applied")
