import os

def patch_family_history_special_ed(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # ---------------------------------------------------------------
    # FIX 1: Family History - Household composition table overflow
    # The view-mode table needs overflow-x-auto with a min-width hint
    # ---------------------------------------------------------------

    # View mode table wrapper - make it explicitly scrollable on mobile
    old_view_table = '<div className="overflow-x-auto">\n                               <table className="w-full border-collapse rounded-xl overflow-hidden">'
    new_view_table = '<div className="overflow-x-auto -mx-3 px-3">\n                               <table className="min-w-[560px] w-full border-collapse rounded-xl overflow-hidden">'
    content = content.replace(old_view_table, new_view_table)

    # Drug History table also has same pattern — fix that too
    # First let's also fix Family History section title on mobile (too large)
    content = content.replace(
        'Family History\n                       </h2>',
        'Family History\n                       </h2>'
    )

    # ---------------------------------------------------------------
    # FIX 2: Family History - make the card section container use
    # proper overflow clipping so table doesn't escape bounds
    # ---------------------------------------------------------------

    # The household card at line 11831 - ensure it clips
    old_household_card = '<div className="p-6 max-md:p-3 bg-white/50 rounded-2xl w-full">\n                           <h3 className="text-lg font-semibold text-[#170F49] mb-4">\n                             Household Composition'
    new_household_card = '<div className="p-6 max-md:p-3 bg-white/50 rounded-2xl w-full overflow-hidden">\n                           <h3 className="text-lg font-semibold text-[#170F49] mb-4">\n                             Household Composition'
    content = content.replace(old_household_card, new_household_card)

    # ---------------------------------------------------------------
    # FIX 3: Special Ed - subsection tabs should scroll and center on tap
    # ---------------------------------------------------------------

    # Add data-pills-container to the Special Ed subsection scroll container
    old_sub_wrap = '<div className="mb-8 max-md:mb-5 overflow-x-auto">\n                        <div className="flex gap-1 min-w-max pb-2">'
    new_sub_wrap = '<div className="mb-8 max-md:mb-5 overflow-x-auto hide-scrollbar" data-pills-container>\n                        <div className="flex gap-1 min-w-max pb-2">'
    content = content.replace(old_sub_wrap, new_sub_wrap)

    # Add scroll-to-center on click for subsection buttons
    old_sub_btn = '''                            <button
                              key={subsection.id}
                              onClick={() =>
                                setActiveEducationSubsection(subsection.id)
                              }
                              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeEducationSubsection === subsection.id
                                ? "bg-[#E38B52] text-white shadow-lg"
                                : "bg-white/50 text-[#170F49] hover:bg-white/80"
                                }`}
                            >
                              {subsection.label}
                            </button>'''
    new_sub_btn = '''                            <button
                              key={subsection.id}
                              onClick={(e) => {
                                setActiveEducationSubsection(subsection.id);
                                const btn = e.currentTarget;
                                const container = btn.closest('[data-pills-container]');
                                if (container) {
                                  container.scrollTo({ left: btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
                                }
                              }}
                              className={`px-4 max-md:px-3 py-2 max-md:py-1.5 rounded-lg text-sm max-md:text-xs font-medium transition-all duration-300 whitespace-nowrap ${activeEducationSubsection === subsection.id
                                ? "bg-[#E38B52] text-white shadow-lg"
                                : "bg-white/50 text-[#170F49] hover:bg-white/80"
                                }`}
                            >
                              {subsection.label}
                            </button>'''
    content = content.replace(old_sub_btn, new_sub_btn)

    # ---------------------------------------------------------------
    # FIX 4: Special Ed - inner content card padding on mobile
    # ---------------------------------------------------------------

    # bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 - this is the subsection wrapper
    content = content.replace(
        'className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 max-md:space-y-2 mb-8 max-md:mb-5"',
        'className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 max-md:p-3 space-y-8 max-md:space-y-3 mb-8 max-md:mb-5"'
    )

    # Inner white sub-cards
    content = content.replace(
        'className="bg-white rounded-xl p-6 space-y-6 max-md:space-y-2 shadow-lg"',
        'className="bg-white rounded-xl p-6 max-md:p-3 space-y-6 max-md:space-y-3 shadow-lg"'
    )

    # Drug history table - also needs overflow clipping
    old_drug_card = '<div className="p-6 max-md:p-3 bg-white/50 rounded-2xl w-full">\n                           <h3 className="text-lg font-semibold text-[#170F49] mb-4">\n                             Drug History'
    new_drug_card = '<div className="p-6 max-md:p-3 bg-white/50 rounded-2xl w-full overflow-hidden">\n                           <h3 className="text-lg font-semibold text-[#170F49] mb-4">\n                             Drug History'
    content = content.replace(old_drug_card, new_drug_card)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


patch_family_history_special_ed('src/pages/StudentPage.jsx')
print("Family History + Special Ed mobile fix applied!")
