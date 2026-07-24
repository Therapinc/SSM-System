import re

filepath = 'src/pages/TeacherDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

desktop_card_regex = re.compile(
    r'<div\s+key=\{therapist\.id\}\s+className="bg-white rounded-2xl p-6 shadow-md transition-all duration-300"\s*>\s*<div className="flex items-center justify-between gap-4">\s*<div>\s*<h3 className="text-lg font-semibold text-\[#170F49\]">\{therapist\.name \|\| "-"\}</h3>\s*<p className="text-sm text-\[#6F6C8F\]">Specialization: \{therapist\.specialization \|\| "-"\}</p>\s*</div>\s*<button\s+type="button"\s+onClick=\{\(\) => handleAssignStudents\(therapist\)\}\s+className="px-4 py-2 bg-\[#E38B52\] text-white rounded-lg shadow-md hover:bg-\[#E38B52\]/90 transition-transform hover:scale-105"\s*>\s*Assign Students\s*</button>\s*</div>\s*</div>',
    re.DOTALL
)

desktop_card_new = """<div
                    key={therapist.id}
                    className="bg-white rounded-2xl p-6 shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4 text-[#170F49]">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden">
                          <img src={`https://eu.ui-avatars.com/api/?name=${therapist.name.replace(" ", "+")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-[#170F49] truncate">{therapist.name || "-"}</h3>
                          <div className="mt-1 flex items-center text-sm text-[#6F6C8F] truncate">
                            <span className="text-sm mr-1.5">🩺</span> {therapist.specialization || "Not provided"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssignStudents(therapist)}
                        className="px-5 py-2 text-sm font-semibold bg-[#E38B52] text-white rounded-xl shadow-sm hover:bg-[#E38B52]/90 transition-all hover:scale-[1.02] whitespace-nowrap"
                      >
                        Assign Students
                      </button>
                    </div>
                  </div>"""


mobile_card_regex = re.compile(
    r'<div\s+key=\{therapist\.id\}\s+className="bg-white rounded-2xl p-6 shadow-md transition-all duration-300"\s*>\s*<div className="flex items-center justify-between gap-4">\s*<div>\s*<h3 className="text-\[16px\] sm:text-\[17px\] font-semibold text-\[#170F49\] truncate">\{therapist\.name \|\| "-"\}</h3>\s*<p className="text-sm text-\[#6F6C8F\]">Specialization: \{therapist\.specialization \|\| "-"\}</p>\s*</div>\s*<button\s+type="button"\s+onClick=\{\(\) => handleAssignStudents\(therapist\)\}\s+className="px-4 py-2 bg-\[#E38B52\] text-white rounded-lg shadow-md hover:bg-\[#E38B52\]/90 transition-transform hover:scale-105"\s*>\s*Assign Students\s*</button>\s*</div>\s*</div>',
    re.DOTALL
)

mobile_card_new = """<div
                    key={therapist.id}
                    className="bg-white rounded-2xl py-3 px-3.5 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-300 mb-1.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-[#170F49]">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-lg overflow-hidden shrink-0">
                          <img src={`https://eu.ui-avatars.com/api/?name=${therapist.name.replace(" ", "+")}&size=250`} alt="Therapist" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#170F49] truncate pr-2">
                            {therapist.name || "-"}
                          </h3>
                          <div className="mt-0.5 flex items-center text-[12px] sm:text-[13px] text-[#6F6C8F] truncate">
                            <span className="text-sm mr-1.5">🩺</span> {therapist.specialization || "Not provided"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 sm:mt-0 flex justify-end items-center">
                        <button
                          type="button"
                          onClick={() => handleAssignStudents(therapist)}
                          className="px-4 py-1.5 sm:px-5 sm:py-2 text-[13px] sm:text-sm font-semibold bg-[#E38B52] text-white rounded-xl shadow-sm hover:bg-[#E38B52]/90 transition-all hover:scale-[1.02] whitespace-nowrap"
                        >
                          Assign Students
                        </button>
                      </div>
                    </div>
                  </div>"""

content = desktop_card_regex.sub(desktop_card_new, content, count=1)
content = mobile_card_regex.sub(mobile_card_new, content, count=1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Replacement complete.")
