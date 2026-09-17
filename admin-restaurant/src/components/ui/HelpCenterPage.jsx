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
  bgClass = 'bg-slate-100',
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
    <div className={`p-4 sm:p-8 min-h-screen text-slate-800 space-y-6 font-sans rounded-none ${bgClass}`}>
      
      {/* Header */}
      <div className="border-b border-slate-300 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{description}</p>
      </div>

      {/* Hero Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-none p-6 sm:p-10 text-white shadow-sm text-center space-y-5">
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-100">
          How can we help you today?
        </h2>
        <div className="relative max-w-xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search guides, SOPs, and FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 border border-transparent rounded-none text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SOP Documentation */}
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm hover:border-blue-900 transition-colors group">
          <div className="w-12 h-12 rounded-none bg-slate-50 border border-slate-200 text-blue-900 flex items-center justify-center mb-4 group-hover:bg-blue-900 group-hover:text-white transition-colors">
            <BookOpen size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">SOP Documentation</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-4">Standard operating procedures for managing operations.</p>
          {guides.length > 0 ? (
            <button
              onClick={() => setSelectedGuide(guides[0])}
              className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1 hover:text-blue-950 transition-colors"
            >
              Browse Documents <ChevronRight size={14} />
            </button>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              See guides below <ChevronRight size={14} />
            </span>
          )}
        </div>

        {/* System Status */}
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm hover:border-emerald-600 transition-colors group">
          <div className="w-12 h-12 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">System Status</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-2">All Systems Operational</p>
          <div className="inline-block px-2.5 py-1 mb-4 bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-bold uppercase tracking-widest">
            ● Payment Gateways Active
          </div>
          <a
            href="https://status.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 hover:text-emerald-800 transition-colors"
          >
            View Live Status <ExternalLink size={12} />
          </a>
        </div>

        {/* Report Bug */}
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm hover:border-rose-600 transition-colors group">
          <div className="w-12 h-12 rounded-none bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Bug size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Report Technical Bug</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-4">Found a bug in the dashboard? Send a ticket to the dev team.</p>
          <button
            onClick={() => setIsTicketOpen(true)}
            className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1 hover:text-rose-800 transition-colors"
          >
            Submit Support Ticket <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Guides List */}
      {guides.length > 0 && (
        <div className="bg-white rounded-none border border-slate-300 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-3">
            Popular Guides
          </h3>
          <div className="flex flex-col">
            {filteredGuides.length > 0 ? (
              filteredGuides.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedGuide(item)}
                  className="py-4 flex items-center justify-between hover:bg-slate-50 px-2 transition-colors cursor-pointer group border-b border-slate-100 last:border-0 rounded-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-none group-hover:bg-blue-50 group-hover:border-blue-200 text-slate-400 group-hover:text-blue-900 transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">{item.title}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                        {item.category} • {item.time}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-900 transition-colors" />
                </div>
              ))
            ) : (
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 py-6 text-center">
                No matching documentation found
              </p>
            )}
          </div>
        </div>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-200 pb-3">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {(term ? filteredFaqs : faqs).length > 0 ? (
              (term ? filteredFaqs : faqs).map((faq) => (
                <div key={faq.id} className="border border-slate-300 rounded-none overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    className={`w-full flex items-center justify-between p-4 text-left font-bold text-xs uppercase tracking-wide text-slate-900 hover:bg-slate-50 transition-colors ${
                      openFaqId === faq.id ? 'bg-slate-50 border-b border-slate-300' : 'bg-white'
                    }`}
                  >
                    <span>{faq.question}</span>
                    {openFaqId === faq.id ? <ChevronUp size={16} className="text-blue-900" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  {openFaqId === faq.id && (
                    <div className="p-4 bg-white text-xs text-slate-700 font-medium leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 py-6 text-center">
                No matching FAQs found
              </p>
            )}
          </div>
        </div>
      )}

      {/* Guide Reader Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-none">
          <div className="bg-white w-full max-w-2xl rounded-none border border-slate-400 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-slate-300 shrink-0 bg-slate-50">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-900">
                  <Tag size={12} />
                  <span>{selectedGuide.category}</span>
                  <span className="text-slate-300">•</span>
                  <Clock size={12} className="text-slate-500" />
                  <span className="text-slate-500">{selectedGuide.time}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedGuide.title}</h2>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-transparent hover:border-slate-300 transition-colors rounded-none"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-sm text-slate-800 font-medium leading-relaxed bg-white">
              <div className="space-y-4 prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: selectedGuide.content }} />
            </div>
            
            <div className="p-5 border-t border-slate-300 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedGuide(null)}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-900 hover:bg-blue-950 border border-blue-950 rounded-none transition-colors shadow-sm"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {isTicketOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-none">
          <div className="bg-white w-full max-w-lg rounded-none border border-slate-400 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-rose-200 bg-rose-50">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm uppercase tracking-wide">
                <Bug size={18} />
                <h2>Submit Technical Support Ticket</h2>
              </div>
              <button
                onClick={() => setIsTicketOpen(false)}
                className="p-1.5 text-rose-500 hover:text-rose-900 bg-white border border-transparent hover:border-rose-200 transition-colors rounded-none"
              >
                <X size={18} />
              </button>
            </div>

            {ticketSent ? (
              <div className="p-10 text-center space-y-4">
                <div className="w-14 h-14 border border-emerald-300 bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto rounded-none">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Ticket Submitted Successfully</h3>
                  <p className="text-xs text-slate-600 font-medium mt-2">Our engineering team has been notified and will investigate the issue shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="p-6 space-y-5 bg-white">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">
                    Issue Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cannot update status in panel"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none focus:outline-none focus:border-rose-600 text-xs font-medium transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">
                      Category
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-none focus:outline-none focus:border-rose-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <option value="UI/UX Issue">UI/UX Issue</option>
                      <option value="Payment Gateway">Payment Gateway</option>
                      <option value="API Error">API & Server Error</option>
                      <option value="Driver Map Issue">Driver / Map Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">
                      Priority
                    </label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-none focus:outline-none focus:border-rose-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Critical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">
                    Description & Steps to Reproduce
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what happened, error messages, or steps to reproduce the bug..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-none focus:outline-none focus:border-rose-600 text-xs font-medium transition-colors resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsTicketOpen(false)}
                    className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200 border border-slate-300 bg-slate-100 rounded-none transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white bg-rose-700 hover:bg-rose-800 border border-rose-900 rounded-none shadow-sm flex items-center gap-2 transition-colors"
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