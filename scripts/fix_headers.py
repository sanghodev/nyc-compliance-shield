file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False

# Code snippets to inject
req_header = """                <div className="flex justify-between items-center">
                  <div><h2 className="text-2xl font-bold text-white">Request Management</h2><p className="text-gray-400">Track and resolve tenant issues.</p></div>
                  <div className="flex gap-2">
                      <Button variant="outline" className="border-zinc-700 text-gray-300">Export CSV</Button>
                  </div>
                </div>
"""

pro_header = """              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div><h2 className="text-2xl font-bold text-white">Pro Network Management</h2><p className="text-gray-400">Manage contractors, categories, and verification status.</p></div>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowAddContractor(true)}><Plus className="w-4 h-4 mr-2" /> Add New Contractor</Button>
                </div>
"""

for i, line in enumerate(lines):
    # 1. Remove 691-693 (Empty admin_pro block)
    # Range is approximate, look for content
    if "{activeTab === 'admin_pro' && (" in line and ")}" in lines[i+2]:
        # This looks like the empty block we saw earlier
        skip = True
        continue
    
    if skip:
        if ")}" in line:
            skip = False
            continue
        continue

    # 2. Fix Wrong Header in Admin Requests (around line 699)
    # Look for "Pro Network Management" inside "admin_requests" block context
    if '<div><h2 className="text-2xl font-bold text-white">Pro Network Management</h2>' in line:
        # Check if we are inside admin_requests block... 
        # Actually simplest is just to replace this line if it appears before line 750
        if i < 750: 
            new_lines.append(req_header)
            continue
    
    # 3. Add Header to Admin Pro (around line 753)
    # The existing line starts with <div className="space-y-4">
    if '<div className="space-y-4">' in line and i > 740:
        # Check if previous line was {activeTab === 'admin_pro' && (
        if '{activeTab === \'admin_pro\' && (' in lines[i-1]:
            new_lines.append(pro_header)
            new_lines.append(line) # Add the space-y-4 div
            continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
