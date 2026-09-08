import { useState } from 'react';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Bug,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Clock,
  Tag,
  Send,
} from 'lucide-react';

/**
 * Shared help-center shell used by both the admin and restaurant panels.
 * Each caller supplies its own title/copy and either a `guides` list
 * (rich articles opened in a reader modal) or a `faqs` list (simple
 * accordion) — whichever fits the content it actually has.
 */
export default function HelpCenterPage({
  title,
  description,
  bgClass = '#fffaf8',
  guides = [],
  faqs = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'UI/UX Issue',
    priority: 'Medium',
    description: '',
  });

  const term = searchTerm.trim().toLowerCase();
  const filteredGuides = guides.filter(
    (g) => g.title.toLowerCase().includes(term) || g.category.toLowerCase().includes(term)
  );
  const filteredFaqs = faqs.filter((f) => f.question.toLowerCase().includes(term));

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setIsTicketOpen(false);
      setTicketForm({ subject: '', category: 'UI/UX Issue', priority: 'Medium', description: '' });
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen text-slate-800 space-y-6" style={{ backgroundColor: bgClass }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
      </div>

      {/* Hero Search Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 sm:p-8 text-white shadow-md text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">How can we help you today?</h2>
        <div className="relative max-w-xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search guides, SOPs, and FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white text-slate-800 rounded-xl text-sm focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
            <BookOpen size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">SOP Documentation</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">Standard operating procedures for managing operations.</p>
          {guides.length > 0 ? (
            <button
              onClick={() => setSelectedGuide(guides[0])}
              className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"
            >
              Browse Documents <ChevronRight size={14} />
            </button>
          ) : (
            <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
              See guides below <ChevronRight size={14} />
            </span>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">System Status</h3>
          <p className="text-xs text-slate-500 mt-1 mb-1">All Systems Operational</p>
          <p className="text-[11px] text-emerald-600 font-semibold mb-3">● Payment Gateways & Maps Active</p>
          <a
            href="https://status.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"
          >
            View Live Status <ExternalLink size={12} />
          </a>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <Bug size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Report Technical Bug</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">Found a bug in the dashboard? Send a ticket directly to the dev team.</p>
          <button
            onClick={() => setIsTicketOpen(true)}
            className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:underline"
          >
            Submit Support Ticket <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Guides list (rich articles opened in a reader modal) */}
      {guides.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Popular Guides</h3>
          <div className="divide-y divide-slate-100">
            {filteredGuides.length > 0 ? (
              filteredGuides.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedGuide(item)}
                  className="py-3.5 flex items-center justify-between hover:bg-orange-50/40 px-3 rounded-xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-100 text-slate-400 group-hover:text-orange-600 transition">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition">{item.title}</p>
                      <span className="text-xs text-slate-400">{item.category} • {item.time}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-orange-600 transition" />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No matching documentation found</p>
            )}
          </div>
        </div>
      )}

      {/* FAQ accordion (simpler Q&A content) */}
      {faqs.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Popular Guides & FAQs</h3>
          <div className="space-y-3">
            {(term ? filteredFaqs : faqs).length > 0 ? (
              (term ? filteredFaqs : faqs).map((faq) => (
                <div key={faq.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 text-left font-bold text-xs text-slate-800 transition"
                  >
                    <span>{faq.question}</span>
                    {openFaqId === faq.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaqId === faq.id && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No matching FAQs found</p>
            )}
          </div>
        </div>
      )}

      {/* Guide Reader Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
                  <Tag size={12} />
                  <span>{selectedGuide.category}</span>
                  <span>•</span>
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-slate-400">{selectedGuide.time}</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedGuide.title}</h2>
              </div>
              <button onClick={() => setSelectedGuide(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-700 leading-relaxed">
              <div className="space-y-3" dangerouslySetInnerHTML={{ __html: selectedGuide.content }} />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end shrink-0">
              <button onClick={() => setSelectedGuide(null)} className="px-5 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition">
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {isTicketOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-rose-50/30">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-lg">
                <Bug size={20} />
                <h2>Submit Technical Support Ticket</h2>
              </div>
              <button onClick={() => setIsTicketOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            {ticketSent ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Ticket Submitted Successfully!</h3>
                <p className="text-xs text-slate-500">Our engineering team has been notified and will investigate the issue shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cannot update status in panel"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm bg-white"
                    >
                      <option value="UI/UX Issue">UI/UX Issue</option>
                      <option value="Payment Gateway">Payment Gateway</option>
                      <option value="API Error">API & Server Error</option>
                      <option value="Driver Map Issue">Driver / Map Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Critical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description & Steps to Reproduce</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what happened, error messages, or steps to reproduce the bug..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-sm resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTicketOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
