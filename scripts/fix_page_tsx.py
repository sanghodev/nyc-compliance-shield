import re

file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace("Shield ", "Shield, CreditCard, Camera ")

# Add Admin Requests Tab logic
admin_requests_code = """            )}
            
            {/* ADMIN REQUESTS TAB */}
            {activeTab === 'admin_requests' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div><h2 className="text-2xl font-bold text-white">Request Management</h2><p className="text-gray-400">Track and resolve tenant issues.</p></div>
                  <div className="flex gap-2">
                      <Button variant="outline" className="border-zinc-700 text-gray-300">Export CSV</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className={class_name_str(req)}>
                              {req.type === 'Repair' ? <Wrench className="w-6 h-6" /> : req.type === 'Billing' ? <CreditCard className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                          </div>
                          <div>
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-lg">{req.issue}</span>
                                  {req.priority === 'Urgent' && <Badge className="bg-red-500 text-white border-0">Urgent</Badge>}
                                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">{req.type}</Badge>
                              </div>
                              <div className="text-sm text-gray-400">{req.unit} • {req.tenantName} • {req.date}</div>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          <select 
                              className="bg-zinc-950 border border-zinc-700 text-gray-300 text-sm rounded-md px-3 py-2 outline-none focus:border-purple-500"
                              value={req.status}
                              onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  const updated = requests.map(r => r.id === req.id ? { ...r, status: newStatus } : r);
                                  setRequests(updated);
                              }}
                          >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="On Hold">On Hold</option>
                          </select>
                          <Button size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-white">Details</Button>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && <div className="text-center text-gray-500 py-12">No active requests found.</div>}
                </div>
              </div>
            )}

            {/* PRO NETWORK TAB */}
            {activeTab === 'admin_pro' && ("""

# Need to handle backticks inside f-string or string literal carefully
# Replacing the complicated className string with a placeholder + separate replace
class_name_placeholder = 'class_name_str(req)'
content = content.replace("class_name_str(req)", '`w-12 h-12 rounded-lg flex items-center justify-center ${req.priority === "Urgent" ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"}`')

# Fix the broken structure where we inserted admin_pro check inside admin_overview block earlier or similar
# We will look for the end of Admin Overview and insert Admin Requests there.
# The indicator is:
#             )}
#             
#             {/* PRO NETWORK TAB */}
#             {activeTab === 'admin_pro' && (

pattern = r'(\s+)\)}\s+\{/\* PRO NETWORK TAB \*/\}\s+\{activeTab === \'admin_pro\' && \('
replacement = r'\1)}' + admin_requests_code

# Perform replacement
# Note: Since the pattern is specific, we might need to adjust based on exact file content
# Let's try to find the exact string block instead of regex if possible
search_block = """            )}
            
            {/* PRO NETWORK TAB */}
            {activeTab === 'admin_pro' && ("""

if search_block in content:
    content = content.replace(search_block, admin_requests_code)
else:
    # If not found (maybe whitespace differ), try regex
    content = re.sub(pattern, replacement, content, count=1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
