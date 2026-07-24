import re
import os

filepath = 'src/pages/StudentPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add `isDirty` state and beforeunload effect
state_injection = """
  // Global Unsaved Changes State
  const [isDirty, setIsDirty] = useState(false);
  
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
"""

# Insert near the top of StudentPage function
if 'const [isDirty, setIsDirty] = useState(false);' not in content:
    # Find a good place to insert it. E.g. right after `const { id } = useParams();` or similar
    pattern = r'const \{ id \} = useParams\(\);'
    content = re.sub(pattern, f'const {{ id }} = useParams();\n{state_injection}', content)

# 2. Case Record (formData) Drafts
# Auto-save formData to localStorage when editMode is true and formData changes
case_record_draft = """
  // Auto-save Case Record Draft
  useEffect(() => {
    if (editMode && formData && id) {
      setIsDirty(true);
      const timer = setTimeout(() => {
        localStorage.setItem(`draft_case_record_${id}`, JSON.stringify({ formData, householdRows, drugRows }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, householdRows, drugRows, editMode, id]);
"""

if '// Auto-save Case Record Draft' not in content:
    content = content.replace(state_injection, state_injection + case_record_draft)
    
# We need to hook into the editMode toggler to prompt for restoring the draft.
# Search for `setEditMode(true)`
# Actually, the user clicks "Edit" button to setEditMode(true).
# Let's find where setEditMode(true) is called.
