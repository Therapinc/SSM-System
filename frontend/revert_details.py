import os

def revert_and_fix(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Revert all details back to div
    details_str = '<details open className="group mb-6 max-md:mb-4 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-4 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none">'
    div_str = '<div className="mb-6 max-md:mb-4 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-4 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none">'
    
    content = content.replace(details_str, div_str)
    
    # Also I made a mistake where the first script generated max-md:mb-6 in the div class.
    details_str2 = '<details open className="group mb-6 max-md:mb-6 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-6 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none">'
    div_str2 = '<div className="mb-6 max-md:mb-6 md:p-6 p-0 md:border-2 md:border-[#E38B52]/30 border-b border-gray-100 max-md:pb-6 md:rounded-2xl rounded-none md:bg-gradient-to-br md:from-white md:via-orange-50/30 md:to-white md:shadow-xl max-md:bg-transparent max-md:shadow-none">'
    content = content.replace(details_str2, div_str2)

    # Revert all summary back to h3
    summary_str = '<summary className="cursor-pointer list-none flex items-center justify-between text-lg font-semibold text-[#170F49] mb-6 max-md:mb-2 max-md:py-2"><div className="flex items-center gap-2">'
    h3_str = '<h3 className="text-lg font-semibold text-[#170F49] mb-6 max-md:mb-4 flex items-center gap-2">'
    
    content = content.replace(summary_str, h3_str)
    
    close_summary = '</div><svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></summary>'
    content = content.replace(close_summary, '</h3>')

    # Remove any stray </details> that the script might have placed incorrectly?
    # Actually wait! The script might not have placed ANY </details> if it failed to match. 
    # But let's replace </details> with </div> EXCEPT for the ones that were already there!
    # Let's run eslint to see if reverting the <details> back to <div> fixes it!
    # Because if we revert <details> to <div className...>, then the trailing </div> will now match!

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

revert_and_fix('src/pages/StudentPage.jsx')
revert_and_fix('src/pages/StudentViewPage.jsx')
print("Reverted to div")
