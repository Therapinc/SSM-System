import os

def patch_case_record(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the outer flex container to be column on mobile
    old_wrap = '<div className="flex gap-6 max-md:gap-2 items-start">'
    new_wrap = '<div className="flex flex-col md:flex-row gap-6 max-md:gap-3 items-start">'
    content = content.replace(old_wrap, new_wrap)

    # 2. Hide the sidebar on mobile
    old_aside = '<aside className="w-64 flex-shrink-0 sticky top-5 self-start">'
    new_aside = '<aside className="w-64 flex-shrink-0 sticky top-5 self-start max-md:hidden">'
    content = content.replace(old_aside, new_aside)

    # 3. After the aside closing tag and before the right content area, inject mobile section nav
    # The aside ends at line 11147: </aside>
    # Then line 11148: blank
    # Then line 11149: {/* Right Content Area */}
    # We insert the mobile section nav between </aside> and {/* Right Content Area */}

    mobile_section_nav = '''                {/* Mobile Section Navigation - horizontal scrollable pills */}
                <div className="md:hidden w-full overflow-x-auto pb-2 hide-scrollbar">
                  <div className="flex gap-2 min-w-max px-1">
                    {[
                      { id: "identification", label: "Identification" },
                      { id: "demographic", label: "Demographic" },
                      { id: "contact", label: "Contact & Medical" },
                      { id: "family", label: "Family History" },
                      { id: "development", label: "Development" },
                      { id: "education", label: "Special Ed." },
                      { id: "medical", label: "Medical Info" },
                      { id: "documents", label: "Documents" },
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveCaseSection(section.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${activeCaseSection === section.id
                          ? "bg-[#E38B52] text-white shadow-md"
                          : "bg-white/70 text-[#170F49] border border-gray-200"
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Edit/Download Buttons */}
                <div className="md:hidden w-full flex gap-2 mb-3">
                  {!editMode ? (
                    <button
                      onClick={handleEditStart}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#E38B52] rounded-xl border border-[#E38B52]/30 text-sm font-medium shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={handleEditSave}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </button>
                  )}
                  <button
                    onClick={handleDownloadCaseRecord}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-xl text-sm font-medium shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>

'''

    # Insert after </aside>
    insert_marker = '                {/* Right Content Area */}'
    content = content.replace(insert_marker, mobile_section_nav + '                {/* Right Content Area */}', 1)

    # 4. Compact the progress bar on mobile
    content = content.replace(
        '<div className="mb-8 max-md:mb-5 bg-white/50 rounded-2xl p-6 shadow-lg border border-white/30">',
        '<div className="mb-8 max-md:mb-4 bg-white/50 rounded-2xl p-6 max-md:p-4 shadow-lg border border-white/30">'
    )

    # 5. Make section content area full width on mobile (it already has flex-1 but needs w-full on mobile for clarity)
    old_content_area = '<div className="flex-1 min-w-0">'
    new_content_area = '<div className="flex-1 min-w-0 max-md:w-full">'
    content = content.replace(old_content_area, new_content_area, 1)

    # 6. On mobile the main container for case record shouldn't have desktop padding
    old_max_wrapper = '<div className="max-w-6xl mx-auto p-6">'
    new_max_wrapper = '<div className="max-w-6xl mx-auto p-6 max-md:p-0">'
    content = content.replace(old_max_wrapper, new_max_wrapper)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


patch_case_record('src/pages/StudentPage.jsx')
print("Case Record mobile fix applied!")
