import re

filepath = 'src/components/TherapistStudentAssignmentModal.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the right panel container (Line 555)
old_panel = '<div className="flex flex-col min-h-[400px] lg:h-full lg:min-h-[460px] overflow-hidden rounded-3xl border border-slate-200 bg-white">'
new_panel = '<div className="flex flex-col h-auto lg:h-full lg:min-h-[460px] lg:overflow-hidden rounded-3xl border border-slate-200 bg-white">'
content = content.replace(old_panel, new_panel)

# 2. Update the table container (Line 562)
old_table_container = '<div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">'
new_table_container = '<div className="flex-1 overflow-y-visible lg:overflow-y-auto px-3 py-3 sm:px-4">'
content = content.replace(old_table_container, new_table_container)

# 3. Move the footer out of the grid
# Extract the footer block
footer_pattern = re.compile(
    r'(<div className="sticky bottom-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">.*?</button>\s*</div>\s*</div>)',
    re.DOTALL
)

match = footer_pattern.search(content)
if match:
    footer_block = match.group(1)
    
    # Remove it from its current position
    content = content.replace(footer_block, '')
    
    insert_target = """        </div>
      </div>
      {showConfirmClose && ("""
      
    replacement = f"""        </div>
        
        {{/* Full-width sticky footer for both mobile and desktop */}}
        {footer_block.replace('sticky bottom-0', 'sticky bottom-0 mt-auto rounded-b-3xl')}
      </div>
      {{showConfirmClose && ("""
      
    content = content.replace(insert_target, replacement)
    
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
