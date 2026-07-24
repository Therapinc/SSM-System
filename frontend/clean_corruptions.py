import re

mobile_cards_view = """
                            {/* Mobile View */}
                            <div className="md:hidden space-y-4 mt-4">
                              {student?.household && student.household.length > 0 ? (
                                student.household.map((member, index) => (
                                  <div key={index} className="bg-white/70 border border-[#E38B52]/20 rounded-xl p-4 shadow-sm">
                                    <h4 className="font-semibold text-[#170F49] mb-3 flex items-center gap-2">
                                      <span className="bg-[#E38B52] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                                      {member.name || "N/A"} {member.age ? `(${member.age})` : ''}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="text-[#6F6C90] block text-xs mb-0.5">Education</span>
                                        <span className="text-[#170F49] font-medium">{member.education || "N/A"}</span>
                                      </div>
                                      <div>
                                        <span className="text-[#6F6C90] block text-xs mb-0.5">Occupation</span>
                                        <span className="text-[#170F49] font-medium">{member.occupation || "N/A"}</span>
                                      </div>
                                      <div>
                                        <span className="text-[#6F6C90] block text-xs mb-0.5">Health</span>
                                        <span className="text-[#170F49] font-medium">{member.health || "N/A"}</span>
                                      </div>
                                      <div>
                                        <span className="text-[#6F6C90] block text-xs mb-0.5">Income</span>
                                        <span className="text-[#170F49] font-medium">{member.income || "N/A"}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-sm text-[#6F6C90] text-center bg-white/50 rounded-xl border border-dashed border-[#E38B52]/30">
                                  No household composition data available
                                </div>
                              )}
                            </div>"""

mobile_cards_edit = """
                            {/* Mobile View - Edit Mode */}
                            <div className="md:hidden space-y-4 mt-4">
                              {householdRows.map((row) => (
                                <div key={row.id} className="bg-white/70 border border-[#E38B52]/20 rounded-xl p-4 shadow-sm relative">
                                  <div className="absolute top-4 right-4">
                                    <button
                                      type="button"
                                      onClick={() => removeHouseholdRow(row.id)}
                                      disabled={householdRows.length === 1}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" /></svg>
                                    </button>
                                  </div>
                                  <h4 className="font-semibold text-[#170F49] mb-3 flex items-center gap-2 pr-10">
                                    <span className="bg-[#E38B52] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{row.id}</span>
                                    Member Details
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs text-[#6F6C90] ml-1 mb-1 block">Name</label>
                                      <input type="text" value={row.name} onChange={(e) => updateHouseholdRow(row.id, "name", e.target.value)} className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-lg text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-[#6F6C90] ml-1 mb-1 block">Age</label>
                                        <input type="text" inputMode="numeric" value={row.age} onChange={(e) => updateHouseholdRow(row.id, "age", e.target.value)} className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-lg text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#6F6C90] ml-1 mb-1 block">Education</label>
                                        <input type="text" value={row.education} onChange={(e) => updateHouseholdRow(row.id, "education", e.target.value)} className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-lg text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#6F6C90] ml-1 mb-1 block">Occupation</label>
                                        <input type="text" value={row.occupation} onChange={(e) => updateHouseholdRow(row.id, "occupation", e.target.value)} className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-lg text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#6F6C90] ml-1 mb-1 block">Health</label>
                                        <input type="text" value={row.health} onChange={(e) => updateHouseholdRow(row.id, "health", e.target.value)} className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-lg text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none" />
                                      </div>
                                      <div className="col-span-2">
                                        <label className="text-xs text-[#6F6C90] ml-1 mb-1 block">Income</label>
                                        <input type="text" value={row.income} onChange={(e) => updateHouseholdRow(row.id, "income", e.target.value)} className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-lg text-sm focus:ring-2 focus:ring-[#E38B52] focus:outline-none" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={addHouseholdRow}
                                className="w-full flex items-center justify-center px-4 py-3 bg-white/60 border border-dashed border-[#E38B52]/40 rounded-xl text-sm font-medium text-[#E38B52] hover:bg-white/80 transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Add Member
                              </button>
                            </div>"""


def revert_corruptions():
    file_path = 'src/pages/StudentPage.jsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Strip out my injected components
    content = content.replace(mobile_cards_view, '')
    content = content.replace(mobile_cards_edit, '')
    
    # Also fix fragments from fix_fragments.py (which left rogue </> tags around)
    content = content.replace('\n                            </>', '')
    content = content.replace('<>\n                              <div className="hidden md:block overflow-x-auto pb-2">', '<div className="overflow-x-auto pb-2">')
    
    # 2. Fix the 'hidden md:block' classes I added
    content = content.replace('<div className="hidden md:block overflow-x-auto">', '<div className="overflow-x-auto">')
    content = content.replace('<div className="hidden md:block overflow-x-auto pb-2">', '<div className="overflow-x-auto pb-2">')

    # Note: `safe_patch.py` changes (grid-cols, gap) might be in there, but they are safe, no need to revert them.
    # But just in case, I will rewrite the file cleanly.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
revert_corruptions()
