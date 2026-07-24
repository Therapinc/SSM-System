import os

def patch_case_record_v2(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix content area to be full width on mobile and fix inner cards
    # Change the grid in Identification from md:grid-cols-4 to grid-cols-2 on mobile
    content = content.replace(
        '<div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-md:gap-2">',
        '<div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-md:gap-3">'
    )

    # 2. Make the inner white cards full width on mobile (remove fixed p-6 constraint)
    content = content.replace(
        '<div className="p-6 bg-white/50 rounded-2xl">',
        '<div className="p-6 max-md:p-3 bg-white/50 rounded-2xl w-full">'
    )

    # 3. Add w-full to all section wrapper divs (the backdrop-blur outer containers)
    content = content.replace(
        'className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 max-md:p-0 max-md:shadow-none max-md:bg-transparent max-md:border-none border border-white/20"',
        'className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 max-md:p-0 max-md:shadow-none max-md:bg-transparent max-md:border-none border border-white/20 w-full"'
    )

    # 4. Replace mobile nav with auto-scroll version using data-section-pill attribute 
    # and add JS inline scroll logic
    old_btn = '''                      <button
                        key={section.id}
                        onClick={() => setActiveCaseSection(section.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${activeCaseSection === section.id
                          ? "bg-[#E38B52] text-white shadow-md"
                          : "bg-white/70 text-[#170F49] border border-gray-200"
                        }`}
                      >
                        {section.label}
                      </button>'''

    new_btn = '''                      <button
                        key={section.id}
                        data-pill-id={section.id}
                        onClick={(e) => {
                          setActiveCaseSection(section.id);
                          // Scroll active pill to center
                          const btn = e.currentTarget;
                          const container = btn.closest('[data-pills-container]');
                          if (container) {
                            const btnLeft = btn.offsetLeft;
                            const btnWidth = btn.offsetWidth;
                            const containerWidth = container.offsetWidth;
                            container.scrollTo({ left: btnLeft - containerWidth / 2 + btnWidth / 2, behavior: 'smooth' });
                          }
                        }}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${activeCaseSection === section.id
                          ? "bg-[#E38B52] text-white shadow-md"
                          : "bg-white/70 text-[#170F49] border border-gray-200"
                        }`}
                      >
                        {section.label}
                      </button>'''

    content = content.replace(old_btn, new_btn)

    # 5. Add data-pills-container to the scrollable container
    old_pills_wrap = '<div className="md:hidden w-full overflow-x-auto pb-2 hide-scrollbar">'
    new_pills_wrap = '<div className="md:hidden w-full overflow-x-auto pb-2 hide-scrollbar" data-pills-container>'
    content = content.replace(old_pills_wrap, new_pills_wrap)

    # 6. The flex-1 content area needs to be w-full on mobile since the aside is hidden
    old_content = '<div className="flex-1 min-w-0 max-md:w-full">'
    new_content = '<div className="flex-1 min-w-0 w-full">'
    content = content.replace(old_content, new_content, 1)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_case_record_v2('src/pages/StudentPage.jsx')
print("Case Record v2 patch applied!")
