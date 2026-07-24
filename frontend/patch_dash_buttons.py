import os
import glob

files = ['src/pages/HeadMaster.jsx', 'src/pages/TeacherDashboard.jsx', 'src/pages/TherapistDashboard.jsx']
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    parts = content.split('{/* ================= MOBILE LAYOUT (<768px) ================= */}')
    if len(parts) > 1:
        desktop_part = parts[0]
        mobile_part = parts[1]
        
        # Enforce fixed height and truncation for mobile buttons
        mobile_part = mobile_part.replace('w-full justify-center px-4 py-3 bg-[#E38B52]', 'w-full h-[48px] justify-center px-4 bg-[#E38B52]')
        mobile_part = mobile_part.replace('flex-1 justify-center px-6 py-3 bg-[#E38B52]', 'flex-1 h-[48px] justify-center px-2 bg-[#E38B52]')
        
        # In TeacherDashboard, it might just be 'Filter', but wait, user said "Filter button doesn't handle long text (e.g. Care group Above 18 years)... Example: [ Filter: Pre Vocatio... ]"
        # Let's search for "Filter: " in the mobile part
        mobile_part = mobile_part.replace('Filter: {selectedClass !== "all" ? selectedClass : "All"}',
                                          'Filter: <span className="truncate max-w-[80px] inline-block align-bottom">{selectedClass !== "all" ? selectedClass : "All"}</span>')
        mobile_part = mobile_part.replace('Filter: {filterOption !== "all" ? filterOption : "All"}',
                                          'Filter: <span className="truncate max-w-[80px] inline-block align-bottom">{filterOption !== "all" ? filterOption : "All"}</span>')
        
        content = desktop_part + '{/* ================= MOBILE LAYOUT (<768px) ================= */}' + mobile_part
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
print("Dashboard filter buttons patched!")
