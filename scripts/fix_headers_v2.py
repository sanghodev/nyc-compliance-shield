file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_block = False

# Headers to inject
req_header_lines = [
    '                <div className="flex justify-between items-center">\n',
    '                  <div><h2 className="text-2xl font-bold text-white">Request Management</h2><p className="text-gray-400">Track and resolve tenant issues.</p></div>\n',
    '                  <div className="flex gap-2">\n',
    '                      <Button variant="outline" className="border-zinc-700 text-gray-300">Export CSV</Button>\n',
    '                  </div>\n',
    '                </div>\n'
]

pro_header_lines = [
    '              <div className="space-y-6">\n',
    '                <div className="flex justify-between items-center">\n',
    '                  <div><h2 className="text-2xl font-bold text-white">Pro Network Management</h2><p className="text-gray-400">Manage contractors, categories, and verification status.</p></div>\n',
    '                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowAddContractor(true)}><Plus className="w-4 h-4 mr-2" /> Add New Contractor</Button>\n',
    '                </div>\n' # Note: We opened a div here (space-y-6) but we won't close it explicitly yet, relying on existing structure or just closing it immediately if needed. 
    # Actually, let's NOT open space-y-6 here to avoid nesting issues. Just the header div.
]
pro_header_lines = [
    '                <div className="flex justify-between items-center mb-6">\n',
    '                  <div><h2 className="text-2xl font-bold text-white">Pro Network Management</h2><p className="text-gray-400">Manage contractors, categories, and verification status.</p></div>\n',
    '                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowAddContractor(true)}><Plus className="w-4 h-4 mr-2" /> Add New Contractor</Button>\n',
    '                </div>\n'
]


for i, line in enumerate(lines):
    # 1. Detect Empty Admin Pro Block (lines 691-693 approx)
    if "{activeTab === 'admin_pro' && (" in line:
        # Check if next 2-3 lines contain closing
        is_empty = False
        for j in range(1, 4):
            if i+j < len(lines) and ")}" in lines[i+j]:
                is_empty = True
                break
        
        if is_empty:
            skip_block = True
            # Don't add this line
            continue

    if skip_block:
        if ")}" in line:
            skip_block = False
            continue # Skip the closing brace line too
        continue

    # 2. Fix Wrong Header in Admin Requests
    if 'Pro Network Management' in line and i < 740:
        # We are likely in the Request block (since the real Pro block is > 750)
        # Verify it's inside <h2>
        if '<h2' in line:
             # Replace this whole block of header lines with Request Header
             # But the easy way is just replacing this line with the first line of Request Header
             # and skipping the button line next to it?
             # Let's brute force: if we see this line, dump the whole req_header and skip next 2 lines
             new_lines.extend(req_header_lines)
             # Variable to skip next few lines of the OLD header
             # We need to skip <div>...</div> closing tags associated with the old header
             # The old header was around 4-5 lines.
             # Let's just comment it out? No, clean replace.
             # We'll rely on "Button" in next line to skip.
             continue
    
    if 'Add New Contractor' in line and i < 740:
        continue # Skip the button line of the wrong header
    
    # 3. Add Header to Real Admin Pro (around line 751)
    if "{activeTab === 'admin_pro' && (" in line and i > 740:
        new_lines.append(line)
        new_lines.extend(pro_header_lines)
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
