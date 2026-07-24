import re

filepath = 'src/pages/TherapistDashboard.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Card Width (Padding)
content = content.replace(
    '<div className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 z-10">',
    '<div className="flex-1 w-full max-w-7xl mx-auto px-0 py-2 sm:p-4 z-10">'
)
content = content.replace(
    '<div className="relative bg-white/30 backdrop-blur-xl rounded-[24px] shadow-xl p-4 sm:p-6 border border-white/20 h-auto min-h-[50dvh] mb-6">',
    '<div className="relative bg-white/30 backdrop-blur-xl rounded-none sm:rounded-[24px] shadow-xl p-4 sm:p-6 border-y sm:border border-white/20 h-auto min-h-[50dvh] mb-6">'
)

# 2. Update Search & Filter Row
search_wrapper_old = '<div className="flex flex-col md:flex-row justify-between items-center mb-5 px-2 gap-3">'
search_wrapper_new = '<div className="flex flex-row justify-between items-center mb-5 gap-3">'
content = content.replace(search_wrapper_old, search_wrapper_new)

# Update Search input container (first instance only for mobile block)
mobile_search_pattern = re.compile(
    r'<div className="flex flex-col md:flex-row justify-between items-center mb-5 px-2 gap-3">.*?<div className="relative">.*?<input.*?className="(.*?)".*?/>.*?<div className="flex items-center gap-3 w-full">',
    re.DOTALL
)

def search_replacer(match):
    input_class = match.group(1)
    new_input_class = input_class.replace('w-full', 'w-full').replace('pl-10', 'pl-9').replace('pr-10', 'pr-8').replace('py-3', 'py-2.5 text-sm')
    
    return f"""<div className="flex flex-row items-center mb-5 gap-2 sm:gap-3 w-full">
            {{/* Search Bar */}}
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search..."
                className="{new_input_class}"
                value={{studentSearch}}
                onChange={{(e) => setStudentSearch(e.target.value)}}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              {{studentSearch && (
                <button
                  type="button"
                  onClick={{() => setStudentSearch("")}}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={{2}}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}}
            </div>

            <div className="flex items-center shrink-0">"""

content = mobile_search_pattern.sub(search_replacer, content)

filter_btn_old = 'className="px-5 py-2.5 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all flex items-center gap-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_8px_-1px_rgba(0,0,0,0.1)]"'
filter_btn_new = 'className="px-3 sm:px-5 py-2.5 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all flex items-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg text-[13px] sm:text-base whitespace-nowrap"'
content = content.replace(filter_btn_old, filter_btn_new)
content = content.replace('Filter Students', 'Filter')


# 3. Update Bottom Nav
bottom_nav_old = '<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-[60] px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">'
bottom_nav_new = '<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-center gap-16 sm:gap-24 items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-[60] px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">'
content = content.replace(bottom_nav_old, bottom_nav_new)

nav_item_old = 'className="flex flex-col items-center justify-center w-full h-16 transition text-[#E38B52]"'
nav_item_new = 'className="flex flex-col items-center justify-center w-20 h-16 transition text-[#E38B52]"'
content = content.replace(nav_item_old, nav_item_new)

nav_item_2_old = 'className="relative flex flex-col items-center justify-center w-full h-16 group"'
nav_item_2_new = 'className="relative flex flex-col items-center justify-center w-20 h-16 group"'
content = content.replace(nav_item_2_old, nav_item_2_new)


# 4. Update the Mobile Student Card
# Now we replace EXACTLY the block we want.
import re

mobile_card_regex = re.compile(
    r'<div\s+key=\{student\.id\}\s+onClick=\{\(\) => handleStudentClick\(student\.id\)\}\s+className="bg-white rounded-2xl py-2\.5 px-3 sm:p-4 shadow-\[0_2px_10px_rgba\(0,0,0,0\.08\)\] hover:shadow-md transition-all duration-300 cursor-pointer mb-1\.5"\s*>.*?</button>\s*</div>\s*</div>',
    re.DOTALL
)

new_mobile_card = """<div
                  key={student.id}
                  onClick={() => handleStudentClick(student.id)}
                  className="bg-white rounded-2xl py-2.5 px-3.5 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-300 cursor-pointer mb-1.5"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 text-[#170F49]">
                    <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-lg overflow-hidden shrink-0">
                      <img
                        src={
                          student.photo_url ||
                          `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(
                            student.name || "S",
                          )}&size=250&background=EFEFEF&color=170F49`
                        }
                        alt="Student"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/64x64/EFEFEF/AAAAAA?text=Photo";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#170F49] truncate pr-2">
                          {student.name}
                        </h3>
                        <span className="text-slate-300 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center text-[12px] sm:text-[13px] text-[#6F6C8F] truncate">
                        {student.class_name || student.className || "Unknown"}
                        <span className="mx-1.5 opacity-50">•</span>
                        Div {student.division || "-"}
                        <span className="mx-1.5 opacity-50">•</span>
                        Roll {student.roll_no || student.rollNo || "—"}
                      </div>
                      <div className="mt-2.5 sm:mt-3 flex justify-end">
                        <button
                          className="px-4 py-1.5 sm:px-5 sm:py-2 text-[13px] sm:text-sm font-semibold bg-[#E38B52] text-white rounded-xl shadow-sm hover:bg-[#E38B52]/90 transition-all hover:scale-[1.02]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setShowReportDialog(true);
                            setReportDate(new Date().toISOString().slice(0, 10));
                            const initialType = specialization || "Speech Therapy";
                            setTherapyType(initialType);
                            setProgressLevel("Excellent");
                            setUnlockedGoals({});
                            loadPreviousGoals(student.id, initialType);
                          }}
                        >
                          Enter Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>"""

# Ensure we only replace the second occurrence which is the mobile one by searching for the unique mobile class
content = mobile_card_regex.sub(new_mobile_card, content, count=1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
