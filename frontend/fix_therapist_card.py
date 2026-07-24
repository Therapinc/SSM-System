import re

filepath = 'src/pages/HeadMaster.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# We will replace the content of the `therapists.map` iteration.
# The card structure starts with `<div key={therapist.id}` and ends right before the map closing.

replacement = """                    <div
                      key={therapist.id}
                      onClick={() => handleTherapistClick(therapist.id)}
                      className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.08)] sm:shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer mb-2 sm:mb-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[#170F49]">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden mt-0.5 sm:mt-0">
                            <img src={`https://eu.ui-avatars.com/api/?name=${therapist.name.replace(" ", "+")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start w-full">
                              <h3 className="text-[17px] sm:text-lg font-semibold text-[#170F49] truncate pr-2">{therapist.name}</h3>
                              {/* Mobile Chevron indicator */}
                              <span className="sm:hidden text-slate-300 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                            
                            {/* Desktop Info (Hidden on mobile) */}
                            <div className="hidden sm:block space-y-1 mt-1">
                              <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Mobile:</span> {therapist.mobile_number || "Not provided"}</p>
                              {therapist.specialization && <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Specialization:</span> {therapist.specialization}</p>}
                              {therapist.qualifications_details && <p className="text-sm text-[#6F6C8F] truncate"><span className="font-medium">Qualifications:</span> {therapist.qualifications_details}</p>}
                            </div>
                            
                            {/* Mobile Info (Compact layout) */}
                            <div className="sm:hidden space-y-1 mt-1.5">
                              {therapist.specialization && <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">🩺</span> {therapist.specialization}</p>}
                              <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">📞</span> {therapist.mobile_number || "Not provided"}</p>
                              {therapist.qualifications_details && <p className="text-[13px] text-slate-500 truncate flex items-center gap-1.5"><span className="text-sm">🎓</span> {therapist.qualifications_details}</p>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 sm:space-x-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 items-center">
                          {/* Desktop Chevron */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTherapistClick(therapist.id); }}
                            className="hidden sm:block text-[#E38B52] hover:text-[#E38B52]/90 transition-colors p-2 rounded-lg hover:bg-[#E38B52]/10"
                            title="View Therapist Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={(event) => { event.stopPropagation(); handleAssignStudentsClick(therapist, event); }}
                              className="px-4 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[#E38B52] text-[13px] sm:text-sm font-semibold text-[#E38B52] bg-white hover:bg-[#E38B52] hover:text-white transition-colors"
                              title="Assign Students"
                            >
                              Assign Students
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTherapist(therapist.id, therapist.name); }}
                            className="text-red-500 hover:text-red-700 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(227,139,82,0.2)]"
                            title="Delete Therapist"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>"""

pattern = re.compile(
    r'<div\s+key={therapist\.id}\s+onClick={\(\) => handleTherapistClick\(therapist\.id\)}.*?</svg>\s*</button>\s*</div>\s*</div>\s*</div>',
    re.DOTALL
)

# Apply replacement to all matched therapist cards
new_content = pattern.sub(replacement, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replaced {len(pattern.findall(content))} occurrences.")
