def apply_therapy_reports_fixes(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix 1: Date Range flex layout
    old_date_range = '<div className="flex flex-row items-center min-w-[200px] gap-2">'
    new_date_range = '<div className="flex flex-col md:flex-row items-start md:items-center min-w-[200px] gap-1 md:gap-2 w-full md:w-auto">'
    content = content.replace(old_date_range, new_date_range)

    # Fix 2: Therapy flex layout
    old_therapy = '<div className="flex flex-row items-center min-w-[170px] gap-2">'
    new_therapy = '<div className="flex flex-col md:flex-row items-start md:items-center min-w-[170px] gap-1 md:gap-2 w-full md:w-auto">'
    content = content.replace(old_therapy, new_therapy)

    # Fix 3: Stats row flex wrap
    old_stats = '<div className="flex flex-row items-end gap-2 lg:justify-end lg:min-w-[320px] lg:flex-shrink-0">'
    new_stats = '<div className="flex flex-row flex-wrap justify-center sm:justify-start items-end gap-2 lg:justify-end lg:min-w-[320px] lg:flex-shrink-0">'
    content = content.replace(old_stats, new_stats)

    # Fix 4: Dashed box padding
    old_dashed = '<div className="mt-4 p-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 text-center text-gray-500 animate-fadeIn">'
    new_dashed = '<div className="mt-4 p-8 max-md:pb-20 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 text-center text-gray-500 animate-fadeIn">'
    content = content.replace(old_dashed, new_dashed)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
apply_therapy_reports_fixes('src/pages/StudentPage.jsx')
if __import__('os').path.exists('src/pages/StudentViewPage.jsx'):
    apply_therapy_reports_fixes('src/pages/StudentViewPage.jsx')
