file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verify the content matches our expectation (approx)
# Line 694 (index 693) should contain "div className"
if '<div className="flex justify-between items-center">' in lines[693]:
    print("Found target block at line 694")
    
    # We want to replace lines 694-702 (indexes 693-701 inclusive)
    # The new content is simpler.
    
    new_content = [
        '                <div className="flex justify-between items-center">\n',
        '                  <div><h2 className="text-2xl font-bold text-white">Request Management</h2><p className="text-gray-400">Track and resolve tenant issues.</p></div>\n',
        '                  <div className="flex gap-2">\n',
        '                      <Button variant="outline" className="border-zinc-700 text-gray-300">Export CSV</Button>\n',
        '                  </div>\n',
        '                </div>\n'
    ]
    
    # Check if lines[701] is indeed only "</div>" or close to it
    # Just replace the block safely by index
    final_lines = lines[:693] + new_content + lines[702:] # index 702 is line 703 (empty line after block)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print("Replaced lines successfully.")

else:
    print("Line 694 does not match expected content. Aborting.")
    print("Line 694 content:", lines[693])
