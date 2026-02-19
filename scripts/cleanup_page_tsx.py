import re

file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the lines to remove: 690 to 697 approx
# They look like:
#             {/* PRO NETWORK TAB */}
#             {activeTab === 'admin_pro' && (
#               <div className="space-y-6">
# ...
#             )}
# 
# AND THEN immediately followed by:
#             {/* ADMIN REQUESTS TAB */}

# Strategy: Remove lines if they match the broken block pattern BEFORE admin requests
new_lines = []
skip = False
for i, line in enumerate(lines):
    # Check if this is the start of the broken block (around line 690)
    # And check if line + 8 is "ADMIN REQUESTS TAB"
    if "{/* PRO NETWORK TAB */}" in line:
        # Check context: is the next block Admin Requests?
        # Let's peek ahead 8 lines or so
        is_broken = False
        for j in range(1, 15):
            if i + j < len(lines) and "{/* ADMIN REQUESTS TAB */}" in lines[i+j]:
                is_broken = True
                break
        
        if is_broken:
            # Skip this line and until "ADMIN REQUESTS TAB" starts
            # Actually, we want to remove the block but keep the ADMIN REQUESTS TAB line
            # So skip lines until we hit ADMIN REQUESTS TAB
            skip = True
    
    if skip:
        if "{/* ADMIN REQUESTS TAB */}" in line:
            skip = False
            new_lines.append(line) # Keep the Admin Requests line
        # Else: skip
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
