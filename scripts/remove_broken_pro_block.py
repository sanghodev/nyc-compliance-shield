file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
buffer = []

for line in lines:
    # Detect start of potentially broken block
    if "{activeTab === 'admin_pro' && (" in line:
        buffer.append(line)
        continue
    
    if buffer:
        buffer.append(line)
        # Check if block closes quickly (suggesting broken/dup block)
        if ")}" in line:
            # Check length and content
            content = "".join(buffer)
            # If it's short (e.g. < 10 lines) AND contains "Pro Network Management"
            # It is likely the junk block at 682-688
            # The real block is much longer (it has filters, lists, etc)
            if len(buffer) < 12 and "Pro Network Management" in content:
                print("Found and removing broken Admin Pro block:")
                print(content)
                buffer = [] # Discard buffer (delete lines)
                continue
            else:
                # Not the target, keep lines
                new_lines.extend(buffer)
                buffer = []
        # If buffer gets too long, it's the real block, flush it
        elif len(buffer) > 20: 
             new_lines.extend(buffer)
             buffer = []
    else:
        new_lines.append(line)

# Flush remaining buffer if any
if buffer:
    new_lines.extend(buffer)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
