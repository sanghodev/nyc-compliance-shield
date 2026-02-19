file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
# Remove Lines 690 to 697 (approx)
# But verify content to be safe.
# Line 690 should be:             {/* PRO NETWORK TAB */}
# Line 697 should be:             )}

start_remove = -1
end_remove = -1

for i, line in enumerate(lines):
    # Adjust index for 1-based line number match? No, enumerate starts at 0.
    # Line 690 in view file corresponds to index 689.
    if i == 689:
        if "{/* PRO NETWORK TAB */}" in line:
            start_remove = i
    
    if i == 696: # Line 697
        if ")}" in line:
            end_remove = i
            break # Found the block

# If matched, skip these lines
if start_remove != -1 and end_remove != -1:
    print(f"Removing lines {start_remove+1} to {end_remove+1}")
    new_lines = lines[:start_remove] + lines[end_remove+1:]
else:
    print("Could not find exact block by line number. Trying content matching.")
    # Content matching fallback
    skip = False
    for line in lines:
        if "{/* PRO NETWORK TAB */}" in line:
             # Check next line
             # This is risky if there are multiple matches
             pass
    # Let's trust the line numbers from recent view_file (1689)
    # 690: {/* PRO NETWORK TAB */}
    # ...
    # 697: )}
    
    # Just filter out this specific block using content signature
    # Signature: 
    # {activeTab === 'admin_pro' && (
    #   <div className="space-y-6">
    #     <div className="flex justify-between items-center">
    #       <div><h2 className="text-2xl font-bold text-white">Pro Network Management</h2>...
    #       <Button ...
    #     </div>
    # )}
    
    # We will buffer lines and check for this pattern
    filtered_lines = []
    buffer = []
    
    for line in lines:
        if "{/* PRO NETWORK TAB */}" in line:
            buffer.append(line)
            continue
        
        if buffer:
            buffer.append(line)
            if ")}" in line and len(buffer) < 10: # Short block
                # Check if it contains "Pro Network Management"
                content = "".join(buffer)
                if "Pro Network Management" in content and "activeTab === 'admin_pro'" in content:
                    # This is the duplicate block! Discard buffer.
                    buffer = [] 
                    continue
                else:
                    # Not the target, flush buffer
                    filtered_lines.extend(buffer)
                    buffer = []
            elif len(buffer) > 20: # Safety valve
                 filtered_lines.extend(buffer)
                 buffer = []
        else:
            filtered_lines.append(line)
            
    if buffer: filtered_lines.extend(buffer)
    new_lines = filtered_lines

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
