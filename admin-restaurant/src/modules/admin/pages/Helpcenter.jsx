import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Bug, 
  ExternalLink, 
  CheckCircle, 
  ChevronRight,
  X,
  Clock,
  Tag,
  Send,
  AlertCircle
} from 'lucide-react';

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);
  
  // State សម្រាប់ Support Ticket Modal & Form
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'UI/UX Issue',
    priority: 'Medium',
    description: ''
  });

  const guides = [
    { 
      id: 1,
      title: 'How to verify new driver documents', 
      category: 'Driver Management', 
      time: '5 min read',
      content: `
        <h3 className="font-bold text-gray-900 text-base mb-1">1. Identity Verification</h3>
        <p className="mb-3">Ensure candidate drivers provide a valid National ID or Passport. Verify that the photo and personal details match their registration information.</p>
        <h3 className="font-bold text-gray-900 text-base mb-1">2. Check Driving License & Vehicle Documents</h3>
        <p className="mb-3">Inspect the driving license for the appropriate vehicle type (motorcycle or car) along with valid vehicle registration documentation.</p>
        <h3 className="font-bold text-gray-900 text-base mb-1">3. Approval in Admin Panel</h3>
        <p>Navigate to <strong>Driver Management Panel</strong> &rarr; Select drivers with status <em>"Pending"</em> &rarr; Click <strong>Verify</strong> to enable them to receive customer orders.</p>
      `
    },
    { 
      id: 2,
      title: 'Processing manual refunds & chargebacks', 
      category: 'Payments', 
      time: '3 min read',
      content: `
        <h3 className="font-bold text-gray-900 text-base mb-1">1. Check Transaction History</h3>
        <p className="mb-3">Go to <strong>Payments</strong> &rarr; <strong>Transaction History</strong> and search for the order using Order ID or Customer Name.</p>
        <h3 className="font-bold text-gray-900 text-base mb-1">2. Initiate Refund Request</h3>
        <p className="mb-3">If an item is missing or damaged, click the <strong>Issue Refund</strong> button and enter the corresponding refund amount.</p>
        <h3 className="font-bold text-gray-900 text-base mb-1">3. Confirm Refund</h3>
        <p>The system will process and return the funds to the customer's original payment method (e.g., ABA Pay / E-Wallet) within 24–48 hours.</p>
      `
    },
    { 
      id: 3,
      title: 'Resolving flagged reviews and complaints', 
      category: 'Reviews', 
      time: '4 min read',
      content: `
        <h3 className="font-bold text-gray-900 text-base mb-1">1. Review Inappropriate Content</h3>
        <p className="mb-3">Reviews containing inappropriate language, profanity, or false claims are automatically routed to the Flagged Section.</p>
        <h3 className="font-bold text-gray-900 text-base mb-1">2. Take Resolution Action</h3>
        <p>Administrators can choose to <strong>Approve</strong> if the review is legitimate or click <strong>Hide/Delete</strong> if it violates platform policy.</p>
      `
    },
    { 
      id: 4,
      title: 'Setting up restaurant commission rates', 
      category: 'Restaurants', 
      time: '6 min read',
      content: `
        <h3 className="font-bold text-gray-900 text-base mb-1">1. Configure Commission Percentage</h3>
        <p className="mb-3">Navigate to <strong>Restaurants</strong> &rarr; Select Restaurant &rarr; <strong>Edit Profile</strong>, then set the Commission Rate (e.g., 15% or 20%).</p>
        <h3 className="font-bold text-gray-900 text-base mb-1">2. Save Changes</h3>
        <p>Platform commissions for all incoming new orders will automatically be calculated based on the updated percentage rate.</p>
      `
    },
  ];

  // Submit Ticket Handler
  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setIsTicketOpen(false);
      setTicketForm({ subject: '', category: 'UI/UX Issue', priority: 'Medium', description: '' });
    }, 2000);
  };

  // Search Filter
  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-gray-800 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Admin Help Center</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Documentation, SOP guidelines, and technical support for admins.</p>
      </div>

      {/* Hero Search Bar */}
      <div className="bg-gradient-to-r from-[#f96b44] to-[#e05630] rounded-2xl p-6 sm:p-8 text-white shadow-md text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">How can we help you today?</h2>
        <div className="relative max-w-xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SOPs, driver guides, payment issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white text-gray-800 rounded-xl text-sm focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#f96b44] flex items-center justify-center mb-3">
            <BookOpen size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base">SOP Documentation</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">Standard operating procedures for managing platform operations.</p>
          <button 
            onClick={() => setSelectedGuide(guides[0])}
            className="text-xs font-bold text-[#f96b44] flex items-center gap-1 hover:underline"
          >
            Browse Documents <ChevronRight size={14} />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base">System Status</h3>
          <p className="text-xs text-gray-500 mt-1 mb-1">All Systems Operational</p>
          <p className="text-[11px] text-emerald-600 font-semibold mb-3">● Payment Gateways & Maps Active</p>
          <button className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
            View Live Status <ExternalLink size={12} />
          </button>
        </div>

        {/* Technical Bug Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <Bug size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Report Technical Bug</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">Found a bug in dashboard? Send ticket directly to dev team.</p>
          <button 
            onClick={() => setIsTicketOpen(true)}
            className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:underline"
          >
            Submit Support Ticket <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Popular Admin Guides List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Popular Admin Guides</h3>
        <div className="divide-y divide-gray-100">
          {filteredGuides.length > 0 ? (
            filteredGuides.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedGuide(item)}
                className="py-3.5 flex items-center justify-between hover:bg-orange-50/40 px-3 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-orange-100 text-gray-400 group-hover:text-[#f96b44] transition">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-[#f96b44] transition">{item.title}</p>
                    <span className="text-xs text-gray-400">{item.category} • {item.time}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-[#f96b44] transition" />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No matching documentation found</p>
          )}
        </div>
      </div>

      {/* Document Reader Modal Popup */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#f96b44]">
                  <Tag size={12} />
                  <span>{selectedGuide.category}</span>
                  <span>•</span>
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-gray-400">{selectedGuide.time}</span>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">{selectedGuide.title}</h2>
              </div>
              <button onClick={() => setSelectedGuide(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed">
              <div className="space-y-3" dangerouslySetInnerHTML={{ __html: selectedGuide.content }} />
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end shrink-0">
              <button onClick={() => setSelectedGuide(null)} className="px-5 py-2 text-sm font-medium text-white bg-[#f96b44] hover:bg-[#e05630] rounded-xl shadow-sm transition">
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Support Ticket Modal Popup */}
      {isTicketOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-rose-50/30">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
                <Bug size={20} />
                <h2>Submit Technical Support Ticket</h2>
              </div>
              <button 
                onClick={() => setIsTicketOpen(false)} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content / Form */}
            {ticketSent ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Ticket Submitted Successfully!</h3>
                <p className="text-xs text-gray-500">Our engineering team has been notified and will investigate the issue shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Issue Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cannot update driver status in panel"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm bg-white"
                    >
                      <option value="UI/UX Issue">UI/UX Issue</option>
                      <option value="Payment Gateway">Payment Gateway</option>
                      <option value="API Error">API & Server Error</option>
                      <option value="Driver Map Issue">Driver / Map Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Critical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description & Steps to Reproduce</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what happened, error messages, or steps to reproduce the bug..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTicketOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Send size={14} /> Send Ticket
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}